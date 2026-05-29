import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contextos/contexto_autenticacao";
import { useCart } from "./contextos/contexto_carrinho";

import Cabecalho from "./componentes/cabecalho";
import FlutuanteDiscord from "./componentes/flutuante_discord";
import MenuInferior from "./componentes/menu_inferior";
import ErrorBoundary from "./componentes/ErrorBoundary";

const Loja = lazy(() => import("./paginas/loja"));
const Login = lazy(() => import("./paginas/login"));
const Registro = lazy(() => import("./paginas/registro"));
const DetalhesProduto = lazy(() => import("./paginas/detalhes_produto"));
const Perfil = lazy(() => import("./paginas/perfil"));
const Carrinho = lazy(() => import("./paginas/carrinho"));
const Checkout = lazy(() => import("./paginas/checkout"));
const Notificacoes = lazy(() => import("./paginas/notificacoes"));
const PainelAdmin = lazy(() => import("./paginas/admin/painel_admin"));
const GerenciarProdutos = lazy(() => import("./paginas/admin/gerenciar_produtos"));
const GerenciarEstoque = lazy(() => import("./paginas/admin/gerenciar_estoque"));
const GerenciarPedidos = lazy(() => import("./paginas/admin/gerenciar_pedidos"));
const GerenciarUsuarios = lazy(() => import("./paginas/admin/gerenciar_usuarios"));
const VisualizarLogs = lazy(() => import("./paginas/admin/visualizar_logs"));
const Configuracoes = lazy(() => import("./paginas/admin/configuracoes"));
const ChatIA = lazy(() => import("./paginas/admin/chat_ia"));

function Spinner() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Spinner />;
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

function RotaAdmin({ children }) {
  const { usuario, carregando, eAdmin } = useAuth();
  if (carregando) return <Spinner />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!eAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { toast } = useCart();

  return (
    <div className="min-h-screen bg-darkBg text-zinc-100 flex flex-col relative pb-28">
      <Cabecalho />
      <ErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Loja />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/produto/:id" element={<DetalhesProduto />} />
            <Route path="/carrinho" element={<RotaProtegida><Carrinho /></RotaProtegida>} />
            <Route path="/checkout" element={<RotaProtegida><Checkout /></RotaProtegida>} />
            <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
            <Route path="/meus-pedidos" element={<Navigate to="/perfil" replace />} />
            <Route path="/notificacoes" element={<RotaProtegida><Notificacoes /></RotaProtegida>} />
            <Route path="/admin" element={<RotaAdmin><PainelAdmin /></RotaAdmin>} />
            <Route path="/admin/produtos" element={<RotaAdmin><GerenciarProdutos /></RotaAdmin>} />
            <Route path="/admin/estoque" element={<RotaAdmin><GerenciarEstoque /></RotaAdmin>} />
            <Route path="/admin/pedidos" element={<RotaAdmin><GerenciarPedidos /></RotaAdmin>} />
            <Route path="/admin/usuarios" element={<RotaAdmin><GerenciarUsuarios /></RotaAdmin>} />
            <Route path="/admin/logs" element={<RotaAdmin><VisualizarLogs /></RotaAdmin>} />
            <Route path="/admin/configuracoes" element={<RotaAdmin><Configuracoes /></RotaAdmin>} />
            <Route path="/admin/chat-ia" element={<RotaAdmin><ChatIA /></RotaAdmin>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <FlutuanteDiscord />
      {toast && (
        <div id="toast_alerta"
          className="fixed top-6 right-6 z-50 bg-cardBg border border-zinc-700 p-4 rounded-xl shadow-2xl max-w-sm w-full md:w-80 flex gap-3 select-none animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`w-10 h-10 ${toast.estilo.corFundo === 'bg-red-500' ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'} rounded-full flex items-center justify-center flex-shrink-0`}>
            {toast.estilo.icone}
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">{toast.titulo}</span>
            <p className="text-sm font-medium text-zinc-100 mt-0.5">{toast.mensagem}</p>
          </div>
        </div>
      )}
      <MenuInferior />
    </div>
  );
}
