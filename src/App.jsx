import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contextos/contexto_autenticacao";
import { useCart } from "./contextos/contexto_carrinho";

// Layout
import Cabecalho from "./componentes/cabecalho";
import FlutuanteDiscord from "./componentes/flutuante_discord";
import MenuInferior from "./componentes/menu_inferior";

// Páginas Públicas
import Loja from "./paginas/loja";
import Login from "./paginas/login";
import Registro from "./paginas/registro";
import DetalhesProduto from "./paginas/detalhes_produto";

// Páginas Autenticadas
import Perfil from "./paginas/perfil";
import Carrinho from "./paginas/carrinho";
import Checkout from "./paginas/checkout";
import Notificacoes from "./paginas/notificacoes";

// Páginas Admin
import PainelAdmin from "./paginas/admin/painel_admin";
import GerenciarProdutos from "./paginas/admin/gerenciar_produtos";
import GerenciarEstoque from "./paginas/admin/gerenciar_estoque";
import GerenciarPedidos from "./paginas/admin/gerenciar_pedidos";
import GerenciarUsuarios from "./paginas/admin/gerenciar_usuarios";
import VisualizarLogs from "./paginas/admin/visualizar_logs";
import Configuracoes from "./paginas/admin/configuracoes";
import ChatIA from "./paginas/admin/chat_ia";

import ErrorBoundary from "./componentes/ErrorBoundary";

// Componente de proteção de rota (redireciona se não logado)
function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

// Componente de proteção de rota admin
function RotaAdmin({ children }) {
  const { usuario, carregando, eAdmin } = useAuth();
  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!usuario) return <Navigate to="/login" replace />;
  if (!eAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { toast } = useCart();

  return (
    <div className="min-h-screen bg-darkBg text-zinc-100 flex flex-col relative pb-28">
      
      {/* Cabeçalho global */}
      <Cabecalho />

      {/* Rotas */}
      <ErrorBoundary>
      <Routes>
        {/* Páginas públicas */}
        <Route path="/" element={<Loja />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/produto/:id" element={<DetalhesProduto />} />

        {/* Páginas autenticadas */}
        <Route path="/carrinho" element={
          <RotaProtegida>
            <Carrinho />
          </RotaProtegida>
        } />
        <Route path="/checkout" element={
          <RotaProtegida>
            <Checkout />
          </RotaProtegida>
        } />
        <Route path="/perfil" element={
          <RotaProtegida>
            <Perfil />
          </RotaProtegida>
        } />
        <Route path="/meus-pedidos" element={<Navigate to="/perfil" replace />} />
        <Route path="/notificacoes" element={
          <RotaProtegida>
            <Notificacoes />
          </RotaProtegida>
        } />

        {/* Páginas admin */}
        <Route path="/admin" element={
          <RotaAdmin>
            <PainelAdmin />
          </RotaAdmin>
        } />
        <Route path="/admin/produtos" element={
          <RotaAdmin>
            <GerenciarProdutos />
          </RotaAdmin>
        } />
        <Route path="/admin/estoque" element={
          <RotaAdmin>
            <GerenciarEstoque />
          </RotaAdmin>
        } />
        <Route path="/admin/pedidos" element={
          <RotaAdmin>
            <GerenciarPedidos />
          </RotaAdmin>
        } />
        <Route path="/admin/usuarios" element={
          <RotaAdmin>
            <GerenciarUsuarios />
          </RotaAdmin>
        } />
        <Route path="/admin/logs" element={
          <RotaAdmin>
            <VisualizarLogs />
          </RotaAdmin>
        } />
        <Route path="/admin/configuracoes" element={
          <RotaAdmin>
            <Configuracoes />
          </RotaAdmin>
        } />
        <Route path="/admin/chat-ia" element={
          <RotaAdmin>
            <ChatIA />
          </RotaAdmin>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>

      {/* Elementos flutuantes */}
      <FlutuanteDiscord />

      {/* Toast de notificação global */}
      {toast && (
        <div 
          id="toast_alerta"
          className={`fixed top-6 right-6 z-50 bg-cardBg border border-zinc-700 p-4 rounded-xl shadow-2xl max-w-sm w-full md:w-80 flex gap-3 select-none animate-in fade-in slide-in-from-top-5 duration-300`}
        >
          <div className={`w-10 h-10 ${toast.estilo.corFundo === 'bg-red-500' ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'} rounded-full flex items-center justify-center flex-shrink-0`}>
            {toast.estilo.icone}
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
              {toast.titulo}
            </span>
            <p className="text-sm font-medium text-zinc-100 mt-0.5">
              {toast.mensagem}
            </p>
          </div>
        </div>
      )}

      {/* Menu Mobile */}
      <MenuInferior />

    </div>
  );
}
