import React, { useEffect, useState } from 'react';
import { supabase } from '../../configuracoes/supabase';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, ShieldAlert } from 'lucide-react';
import { FormatarMoeda } from '../../utilitarios/formatadores';

export default function GerenciarUsuarios() {
  const { eAdmin } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  
  // Balance modal state
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [novoSaldo, setNovoSaldo] = useState('');
  const [salvandoSaldo, setSalvandoSaldo] = useState(false);

  const carregarUsuarios = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      console.error(err);
      setErro('Erro ao carregar usuÃ¡rios.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!eAdmin) {
      navigate('/');
      return;
    }
    carregarUsuarios();
  }, [eAdmin]);

  const lidarComStatus = async (user, novoStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: novoStatus, dataAtualizacao: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      carregarUsuarios();
    } catch (err) {
      console.error(err);
      setErro('Erro ao alterar status.');
    }
  };

  const lidarComCargo = async (user, novoCargo) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: novoCargo, 
          cargo: novoCargo === 'ADMIN' ? 'ADMIN' : 'CLIENTE',
          dataAtualizacao: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) throw error;
      carregarUsuarios();
    } catch (err) {
      console.error(err);
      setErro('Erro ao alterar permissÃ£o do usuÃ¡rio.');
    }
  };

  const salvarSaldo = async (e) => {
    e.preventDefault();
    if (!novoSaldo) return;

    setSalvandoSaldo(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          saldo: parseFloat(novoSaldo),
          dataAtualizacao: new Date().toISOString() 
        })
        .eq('id', usuarioSelecionado.id);

      if (error) throw error;
      setUsuarioSelecionado(null);
      setNovoSaldo('');
      carregarUsuarios();
    } catch (err) {
      console.error(err);
      setErro('Erro ao salvar saldo.');
    } finally {
      setSalvandoSaldo(false);
    }
  };

  if (!eAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="text-[#ff2a74] mx-auto mb-4" size={48} />
        <h3 className="fonte-cartoon text-lg text-white mb-2">Acesso Negado</h3>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft size={16} />
          Voltar ao Painel
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="fonte-cartoon text-xl text-white uppercase tracking-wider glow-roxo">
          ðŸ‘¥ Gerenciar UsuÃ¡rios
        </h2>
        <p className="text-xs text-gray-400">Gerencie saldos da carteira, altere cargos ou bloqueie usuÃ¡rios ativos.</p>
      </div>

      {erro && (
        <div className="mb-6 bg-[#ff2a74] border border-zinc-700 p-3 rounded-xl text-white font-bold text-xs">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-[#00e676] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="card-padrao p-6 bg-[#0d091e] border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Saldo</th>
                  <th className="py-3 px-4">Cargo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">AÃ§Ãµes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-gray-900 hover:bg-black/20">
                    <td className="py-3 px-4 text-white font-bold">{u.nome}</td>
                    <td className="py-3 px-4 font-cartoon text-white">{FormatarMoeda(u.saldo || 0)}</td>
                    <td className="py-3 px-4 text-gray-300">{u.role || 'USER'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ATIVO' 
                          ? 'bg-[#00e676]/20 text-[#00e676]' 
                          : 'bg-[#ff2a74]/20 text-[#ff2a74]'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2.5">
                      <button
                        onClick={() => {
                          setUsuarioSelecionado(u);
                          setNovoSaldo((u.saldo || 0).toString());
                        }}
                        className="text-[#ffe600] hover:underline font-bold"
                      >
                        Saldo
                      </button>

                      {u.role === 'ADMIN' ? (
                        <button
                          onClick={() => lidarComCargo(u, 'USER')}
                          className="text-gray-400 hover:underline font-bold"
                        >
                          Rebaixar
                        </button>
                      ) : (
                        <button
                          onClick={() => lidarComCargo(u, 'ADMIN')}
                          className="text-[#00f0ff] hover:underline font-bold"
                        >
                          Tornar Admin
                        </button>
                      )}

                      {u.status === 'ATIVO' ? (
                        <button
                          onClick={() => lidarComStatus(u, 'BLOQUEADO')}
                          className="text-[#ff2a74] hover:underline font-bold"
                        >
                          Bloquear
                        </button>
                      ) : (
                        <button
                          onClick={() => lidarComStatus(u, 'ATIVO')}
                          className="text-[#00e676] hover:underline font-bold"
                        >
                          Desbloquear
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saldo Edit Modal */}
      {usuarioSelecionado && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card-padrao w-full max-w-sm bg-[#0d091e] border border-zinc-800 text-white p-6 relative">
            <h3 className="fonte-cartoon text-xs text-white mb-2 uppercase tracking-wider">
              Ajustar Saldo
            </h3>
            <p className="text-[10px] text-gray-400 mb-4">
              Cliente: <strong className="text-white">{usuarioSelecionado.nome}</strong>
            </p>

            <form onSubmit={salvarSaldo} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                  Novo Saldo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={novoSaldo}
                  onChange={(e) => setNovoSaldo(e.target.value)}
                  className="input-padrao w-full text-xs font-bold"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setUsuarioSelecionado(null)}
                  className="botao-neutro text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoSaldo}
                  className="botao-primario text-xs uppercase shadow-sm"
                >
                  {salvandoSaldo ? 'Ajustando...' : 'Salvar Saldo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

