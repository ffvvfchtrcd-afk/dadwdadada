import React, { useEffect, useState } from 'react';
import { useAuth } from '../contextos/contexto_autenticacao';
import { ServicoNotificacoes } from '../servicos/servico_notificacoes';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, BellRing, CheckCheck } from 'lucide-react';

export default function Notificacoes() {
  const { usuario } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    ServicoNotificacoes.listar(usuario.id).then(data => {
      setNotificacoes(data);
      setCarregando(false);
    });
  }, [usuario]);

  const marcarTodas = async () => {
    await ServicoNotificacoes.marcarTodasLidas(usuario.id);
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const marcarUma = async (id) => {
    await ServicoNotificacoes.marcarLida(id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/perfil" className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-white">Notificações</h1>
        </div>
        {notificacoes.some(n => !n.lida) && (
          <button onClick={marcarTodas} className="text-xs text-secondary hover:text-white flex items-center gap-1.5 transition-colors">
            <CheckCheck size={14} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-500 text-sm">Nenhuma notificação recebida</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificacoes.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.lida && marcarUma(n.id)}
              className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                n.lida
                  ? 'bg-zinc-900/50 border-zinc-800'
                  : 'bg-zinc-800/40 border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5">
                  {n.tipo === 'entrega' ? '📦' : n.tipo === 'aviso' ? '⚠️' : n.tipo === 'sucesso' ? '✅' : 'ℹ️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.lida ? 'text-zinc-400' : 'text-zinc-100 font-medium'}`}>
                    {n.mensagem}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-zinc-500">
                      {new Date(n.criado_em).toLocaleString('pt-BR')}
                    </span>
                    {n.pedido_id && (
                      <Link
                        to={`/perfil?pedido=${n.pedido_id}`}
                        className="text-[10px] text-secondary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver pedido
                      </Link>
                    )}
                  </div>
                </div>
                {!n.lida && (
                  <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
