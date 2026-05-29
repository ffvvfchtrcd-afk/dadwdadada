import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contextos/contexto_autenticacao';
import { useCart } from '../contextos/contexto_carrinho';

export default function MenuInferior() {
  const { usuario, eAdmin } = useAuth();
  const { carrinhoCount } = useCart();
  const location = useLocation();

  const isAtivo = (caminho) => location.pathname === caminho;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-darkBg/90 backdrop-blur-xl border-t border-white/[0.05] z-50 pb-safe">
      <div className="flex justify-around items-center h-14 px-2">
        
        {/* Home */}
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isAtivo('/') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Home size={20} className={isAtivo('/') ? 'fill-primary/20' : ''} />
          <span className="text-[10px] font-bold">Início</span>
        </Link>

        {/* Carrinho */}
        <Link
          to="/carrinho"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isAtivo('/carrinho') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="relative">
            <ShoppingCart size={20} className={isAtivo('/carrinho') ? 'fill-primary/20' : ''} />
            {carrinhoCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                {carrinhoCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Carrinho</span>
        </Link>

        {/* Perfil ou Login */}
        {usuario ? (
          <Link 
            to="/perfil" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isAtivo('/perfil') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <User size={20} className={isAtivo('/perfil') ? 'fill-primary/20' : ''} />
            <span className="text-[10px] font-bold">Perfil</span>
          </Link>
        ) : (
          <Link 
            to="/login" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isAtivo('/login') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LogIn size={20} />
            <span className="text-[10px] font-bold">Entrar</span>
          </Link>
        )}

        {/* Admin (se for admin) */}
        {eAdmin && (
          <Link 
            to="/admin" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LayoutDashboard size={20} className={location.pathname.startsWith('/admin') ? 'fill-primary/20' : ''} />
            <span className="text-[10px] font-bold">Admin</span>
          </Link>
        )}
      </div>
    </div>
  );
}
