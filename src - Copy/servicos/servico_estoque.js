import { supabase } from '../configuracoes/supabase';
import { ServicoLogs } from './servico_logs';

export const ServicoEstoque = {
  // Retorna a quantidade de estoque simulada ou real
  obterEstoqueVisual(variacao) {
    if (!variacao) return 0;
    
    // Entrega manual/assistida = estoque infinito
    if (variacao.estoque_tipo !== 'AUTOMATICA' && variacao.estoque_tipo !== 'AGENTE') {
      return Infinity;
    }
    
    // AUTOMATICA real: quantidade real no banco de dados
    if (variacao.estoque_tipo === 'AUTOMATICA') {
      return variacao.quantidadeStock || 0;
    }

    // Se for AGENTE (simulado)
    const min = 5;
    const max = 45;
    const timeFactor = Math.floor(Date.now() / 60000);
    const range = max - min;
    const baseId = typeof variacao.id === 'string' ? variacao.id.charCodeAt(0) : (variacao.id || 1);
    const base = (baseId * timeFactor) % (range > 0 ? range : 1);
    
    return min + base;
  },

  // Dedução real de chaves/itens para entrega automática
  async deduzirEstoque(variacaoId, quantidade) {
    try {
      const { data: variacao, error } = await supabase
        .from('variacoes')
        .select('*')
        .eq('id', variacaoId)
        .maybeSingle();

      if (error || !variacao) {
        throw new Error("Opção do produto não encontrada.");
      }

      if (variacao.estoque_tipo !== 'AUTOMATICA') {
        return ["Aguardando envio pelo suporte..."]; // Não deduz nada do pool automático
      }

      const linhasDisponiveis = (variacao.stockData || []).filter(linha => 
        typeof linha === 'string' && linha.trim() !== ''
      );

      if (linhasDisponiveis.length < quantidade) {
        throw new Error(`Estoque insuficiente! Desejado: ${quantidade}, Disponível: ${linhasDisponiveis.length}`);
      }

      // Separa os itens que serão entregues
      const chavesEntregues = linhasDisponiveis.slice(0, quantidade);
      const chavesRestantes = linhasDisponiveis.slice(quantidade);

      // Atualiza no banco
      const { error: patchError } = await supabase
        .from('variacoes')
        .update({
          stockData: chavesRestantes,
          quantidadeStock: chavesRestantes.length,
          dataAtualizacao: new Date().toISOString()
        })
        .eq('id', variacaoId);

      if (patchError) throw patchError;

      ServicoLogs.adicionarLog(
        "ESTOQUE_DEDUZIR",
        `Deduzidas ${quantidade} chaves para variação ${variacaoId}. Estoque restante: ${chavesRestantes.length}`,
        "sucesso"
      );

      return chavesEntregues;
    } catch (erro) {
      ServicoLogs.adicionarLog("ESTOQUE_DEDUZIR_ERRO", erro.message, "erro");
      throw erro;
    }
  },

  // Repõe chaves no estoque de um produto (admin)
  async reabastecerEstoque(variacaoId, novasChaves) {
    try {
      const { data: variacao, error } = await supabase
        .from('variacoes')
        .select('*')
        .eq('id', variacaoId)
        .maybeSingle();

      if (error || !variacao) throw new Error("Opção não encontrada.");

      const estoqueAtual = variacao.stockData || [];
      const estoqueAtualizado = [...estoqueAtual, ...novasChaves];

      const { data, error: updateError } = await supabase
        .from('variacoes')
        .update({
          stockData: estoqueAtualizado,
          quantidadeStock: estoqueAtualizado.length,
          dataAtualizacao: new Date().toISOString()
        })
        .eq('id', variacaoId)
        .select();

      if (updateError) throw updateError;

      ServicoLogs.adicionarLog(
        "ESTOQUE_REABASTECER",
        `Adicionadas ${novasChaves.length} novas chaves à variação ${variacaoId}.`,
        "sucesso"
      );

      return { sucesso: true, data };
    } catch (erro) {
      ServicoLogs.adicionarLog("ESTOQUE_REABASTECER_FALHA", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  }
};
