import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServicoAutenticacao } from '../servicos/servico_autenticacao';
import { supabase } from '../configuracoes/supabase';

const ContextoAutenticacao = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Carrega a sessão inicial
  useEffect(() => {
    const user = ServicoAutenticacao.obterUsuarioLogado();
    if (user) {
      // Sincroniza informações em tempo real com o banco de dados (especialmente saldo/cargo)
      supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data && !error) {
            const mappedUser = { ...data };
            delete mappedUser.senha;
            localStorage.setItem('nexmarket_user', JSON.stringify(mappedUser));
            setUsuario(mappedUser);
          } else {
            setUsuario(user);
          }
          setCarregando(false);
        })
        .catch(() => {
          setUsuario(user);
          setCarregando(false);
        });
    } else {
      setCarregando(false);
    }
  }, []);

  // Validação de sessão na montagem + verificação periódica
  useEffect(() => {
    function validarSessao() {
      const user = ServicoAutenticacao.obterUsuarioLogado();
      if (user && (!user.id || !user.nome || !user.role)) {
        sair();
      }
    }
    validarSessao();
    const interval = setInterval(validarSessao, 300000);
    return () => clearInterval(interval);
  }, []);

  const entrar = async (nome, senha) => {
    setCarregando(true);
    const res = await ServicoAutenticacao.login(nome, senha);
    if (res.sucesso) {
      setUsuario(res.usuario);
    }
    setCarregando(false);
    return res;
  };

  const registrar = async (nome, senha) => {
    setCarregando(true);
    const res = await ServicoAutenticacao.registrar(nome, senha);
    if (res.sucesso) {
      setUsuario(res.usuario);
    }
    setCarregando(false);
    return res;
  };

  const sair = () => {
    ServicoAutenticacao.logout();
    setUsuario(null);
  };

  const atualizarSaldo = (novoSaldo) => {
    if (usuario) {
      const atualizado = { ...usuario, saldo: novoSaldo };
      localStorage.setItem('nexmarket_user', JSON.stringify(atualizado));
      setUsuario(atualizado);
    }
  };

  const eAdmin = usuario?.role === 'ADMIN' || usuario?.cargo === 'ADMIN';

  return (
    <ContextoAutenticacao.Provider value={{ usuario, carregando, entrar, registrar, sair, eAdmin, atualizarSaldo }}>
      {children}
    </ContextoAutenticacao.Provider>
  );
}

export function useAuth() {
  const context = useContext(ContextoAutenticacao);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
