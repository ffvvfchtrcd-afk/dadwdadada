import { supabase } from '../configuracoes/supabase';
import { ServicoLogs } from './servico_logs';

export const ServicoAutenticacao = {
  // Realiza login pesquisando na tabela 'users'
  async login(emailOuNome, senha) {
    try {
      if (!emailOuNome || !senha) {
        throw new Error("Preencha todos os campos.");
      }

      // Busca todos os usuários ativos
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'ATIVO');

      if (error) {
        throw new Error(error.message);
      }

      // Procura correspondência por e-mail ou nome (case-insensitive)
      const usuarioEncontrado = users.find(u => 
        (u.email?.toLowerCase() === emailOuNome.toLowerCase() || 
         u.nome?.toLowerCase() === emailOuNome.toLowerCase()) &&
        u.senha === senha
      );

      if (!usuarioEncontrado) {
        throw new Error("Usuário ou senha incorretos.");
      }

      // Remove campo sensível de senha antes de salvar na sessão
      const usuarioSessao = { ...usuarioEncontrado };
      delete usuarioSessao.senha;

      localStorage.setItem('nexmarket_user', JSON.stringify(usuarioSessao));
      
      ServicoLogs.adicionarLog(
        "USUARIO_LOGIN",
        `Usuário ${usuarioSessao.nome} logou no sistema.`,
        "sucesso"
      );

      return { sucesso: true, usuario: usuarioSessao };
    } catch (erro) {
      ServicoLogs.adicionarLog("LOGIN_FALHA", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  },

  // Cadastra um novo usuário na tabela 'users'
  async registrar(nome, email, senha) {
    try {
      if (!nome || !senha) {
        throw new Error("Nome e Senha são obrigatórios.");
      }

      // Busca usuários para validação de duplicidade
      const { data: users, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      const emailFinal = email && email.trim() !== '' 
        ? email.trim() 
        : `user-${Date.now()}@nexmarket.com`;

      // Verifica se e-mail ou nome já existem
      if (email && users.find(u => u.email?.toLowerCase() === emailFinal.toLowerCase())) {
        throw new Error("E-mail já cadastrado.");
      }

      if (users.find(u => u.nome?.toLowerCase() === nome.toLowerCase())) {
        throw new Error("Nome de usuário já em uso.");
      }

      const novoUsuario = {
        id: Date.now(),
        nome: nome.trim(),
        email: emailFinal,
        senha: senha,
        role: 'USER',
        cargo: 'CLIENTE',
        status: 'ATIVO',
        saldo: 0.00,
        comprasIds: '',
        emailVerificado: false,
        dataCadastro: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        dataCriacao: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('users')
        .insert([novoUsuario])
        .select();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Salva sessão localmente
      const usuarioSessao = { ...novoUsuario };
      delete usuarioSessao.senha;

      localStorage.setItem('nexmarket_user', JSON.stringify(usuarioSessao));

      ServicoLogs.adicionarLog(
        "USUARIO_CADASTRO",
        `Novo usuário registrado: ${usuarioSessao.nome}`,
        "sucesso"
      );

      return { sucesso: true, usuario: usuarioSessao };
    } catch (erro) {
      ServicoLogs.adicionarLog("CADASTRO_FALHA", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  },

  // Retorna o usuário atualmente logado da sessão local
  obterUsuarioLogado() {
    try {
      const userStr = localStorage.getItem('nexmarket_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (erro) {
      localStorage.removeItem('nexmarket_user');
      return null;
    }
  },

  // Remove a sessão de login
  logout() {
    try {
      const usuario = this.obterUsuarioLogado();
      if (usuario) {
        ServicoLogs.adicionarLog(
          "USUARIO_LOGOUT",
          `Usuário ${usuario.nome} deslogou.`,
          "info"
        );
      }
      localStorage.removeItem('nexmarket_user');
    } catch (erro) {
      console.error(erro);
    }
  }
};
