import React, { useState, useEffect } from "react";
import BotaoFechar from "../botoes/botao_fechar";
import { ServicoLogs } from "../../servicos/servico_logs";
import { Terminal, Database, RefreshCw, Trash2 } from "lucide-react";

export default function ModalLogs({ aoFechar, produtosList, aoRecarregarEstoque }) {
  const [logs, setLogs] = useState([]);
  const [busca, setBusca] = useState("");

  const carregarLogs = () => {
    setLogs(ServicoLogs.obterLogs());
  };

  useEffect(() => {
    carregarLogs();
    // Atualiza a cada 3 segundos
    const intervalo = setInterval(carregarLogs, 3000);
    return () => clearInterval(intervalo);
  }, []);

  const lidarComLimpeza = () => {
    ServicoLogs.limparLogs();
    carregarLogs();
  };

  const logsFiltrados = logs.filter(log => 
    log.acao.toLowerCase().includes(busca.toLowerCase()) ||
    log.detalhes.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div 
      id="modal_logs_overlay"
      className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
      onClick={aoFechar}
    >
      <div 
        id="modal_logs"
        className="card-padrao w-full max-w-3xl bg-[#090618] border border-zinc-800 text-white p-6 relative max-h-[85vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4">
          <BotaoFechar onClick={aoFechar} modalId="logs" />
        </div>

        {/* Cabecalho */}
        <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3 select-none">
          <Terminal className="text-[#00f0ff]" />
          <h2 className="fonte-cartoon text-base text-[#00f0ff]">
            Painel do Desenvolvedor: Logs & Estoque
          </h2>
        </div>

        {/* Corpo principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto mb-4">
          
          {/* SeÃ§Ã£o 1: Visualizador de Logs */}
          <div className="flex flex-col h-full min-h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">HistÃ³rico de Eventos</span>
              <button 
                onClick={lidarComLimpeza}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"
              >
                <Trash2 size={12} /> Limpar
              </button>
            </div>
            
            <input 
              type="text" 
              placeholder="Filtrar logs..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-padrao text-xs py-1.5 px-3 mb-2 w-full"
            />

            <div className="bg-[#04020a] border border-zinc-700 rounded-lg p-3 font-mono text-[10px] text-gray-300 overflow-y-auto flex-1 space-y-2">
              {logsFiltrados.length === 0 ? (
                <div className="text-gray-500 text-center py-6">Nenhum evento registrado ainda.</div>
              ) : (
                logsFiltrados.map((log) => {
                  let corTipo = "text-gray-400";
                  if (log.tipo === "sucesso") corTipo = "text-[#00e676]";
                  if (log.tipo === "erro") corTipo = "text-[#ff2a74]";
                  if (log.tipo === "seguranca") corTipo = "text-[#ffe600]";

                  return (
                    <div key={log.id} className="border-b border-gray-900 pb-1">
                      <div className="flex justify-between text-gray-500 text-[8px]">
                        <span>{log.dataHora}</span>
                        <span className={`font-bold ${corTipo}`}>{log.tipo.toUpperCase()}</span>
                      </div>
                      <div className="font-extrabold text-[#00f0ff]">{log.acao}</div>
                      <div className="text-gray-400 break-all">{log.detalhes}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SeÃ§Ã£o 2: Visualizador de Estoque */}
          <div className="flex flex-col h-full min-h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                <Database size={12} />
                Banco de Dados local (Estoque)
              </span>
              <button 
                onClick={aoRecarregarEstoque}
                className="text-xs text-[#ffe600] hover:text-[#fff16e] flex items-center gap-1 bg-[#ffe600]/10 px-2 py-0.5 rounded border border-[#ffe600]/20"
              >
                <RefreshCw size={12} /> Reabastecer tudo
              </button>
            </div>

            <div className="bg-[#120e2a] border border-zinc-700 rounded-lg p-3 overflow-y-auto flex-1">
              <div className="space-y-2">
                {produtosList.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="flex justify-between items-center text-xs border-b border-gray-800 pb-1.5 last:border-0"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-white block truncate uppercase text-[10px]">
                        {prod.titulo}
                      </span>
                      <span className="text-gray-500 text-[9px] block">
                        Vendidos: {prod.vendidos} | ID: {prod.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 font-bold">Qtd:</span>
                      <span className={`font-mono font-extrabold px-1.5 py-0.5 rounded text-[10px] ${prod.estoque > 0 ? "bg-[#00e676]/20 text-[#00e676]" : "bg-red-500/20 text-red-500"}`}>
                        {prod.estoque}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div className="text-center text-[10px] text-gray-500 border-t border-gray-800 pt-3">
          Estes logs simulam um banco de dados e sÃ£o atualizados dinamicamente Ã  medida que as interaÃ§Ãµes ocorrem.
        </div>
      </div>
    </div>
  );
}

