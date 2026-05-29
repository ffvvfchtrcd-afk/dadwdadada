import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { ServicoLogs } from '../../servicos/servico_logs';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Trash2, Filter } from 'lucide-react';

export default function VisualizarLogs() {
  const { eAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [busca, setBusca] = useState('');

  const carregarLogs = () => {
    setLogs(ServicoLogs.obterLogs());
  };

  useEffect(() => {
    if (!eAdmin) {
      navigate('/');
      return;
    }
    carregarLogs();
  }, [eAdmin]);

  const limparLogs = () => {
    if (!window.confirm('Limpar todo o histórico de logs?')) return;
    ServicoLogs.limparLogs();
    carregarLogs();
  };

  const logFiltrados = logs.filter(log => {
    if (filtro !== 'TODOS' && log.tipo !== filtro) return false;
    if (busca && !log.acao.toLowerCase().includes(busca.toLowerCase()) && !log.detalhes?.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const cores = {
    info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    sucesso: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    erro: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  if (!eAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="font-bold text-lg text-white mb-2">Acesso Negado</h3>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="inline-flex items-center gap-1 text-zinc-400 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft size={16} />
          Voltar ao Painel
        </Link>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">📋 Logs do Sistema</h2>
          <p className="text-xs text-zinc-400 mt-1">{logFiltrados.length} registro(s) exibidos</p>
        </div>
        <button onClick={limparLogs} className="botao-perigo text-xs py-1.5 px-3 flex items-center gap-1.5">
          <Trash2 size={14} /> Limpar Logs
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1">
          {['TODOS', 'info', 'sucesso', 'erro'].map(t => (
            <button key={t} onClick={() => setFiltro(t)}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase transition-colors ${
                filtro === t ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t === 'TODOS' ? 'Todos' : t}
            </button>
          ))}
        </div>
        <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar nos logs..." className="input-padrao text-xs flex-1 max-w-xs" />
      </div>

      <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
        {logFiltrados.length === 0 ? (
          <div className="card-padrao p-8 text-center">
            <p className="text-zinc-500 text-sm">Nenhum log encontrado.</p>
          </div>
        ) : (
          logFiltrados.map((log, i) => (
            <div key={log.id || i}
              className={`border rounded-lg px-4 py-2.5 text-xs ${cores[log.tipo] || 'text-zinc-400 bg-zinc-900 border-zinc-800'}`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] text-zinc-600 font-mono">{log.dataHora}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${cores[log.tipo]?.replace('text-', 'text-').replace('bg-', 'bg-') || 'bg-zinc-800 text-zinc-400'}`}>
                  {log.tipo}
                </span>
                <span className="font-bold text-white truncate">{log.acao}</span>
              </div>
              <p className="text-zinc-500 font-mono text-[10px] break-all pl-2">{log.detalhes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
