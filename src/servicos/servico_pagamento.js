const API_BASE = '/api';

export const ServicoPagamento = {
  async criarCobrancaPix(pedidoId, valorTotal, email) {
    try {
      const res = await fetch(`${API_BASE}/criar-pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_amount: valorTotal,
          description: `Pedido ${pedidoId}`,
          pedidoId,
          email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar pagamento');
      return {
        id: data.id,
        status: data.status,
        chaveCopiaCola: data.chaveCopiaCola,
        qrCodeBase64: data.qrCodeBase64,
        transactionAmount: data.transactionAmount,
        expirationDate: data.expirationDate,
        expiraEmSegundos: 300
      };
    } catch (err) {
      throw new Error(err.message);
    }
  },

  async verificarPagamento(paymentId) {
    try {
      const res = await fetch(`${API_BASE}/verificar-pagamento?id=${paymentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao verificar');
      return data;
    } catch {
      return { approved: false };
    }
  },

  async confirmarPagamento(pedidoId) {
    try {
      const { ServicoPedidos } = await import('./servico_pedidos');
      const { ServicoLogs } = await import('./servico_logs');

      ServicoLogs.adicionarLog("PAGAMENTO_VERIFICANDO", `Aguardando confirmação bancária para ${pedidoId}...`, "info");
      const res = await ServicoPedidos.aprovarPagamentoPedido(pedidoId);

      if (!res.sucesso) {
        throw new Error(res.message || "Erro ao aprovar o pedido no banco de dados.");
      }

      ServicoLogs.adicionarLog("PAGAMENTO_APROVADO", `Pagamento aprovado. Pedido ${pedidoId} despachado.`, "sucesso");

      return { sucesso: true, pedidoId, dataEntrega: new Date().toLocaleString("pt-BR") };
    } catch (erro) {
      console.error("Erro confirmarPagamento:", erro);
      throw erro;
    }
  }
};
