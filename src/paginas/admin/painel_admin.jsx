import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { supabase } from '../../configuracoes/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Users, ShoppingBag, Layers, Key, ArrowLeft, ShieldAlert, Package, Clock, CheckCircle, AlertTriangle, Database, Settings, Bot } from 'lucide-react';
import { FormatarMoeda } from '../../utilitarios/formatadores';

export default function PainelAdmin() {
  const { usuario, eAdmin } = useAuth();
  const navigate = useNavigate();

  const [gerandoSeed, setGerandoSeed] = useState(false);
  const [mensagemSeed, setMensagemSeed] = useState('');

  const [estatisticas, setEstatisticas] = useState({
    totalFaturamento: 0,
    totalVendas: 0,
    totalUsuarios: 0,
    totalProdutos: 0,
    pedidosPendentes: 0,
    pedidosEntregues: 0,
    pedidosManuaisPendentes: 0,
    totalChavesEstoque: 0
  });
  const [carregando, setCarregando] = useState(true);

  const carregarMetricas = async () => {
    try {
      setCarregando(true);
      
      const { data: compras } = await supabase.from('compras').select('*');
      const { data: users } = await supabase.from('users').select('id');
      const { data: products } = await supabase.from('products').select('id');
      const { data: variacoes } = await supabase.from('variacoes').select('quantidadeStock, estoque_tipo');

      const comprasArr = compras || [];
      const faturamento = comprasArr
        .filter(c => c.status === 'ENTREGUE' || c.status === 'PAGO' || c.status === 'PROCESSANDO')
        .reduce((sum, c) => sum + (c.total || 0), 0);

      const pedidosPendentes = comprasArr.filter(c => c.status === 'AGUARDANDO_PAGAMENTO' || c.status === 'PROCESSANDO').length;
      const pedidosEntregues = comprasArr.filter(c => c.status === 'ENTREGUE').length;
      const pedidosManuaisPendentes = comprasArr.filter(c => c.status === 'PENDENTE_SUPORTE').length;

      const totalChaves = (variacoes || [])
        .filter(v => v.estoque_tipo === 'AUTOMATICA')
        .reduce((sum, v) => sum + (v.quantidadeStock || 0), 0);

      setEstatisticas({
        totalFaturamento: faturamento,
        totalVendas: comprasArr.length,
        totalUsuarios: (users || []).length,
        totalProdutos: (products || []).length,
        pedidosPendentes,
        pedidosEntregues,
        pedidosManuaisPendentes,
        totalChavesEstoque: totalChaves
      });
    } catch (err) {
      console.error("Erro ao carregar métricas do painel:", err);
    } finally {
      setCarregando(false);
    }
  };

  const gerarDadosDeTeste = async () => {
    if(!window.confirm('Isso vai injetar produtos e variações de teste (Netflix, Spotify, Valorant) no seu banco de dados para testes. Deseja continuar?')) return;
    setGerandoSeed(true);
    setMensagemSeed('Gerando Produtos e Estoque...');
    
    try {
      // 0. Criar Categorias se não existirem
      await supabase.from('categories').insert([
        { nome: 'Streaming', status: 'ATIVO' },
        { nome: 'Jogos', status: 'ATIVO' }
      ]); // Vai falhar silenciosamente nas duplicadas se o banco não permitir, o que não é um problema.

      // 1. Criar Produto Netflix
      const pNetflixId = Date.now();
      await supabase.from('products').insert([{
        id: pNetflixId,
        nome: "Netflix Premium 4K",
        descricao: "Conta Netflix Premium 4K - 1 Tela Compartilhada (30 Dias)",
        miniDesc: "Entrega super rápida",
        categoria: "Streaming",
        bannerUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=600",
        status: 'ATIVO',
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      }]);

      await supabase.from('variacoes').insert([
        {
          produtoId: pNetflixId,
          nome: "1 Mês (Automática)",
          preco: 15.00,
          estoque_tipo: "AUTOMATICA",
          stockData: ["netflix1@email.com:senha123", "netflix2@email.com:senha456", "netflix3@email.com:senha789"],
          quantidadeStock: 3,
          status: 'ATIVO',
          dataAtualizacao: new Date().toISOString()
        },
        {
          produtoId: pNetflixId,
          nome: "3 Meses (Automática)",
          preco: 35.00,
          estoque_tipo: "AUTOMATICA",
          stockData: ["netflix3m_1@email.com:senha123", "netflix3m_2@email.com:senha456"],
          quantidadeStock: 2,
          status: 'ATIVO',
          dataAtualizacao: new Date().toISOString()
        }
      ]);

      // 2. Criar Produto Spotify
      const pSpotifyId = Date.now() + 100;
      await supabase.from('products').insert([{
        id: pSpotifyId,
        nome: "Spotify Premium Upgrade",
        descricao: "Fazemos o upgrade da sua própria conta para Premium.",
        miniDesc: "Upgrade 100% legal",
        categoria: "Streaming",
        bannerUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=600",
        status: 'ATIVO',
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      }]);

      await supabase.from('variacoes').insert([
        {
          produtoId: pSpotifyId,
          nome: "Upgrade na sua conta (Manual)",
          preco: 8.90,
          estoque_tipo: "MANUAL",
          stockData: [],
          quantidadeStock: 0,
          status: 'ATIVO',
          dataAtualizacao: new Date().toISOString()
        }
      ]);

      // 3. Criar Produto Jogos
      const pValId = Date.now() + 200;
      await supabase.from('products').insert([{
        id: pValId,
        nome: "Valorant Points VP",
        descricao: "Código (Gift Card) para resgatar VP no Valorant",
        miniDesc: "Gift Cards oficiais",
        categoria: "Jogos",
        bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
        status: 'ATIVO',
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      }]);

      await supabase.from('variacoes').insert([
        {
          produtoId: pValId,
          nome: "600 VP (Gift Card)",
          preco: 20.00,
          estoque_tipo: "AUTOMATICA",
          stockData: ["VAL-1234-ABCD-5678", "VAL-5678-EFGH-1234"],
          quantidadeStock: 2,
          status: 'ATIVO',
          dataAtualizacao: new Date().toISOString()
        },
        {
          produtoId: pValId,
          nome: "1200 VP (Gift Card)",
          preco: 35.00,
          estoque_tipo: "AUTOMATICA",
          stockData: ["VAL-9999-XXXX-YYYY"],
          quantidadeStock: 1,
          status: 'ATIVO',
          dataAtualizacao: new Date().toISOString()
        }
      ]);

      setMensagemSeed('✅ Dados de teste gerados com sucesso!');
      carregarMetricas();
      setTimeout(() => setMensagemSeed(''), 4000);
    } catch(e) {
      console.error(e);
      setMensagemSeed('❌ Erro ao gerar dados. Verifique o console.');
      setTimeout(() => setMensagemSeed(''), 4000);
    } finally {
      setGerandoSeed(false);
    }
  };

  useEffect(() => {
    if (!eAdmin) {
      navigate('/');
      return;
    }
    carregarMetricas();
  }, [eAdmin]);

  if (!eAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="font-bold text-lg text-white mb-2">Acesso Negado</h3>
        <p className="text-zinc-400 text-xs">Esta página é restrita para administradores do sistema.</p>
      </div>
    );
  }

  const cards = [
    { label: 'Faturamento', valor: FormatarMoeda(estatisticas.totalFaturamento), icone: BarChart3, cor: 'text-emerald-400' },
    { label: 'Vendas Totais', valor: `${estatisticas.totalVendas} pedidos`, icone: ShoppingBag, cor: 'text-cyan-400' },
    { label: 'Clientes', valor: `${estatisticas.totalUsuarios} cadastros`, icone: Users, cor: 'text-violet-400' },
    { label: 'Produtos Ativos', valor: `${estatisticas.totalProdutos} itens`, icone: Layers, cor: 'text-amber-400' },
  ];

  const cardsSecundarios = [
    { label: 'Chaves em Estoque', valor: `${estatisticas.totalChavesEstoque}`, icone: Key, cor: 'text-cyan-400', desc: 'Itens para entrega automática' },
    { label: 'Pedidos Pendentes', valor: `${estatisticas.pedidosPendentes}`, icone: Clock, cor: 'text-amber-400', desc: 'Aguardando pagamento' },
    { label: 'Entregues', valor: `${estatisticas.pedidosEntregues}`, icone: CheckCircle, cor: 'text-emerald-400', desc: 'Concluídos com sucesso' },
    { label: 'Manuais Pendentes', valor: `${estatisticas.pedidosManuaisPendentes}`, icone: AlertTriangle, cor: 'text-rose-400', desc: 'Aguardando seu envio' },
  ];

  const modulos = [
    { to: '/admin/produtos', icone: Layers, cor: 'text-violet-400', titulo: 'Produtos', desc: 'Criar, editar e gerenciar variações' },
    { to: '/admin/estoque', icone: Key, cor: 'text-amber-400', titulo: 'Estoque', desc: 'Ver e reabastecer chaves digitais' },
    { to: '/admin/pedidos', icone: Package, cor: 'text-cyan-400', titulo: 'Pedidos & Entregas', desc: 'Ver pedidos e entregar manuais' },
    { to: '/admin/usuarios', icone: Users, cor: 'text-emerald-400', titulo: 'Usuários', desc: 'Gerenciar saldo e permissões' },
    { to: '/admin/logs', icone: BarChart3, cor: 'text-zinc-400', titulo: 'Logs', desc: 'Auditar registros do sistema' },
    { to: '/admin/configuracoes', icone: Settings, cor: 'text-zinc-400', titulo: 'Configurações', desc: 'Nome, links e cupons' },
    { to: '/admin/chat-ia', icone: Bot, cor: 'text-secondary', titulo: 'Assistente IA', desc: 'Chat com IA para dicas e conteúdos' },
  ];

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-1 text-zinc-400 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft size={16} />
          Voltar para a Loja
        </Link>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <span className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
            PAINEL ADMINISTRATIVO
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-3 tracking-tight">
            👑 NexMarket Manager
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Catálogo, controle de estoque, entregas automáticas/manuais e auditoria de usuários.
          </p>
        </div>

        <div className="flex flex-col items-end">
          <button 
            onClick={gerarDadosDeTeste}
            disabled={gerandoSeed}
            className="botao-sucesso text-xs flex items-center gap-2"
          >
            <Database size={16} />
            {gerandoSeed ? 'Injetando...' : 'Gerar Produtos de Exemplo'}
          </button>
          {mensagemSeed && (
            <span className={`text-[10px] font-bold mt-2 ${mensagemSeed.includes('Erro') ? 'text-rose-400' : 'text-emerald-400'}`}>
              {mensagemSeed}
            </span>
          )}
        </div>
      </div>

      {carregando ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-zinc-500 font-medium">Carregando dados do painel...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cards Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c, i) => (
              <div key={i} className="card-padrao p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{c.label}</span>
                  <c.icone className={c.cor} size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">{c.valor}</h3>
              </div>
            ))}
          </div>

          {/* Cards Secundários (Status Pipeline) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cardsSecundarios.map((c, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <c.icone className={c.cor} size={16} />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">{c.label}</span>
                </div>
                <h4 className="text-2xl font-bold text-white">{c.valor}</h4>
                <p className="text-[10px] text-zinc-500 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Módulos */}
          <div className="card-padrao p-6">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-6 border-b border-zinc-800 pb-3">
              🛠️ Módulos de Operação
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {modulos.map((m, i) => (
                <Link 
                  key={i}
                  to={m.to} 
                  className="bg-zinc-900 hover:bg-zinc-800 text-center border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col items-center gap-3 transition-all duration-200 no-underline"
                >
                  <m.icone className={m.cor} size={24} />
                  <span className="font-bold text-xs text-white uppercase">{m.titulo}</span>
                  <span className="text-[10px] text-zinc-500">{m.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
