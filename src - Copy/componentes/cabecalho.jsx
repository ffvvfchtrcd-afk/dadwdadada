import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contextos/contexto_autenticacao";
import { useCart } from "../contextos/contexto_carrinho";
import { useConfig } from "../contextos/contexto_configuracao";
import { CONFIGURACOES } from "../configuracoes/config";
import { ShoppingCart, Headphones, LogIn, LogOut, LayoutDashboard, User, Menu, Bell, BellRing, Settings } from "lucide-react";
import { FormatarMoeda } from "../utilitarios/formatadores";
import { ServicoNotificacoes } from "../servicos/servico_notificacoes";

export default function Cabecalho() {
  const { usuario, sair, eAdmin } = useAuth();
  const { carrinhoCount } = useCart();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notifAberto, setNotifAberto] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!usuario) { setNotificacoes([]); setNaoLidas(0); return; }
    const carregar = async () => {
      const [lista, count] = await Promise.all([
        ServicoNotificacoes.listar(usuario.id),
        ServicoNotificacoes.naoLidas(usuario.id)
      ]);
      setNotificacoes(lista);
      setNaoLidas(count);
    };
    carregar();
    const intervalo = setInterval(carregar, 15000);
    return () => clearInterval(intervalo);
  }, [usuario]);

  useEffect(() => {
    const fechar = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifAberto(false); };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const toggleNotif = async () => {
    const novaAberto = !notifAberto;
    setNotifAberto(novaAberto);
    if (novaAberto && naoLidas > 0) {
      await ServicoNotificacoes.marcarTodasLidas(usuario.id);
      const [lista, count] = await Promise.all([
        ServicoNotificacoes.listar(usuario.id),
        ServicoNotificacoes.naoLidas(usuario.id)
      ]);
      setNotificacoes(lista);
      setNaoLidas(count);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-darkBg/80 backdrop-blur-lg border-b border-zinc-800 w-full select-none transition-all duration-300">
      
      {config?.cupom_ativo && config?.cupom_codigo && (
        <div className="bg-primary text-white py-1.5 px-4 text-center text-[10px] md:text-xs font-semibold tracking-wide flex justify-center items-center gap-2 shadow-sm">
          <span>APROVEITE {config.cupom_porcentagem * 100}% OFF COM O CUPOM "{config.cupom_codigo}"</span>
        </div>
      )}

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer no-underline group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md font-bold text-white text-lg transition-transform group-hover:scale-105">
            NM
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="font-bold text-base tracking-tight text-white">
                Nex<span className="text-secondary">Market</span>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wider mt-[-2px]">
              PREMIUM STORE
            </span>
          </div>
        </Link>

        {/* Action Buttons (Escondidos em mobile, visíveis a partir de md) */}
        <div className="hidden md:flex items-center gap-2 md:gap-4">
          
          {/* Suporte */}
          <a 
            id="suporte_telegram_link"
            href={config?.link_suporte || CONFIGURACOES.links.suporte}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex text-zinc-400 hover:text-secondary p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
            title="Falar com Suporte"
          >
            <Headphones size={20} />
          </a>

          {/* Estado de Autenticação */}
          {usuario ? (
            <div className="flex items-center gap-2 md:gap-3">
              {/* Saldo visual */}
              <div className="flex bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 items-center gap-1.5">
                <span>Saldo:</span>
                <span className="text-success">{FormatarMoeda(usuario.saldo || 0)}</span>
              </div>

              {/* Perfil */}
              <Link
                to="/perfil"
                className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2"
                title="Meu Perfil"
              >
                <User size={18} />
                <span className="hidden lg:inline text-sm font-medium">Perfil</span>
              </Link>

              {/* Painel Admin */}
              {eAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="text-zinc-400 hover:text-primary p-2 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2"
                    title="Painel de Administração"
                  >
                    <LayoutDashboard size={18} />
                    <span className="hidden lg:inline text-sm font-medium">Admin</span>
                  </Link>
                  <Link
                    to="/admin/configuracoes"
                    className="text-zinc-400 hover:text-secondary p-2 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center gap-2"
                    title="Configurações do Site"
                  >
                    <Settings size={18} />
                    <span className="hidden lg:inline text-sm font-medium">Config</span>
                  </Link>
                </>
              )}

              {/* Notificações */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={toggleNotif}
                  className="text-zinc-400 hover:text-secondary p-2 hover:bg-zinc-800/50 rounded-lg transition-colors relative"
                  title="Notificações"
                >
                  {naoLidas > 0 ? <BellRing size={18} className="animate-pulse text-secondary" /> : <Bell size={18} />}
                  {naoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {naoLidas > 9 ? '9+' : naoLidas}
                    </span>
                  )}
                </button>
                {notifAberto && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-zinc-700 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Notificações</span>
                      <span className="text-[10px] text-zinc-500">{notificacoes.length} no total</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notificacoes.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-8">Nenhuma notificação</p>
                      ) : (
                        notificacoes.map((n) => (
                          <div key={n.id} className={`p-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer ${!n.lida ? 'bg-zinc-800/30' : ''}`}>
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 text-xs ${n.tipo === 'entrega' ? 'text-secondary' : n.tipo === 'aviso' ? 'text-warning' : 'text-primary'}`}>
                                {n.tipo === 'entrega' ? '📦' : n.tipo === 'aviso' ? '⚠️' : 'ℹ️'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-200">{n.mensagem}</p>
                                <p className="text-[10px] text-zinc-500 mt-1">
                                  {new Date(n.criado_em).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link
                      to="/notificacoes"
                      onClick={() => setNotifAberto(false)}
                      className="block text-center text-xs text-secondary hover:text-white py-2.5 border-t border-zinc-700 bg-zinc-800/50 transition-colors"
                    >
                      Ver todas as notificações
                    </Link>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={() => {
                  sair();
                  navigate('/');
                }}
                className="text-zinc-400 hover:text-danger p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                title="Desconectar"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              id="login_abrir_botao"
              className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors flex items-center gap-2"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}

          {/* Divisor vertical */}
          <div className="w-px h-6 bg-zinc-800 hidden sm:block mx-1"></div>

          {/* Carrinho */}
          <button 
            id="carrinho_abrir_botao"
            onClick={() => navigate('/carrinho')}
            className="bg-zinc-100 hover:bg-white text-zinc-900 text-sm px-4 py-2 font-semibold rounded-lg flex items-center gap-2 relative transition-colors shadow-sm"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Carrinho</span>
            {carrinhoCount > 0 && (
              <span className="bg-primary text-white font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] absolute -top-2 -right-2 shadow-sm animate-in zoom-in duration-200">
                {carrinhoCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
