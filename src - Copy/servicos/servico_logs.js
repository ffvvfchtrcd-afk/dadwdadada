import { supabase } from '../configuracoes/supabase';

const STORAGE_KEY = "nexmarket_logs_locais";
let tabelaExiste = true;

export const ServicoLogs = {
  adicionarLog(acao, detalhes, tipo = "info") {
    try {
      const logsAtuais = this.obterLogs();
      const novoLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        dataHora: new Date().toLocaleString("pt-BR"),
        acao,
        detalhes: typeof detalhes === "object" ? JSON.stringify(detalhes) : detalhes,
        tipo
      };

      logsAtuais.unshift(novoLog);
      if (logsAtuais.length > 100) logsAtuais.pop();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logsAtuais));

      if (tabelaExiste) {
        supabase.from('logs_sistema').insert([{
          acao,
          detalhes: novoLog.detalhes,
          tipo,
          data_hora: new Date().toISOString(),
          criado_em: new Date().toISOString()
        }]).then(() => {}, () => { tabelaExiste = false; });
      }

      console.log(`[LOG - ${tipo.toUpperCase()}] ${acao}:`, detalhes);
      return novoLog;
    } catch (erro) {
      console.error("Erro ao gravar log:", erro);
    }
  },

  obterLogs() {
    try {
      const logsStr = localStorage.getItem(STORAGE_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch {
      return [];
    }
  },

  limparLogs() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.adicionarLog("LIMPAR_LOGS", "O histórico de logs foi redefinido pelo sistema.", "info");
    } catch (erro) {
      console.error("Erro ao limpar logs:", erro);
    }
  }
};
