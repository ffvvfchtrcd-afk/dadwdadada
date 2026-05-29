import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contextos/contexto_autenticacao';
import { ShieldCheck, ArrowRight, UserPlus, Info } from 'lucide-react';

export default function Registro() {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { registrar } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (senha !== confirmarSenha) {
      setError('As senhas digitadas nÃ£o coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await registrar(nome, senha);
      if (res.sucesso) {
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Falha ao registrar conta. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="card-padrao w-full max-w-md bg-[#0d091e] border border-zinc-800 text-white p-8 relative">
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 bg-[#00f0ff] border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm rotate-[6deg]">
            <UserPlus className="text-black" size={28} />
          </div>
          <h2 className="fonte-cartoon text-xl text-white uppercase tracking-wider mt-4">
            Criar Nova Conta
          </h2>
          <p className="text-xs text-gray-400">
            Crie seu perfil e tenha acesso Ã  entrega instantÃ¢nea.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex gap-2 items-center bg-[#ff2a74] border border-zinc-700 p-3 rounded-xl text-white font-bold text-xs shadow-sm">
            <Info size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 ml-1">Nome de UsuÃ¡rio</label>
            <input 
              type="text" 
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex: joao_revendedor" 
              className="input-padrao w-full text-xs font-bold py-3.5"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 ml-1">Definir Senha</label>
            <input 
              type="password" 
              required
              value={senha || ''}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha secreta" 
              autoComplete="new-password"
              className="input-padrao w-full text-xs font-bold py-3.5"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 ml-1">Confirmar Senha</label>
            <input 
              type="password" 
              required
              value={confirmarSenha || ''}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha secreta" 
              autoComplete="new-password"
              className="input-padrao w-full text-xs font-bold py-3.5"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="botao-secundario w-full py-3.5 text-xs font-bold uppercase shadow-sm mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border border-zinc-700 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Finalizar Cadastro
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-400">
            JÃ¡ possui cadastro?{' '}
            <Link to="/login" className="text-[#b92cff] hover:underline font-bold">
              FaÃ§a login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}