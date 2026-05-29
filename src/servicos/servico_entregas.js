import { supabase } from '../configuracoes/supabase';
import { ServicoEstoque } from './servico_estoque';
import { ServicoLogs } from './servico_logs';

export const ServicoEntregas = {
  // Realiza a entrega automática extraindo chaves do estoque
  async processarEntregaAutomatica(pedidoId, variacaoId, quantidade) {
    try {
      // Deduz as chaves no estoque real
      const chavesEntregues = await ServicoEstoque.deduzirEstoque(variacaoId, quantidade);

      const timelineAtualizada = [
        { status: 'CRIADO', label: 'Pedido Criado', date: new Date().toISOString() },
        { status: 'PAGO', label: 'Pagamento Confirmado', date: new Date().toISOString() },
        { status: 'ENTREGUE', label: 'Entrega Automática Concluída', date: new Date().toISOString() }
      ];

      // Atualiza o status do pedido para entregue no banco de dados
      const { data, error } = await supabase
        .from('compras')
        .update({
          status: 'ENTREGUE',
          deliveryContent: chavesEntregues,
          dateDelivered: new Date().toISOString(),
          timeline: timelineAtualizada
        })
        .eq('id', pedidoId)
        .select();

      if (error) throw error;

      ServicoLogs.adicionarLog(
        "ENTREGA_AUTOMATICA_CONCLUIDA",
        `Pedido ${pedidoId} entregue automaticamente com ${quantidade} item(ns).`,
        "sucesso"
      );

      return { sucesso: true, content: chavesEntregues };
    } catch (erro) {
      ServicoLogs.adicionarLog("ENTREGA_AUTOMATICA_ERRO", erro.message, "erro");
      
      // Se der erro (ex: estoque zerou antes de entregar), mantém em PROCESSANDO para admin entregar manual
      const timelineAtualizada = [
        { status: 'CRIADO', label: 'Pedido Criado', date: new Date().toISOString() },
        { status: 'PAGO', label: 'Pagamento Confirmado', date: new Date().toISOString() },
        { status: 'ERRO_ESTOQUE', label: 'Erro no estoque automático. Aguardando entrega do suporte.', date: new Date().toISOString() }
      ];

      await supabase
        .from('compras')
        .update({
          status: 'PENDENTE_SUPORTE',
          timeline: timelineAtualizada
        })
        .eq('id', pedidoId);

      return { sucesso: false, message: erro.message };
    }
  },

  // Realiza a entrega manual (admin escreve as credenciais)
  async processarEntregaManual(pedidoId, conteudoTexto) {
    try {
      if (!conteudoTexto || conteudoTexto.trim() === '') {
        throw new Error("Conteúdo da entrega não pode ser vazio.");
      }

      // Busca o pedido para ver a timeline
      const { data: pedido, error: fetchErr } = await supabase
        .from('compras')
        .select('*')
        .eq('id', pedidoId)
        .maybeSingle();

      if (fetchErr || !pedido) throw new Error("Pedido não encontrado.");

      const timelineAtualizada = [
        ...(pedido.timeline || []),
        { status: 'ENTREGUE', label: 'Entregue Manualmente por Admin', date: new Date().toISOString() }
      ];

      const { data, error } = await supabase
        .from('compras')
        .update({
          status: 'ENTREGUE',
          deliveryContent: [conteudoTexto.trim()],
          dateDelivered: new Date().toISOString(),
          timeline: timelineAtualizada
        })
        .eq('id', pedidoId)
        .select();

      if (error) throw error;

      ServicoLogs.adicionarLog(
        "ENTREGA_MANUAL_CONCLUIDA",
        `Pedido ${pedidoId} entregue de forma manual por admin.`,
        "sucesso"
      );

      return { sucesso: true, data };
    } catch (erro) {
      ServicoLogs.adicionarLog("ENTREGA_MANUAL_FALHA", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  }
};
