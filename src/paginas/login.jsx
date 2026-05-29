import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contextos/contexto_autenticacao';
import { ShieldAlert, ArrowRight, Lock, User } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { entrar } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await entrar(email, senha);
      if (res.sucesso) {
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Ocorreu um erro ao conectar ao servidor de login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="card-padrao w-full max-w-md bg-[#0d091e] border border-zinc-800 text-white p-8 relative">
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 bg-[#b92cff] border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm rotate-[-6deg]">
            <Lock className="text-black" size={28} />
          </div>
          <h2 className="fonte-cartoon text-xl text-white uppercase tracking-wider mt-4">
            Acessar NexMarket
          </h2>
          <p className="text-xs text-gray-400">
            Entre na sua conta para resgatar compras e gerenciar suas chaves digitais.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex gap-2 items-center bg-[#ffe600] border border-zinc-700 p-3 rounded-xl text-black font-bold text-xs shadow-sm">
            <ShieldAlert size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 ml-1">E-mail ou UsuÃ¡rio</label>
            <div className="relative">
              <input 
                id="login_email"
                type="text" 
                required
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome_usuario ou email@exemplo.com" 
                autoComplete="username"
                className="input-padrao w-full text-xs font-bold py-3.5"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 ml-1">Sua Senha</label>
            <div className="relative">
              <input 
                id="login_senha"
                type="password" 
                required
                value={senha || ''}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••" 
                autoComplete="current-password"
                className="input-padrao w-full text-xs font-bold py-3.5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="botao-primario w-full py-3.5 text-xs font-bold uppercase shadow-sm mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Entrar na Conta
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-400">
            Ainda nÃ£o tem conta?{' '}
            <Link to="/registro" className="text-[#00f0ff] hover:underline font-bold">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

