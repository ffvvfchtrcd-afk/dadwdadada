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
    let intervalo;
    const carregar = async () => {
      const [lista, count] = await Promise.all([
        ServicoNotificacoes.listar(usuario.id),
        ServicoNotificacoes.naoLidas(usuario.id)
      ]);
      setNotificacoes(lista);
      setNaoLidas(count);
    };
    const iniciar = () => {
      carregar();
      intervalo = setInterval(carregar, 15000);
    };
    const parar = () => { clearInterval(intervalo); };
    const onVisibilidade = () => { document.hidden ? parar() : iniciar(); };
    iniciar();
    document.addEventListener('visibilitychange', onVisibilidade);
    return () => { parar(); document.removeEventListener('visibilitychange', onVisibilidade); };
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
    <header className="sticky top-0 z-40 bg-darkBg/80 backdrop-blur-xl border-b border-white/[0.05] w-full select-none transition-all duration-300">
      
      {config?.cupom_ativo && config?.cupom_codigo && (
        <div className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-white py-2 px-4 text-center text-[10px] md:text-xs font-medium tracking-wide flex justify-center items-center gap-2 border-b border-white/[0.06]">
          <span className="opacity-90">â–¾</span>
          <span>{config.cupom_porcentagem * 100}% OFF â€” CUPOM <code className="font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded">{config.cupom_codigo}</code></span>
          <span className="opacity-90">â–¾</span>
        </div>
      )}

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer no-underline group">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary/80 rounded-xl flex items-center justify-center font-bold text-white text-sm transition-transform duration-500 ease-out-expo group-hover:scale-105 shadow-sm">
            NM
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-sm tracking-tight text-white">
              Nex<span className="text-secondary">Market</span>
            </span>
            <span className="text-[9px] text-zinc-500 font-medium tracking-wider mt-[-1px]">
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
            className="flex text-zinc-500 hover:text-secondary p-2 hover:bg-white/[0.05] rounded-xl transition-all duration-300 ease-out-expo"
            title="Falar com Suporte"
          >
            <Headphones size={18} />
          </a>

          {/* Estado de Autenticação */}
          {usuario ? (
            <div className="flex items-center gap-2 md:gap-3">
              {/* Saldo visual */}
              <div className="flex bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 items-center gap-1.5">
                <span>Saldo</span>
                <span className="text-success font-semibold">{FormatarMoeda(usuario.saldo || 0)}</span>
              </div>

              {/* Perfil */}
              <Link
                to="/perfil"
                className="text-zinc-500 hover:text-white p-2 hover:bg-white/[0.05] rounded-xl transition-all duration-300 ease-out-expo flex items-center gap-2"
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
                    className="text-zinc-500 hover:text-primary p-2 hover:bg-white/[0.05] rounded-xl transition-all duration-300 ease-out-expo flex items-center gap-2"
                    title="Painel de AdministraÃ§Ã£o"
                  >
                    <LayoutDashboard size={18} />
                    <span className="hidden lg:inline text-sm font-medium">Admin</span>
                  </Link>
                  <Link
                    to="/admin/configuracoes"
                    className="text-zinc-500 hover:text-secondary p-2 hover:bg-white/[0.05] rounded-xl transition-all duration-300 ease-out-expo flex items-center gap-2"
                    title="ConfiguraÃ§Ãµes do Site"
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
                  className="text-zinc-500 hover:text-secondary p-2 hover:bg-white/[0.05] rounded-xl transition-all duration-300 ease-out-expo relative"
                  title="NotificaÃ§Ãµes"
                >
                  {naoLidas > 0 ? <BellRing size={18} className="animate-pulse text-secondary" /> : <Bell size={18} />}
                  {naoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {naoLidas > 9 ? '9+' : naoLidas}
                    </span>
                  )}
                </button>
                {notifAberto && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                    <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">NotificaÃ§Ãµes</span>
                      <span className="text-[10px] text-zinc-500">{notificacoes.length} no total</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notificacoes.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-8">Nenhuma notificaÃ§Ã£o</p>
                      ) : (
                        notificacoes.map((n) => (
                          <div key={n.id} className={`p-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${!n.lida ? 'bg-white/[0.02]' : ''}`}>
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 text-xs ${n.tipo === 'entrega' ? 'text-secondary' : n.tipo === 'aviso' ? 'text-warning' : 'text-primary'}`}>
                                {n.tipo === 'entrega' ? 'ðŸ“¦' : n.tipo === 'aviso' ? 'âš ï¸' : 'â„¹ï¸'}
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
                      className="block text-center text-xs text-secondary hover:text-white py-2.5 border-t border-white/[0.06] bg-white/[0.02] transition-all duration-300 ease-out-expo"
                    >
                      Ver todas as notificaÃ§Ãµes
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
                className="text-zinc-500 hover:text-danger p-2 hover:bg-white/[0.05] rounded-xl transition-all duration-300 ease-out-expo"
                title="Desconectar"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              id="login_abrir_botao"
              className="text-sm font-medium text-zinc-400 hover:text-white px-3 py-2 rounded-xl hover:bg-white/[0.05] transition-all duration-300 ease-out-expo flex items-center gap-2 border border-white/[0.06]"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}

          {/* Divisor vertical */}
          <div className="w-px h-5 bg-white/[0.06] hidden sm:block mx-1"></div>

          {/* Carrinho */}
          <button 
            id="carrinho_abrir_botao"
            onClick={() => navigate('/carrinho')}
            className="bg-white text-zinc-900 text-sm px-4 py-2 font-semibold rounded-xl flex items-center gap-2 relative transition-all duration-300 ease-out-expo hover:bg-zinc-100 shadow-sm"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Carrinho</span>
            {carrinhoCount > 0 && (
              <span className="bg-primary text-white font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] absolute -top-2 -right-2 shadow-sm">
                {carrinhoCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
