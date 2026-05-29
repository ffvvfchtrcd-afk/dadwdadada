import { supabase } from '../configuracoes/supabase';
import { ServicoLogs } from './servico_logs';
import { ServicoEntregas } from './servico_entregas';

export const ServicoPedidos = {
  // Cria pedidos a partir do carrinho
  async criarPedidosDoCarrinho(usuario, carrinho, totalComDesconto) {
    try {
      if (!usuario) throw new Error("Usuário não autenticado.");
      if (carrinho.length === 0) throw new Error("Carrinho vazio.");

      const criados = [];
      const groupId = `GRP-${Date.now()}`;

      for (const item of carrinho) {
        const pedidoId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const metodoEntrega = item.estoque_tipo === 'AUTOMATICA' ? 'AUTOMATICA' : 'MANUAL';

        const precoItem = item.preco * item.quantidade;
        const novoPedido = {
          id: pedidoId,
          groupId,
          userId: usuario.id,
          userName: usuario.nome,
          productId: item.produto_id || item.produtoId,
          productName: item.titulo,
          variationId: item.variacao_id || `var_${item.produto_id || item.produtoId}`,
          variationName: item.variation_name || 'Opção Padrão',
          quantity: item.quantidade,
          total: precoItem,
          status: 'AGUARDANDO_PAGAMENTO',
          metodoEntrega: metodoEntrega,
          deliveryContent: ['Aguardando confirmação do pagamento...'],
          date: new Date().toISOString(),
          timeline: [
            { status: 'CRIADO', label: 'Pedido Criado', date: new Date().toISOString() }
          ]
        };
        if (totalComDesconto < precoItem && item.cupom) {
          novoPedido.cupom = item.cupom;
          novoPedido.desconto = precoItem - (totalComDesconto / carrinho.length);
        }

        try {
          const { error } = await supabase
            .from('compras')
            .insert([novoPedido]);
          if (error) throw error;
        } catch (err) {
          // Fallback sem groupId se coluna não existir
          if (err.message?.toLowerCase().includes('groupid')) {
            delete novoPedido.groupId;
            const { error: retry } = await supabase.from('compras').insert([novoPedido]);
            if (retry) throw retry;
          } else {
            throw err;
          }
        }
        criados.push(novoPedido);
      }

      ServicoLogs.adicionarLog(
        "PEDIDOS_CRIADOS",
        `Criado(s) ${criados.length} pedido(s) para o usuário ${usuario.nome}.`,
        "info"
      );

      return { sucesso: true, orders: criados };
    } catch (erro) {
      ServicoLogs.adicionarLog("PEDIDOS_CRIAR_ERRO", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  },

  // Busca todos os pedidos de um usuário
  async obterPedidosDoUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('compras')
        .select('*')
        .eq('userId', usuarioId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (erro) {
      console.error("Erro ao buscar pedidos do usuário:", erro);
      return [];
    }
  },

  // Busca todos os pedidos do sistema (admin)
  async obterTodosPedidos() {
    try {
      const { data, error } = await supabase
        .from('compras')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (erro) {
      console.error("Erro ao obter todos os pedidos:", erro);
      return [];
    }
  },

  // Aprova o pagamento de um pedido
  async aprovarPagamentoPedido(pedidoId) {
    try {
      const { data: pedido, error: fetchErr } = await supabase
        .from('compras')
        .select('*')
        .eq('id', pedidoId)
        .maybeSingle();

      if (fetchErr || !pedido) throw new Error("Pedido não encontrado.");
      if (pedido.status !== 'AGUARDANDO_PAGAMENTO') {
        return { sucesso: true, status: pedido.status };
      }

      const timelineAtualizada = [
        ...(pedido.timeline || []),
        { status: 'PAGO', label: 'Pagamento Confirmado via Pix', date: new Date().toISOString() },
        { status: 'PROCESSANDO', label: 'Despachando item', date: new Date().toISOString() }
      ];

      // Atualiza para PROCESSANDO
      const { error: updateErr } = await supabase
        .from('compras')
        .update({
          status: 'PROCESSANDO',
          timeline: timelineAtualizada
        })
        .eq('id', pedidoId);

      if (updateErr) throw updateErr;

      // Executa entrega de acordo com o método
      if (pedido.metodoEntrega === 'AUTOMATICA') {
        const entregaRes = await ServicoEntregas.processarEntregaAutomatica(
          pedidoId,
          pedido.variationId,
          pedido.quantity
        );
        return { sucesso: true, entrega: entregaRes };
      } else {
        // Pedido manual fica aguardando envio do suporte (status PENDENTE_SUPORTE)
        const timelineSuporte = [
          ...timelineAtualizada,
          { status: 'PENDENTE_SUPORTE', label: 'Aguardando envio manual pelo Administrador', date: new Date().toISOString() }
        ];

        await supabase
          .from('compras')
          .update({
            status: 'PENDENTE_SUPORTE',
            timeline: timelineSuporte
          })
          .eq('id', pedidoId);

        return { sucesso: true, manual: true };
      }
    } catch (erro) {
      ServicoLogs.adicionarLog("APROVAR_PAGAMENTO_ERRO", erro.message, "erro");
      return { sucesso: false, message: erro.message };
    }
  },

  // Cancela um pedido (venceu o pix ou cancelado pelo admin/cliente)
  async cancelarPedido(pedidoId) {
    try {
      const { data: pedido, error: fetchErr } = await supabase
        .from('compras')
        .select('*')
        .eq('id', pedidoId)
        .maybeSingle();

      if (fetchErr || !pedido) throw new Error("Pedido não encontrado.");

      const timelineAtualizada = [
        ...(pedido.timeline || []),
        { status: 'CANCELADO', label: 'Pedido Cancelado', date: new Date().toISOString() }
      ];

      const { error } = await supabase
        .from('compras')
        .update({
          status: 'CANCELADO',
          timeline: timelineAtualizada
        })
        .eq('id', pedidoId);

      if (error) throw error;

      ServicoLogs.adicionarLog("PEDIDO_CANCELADO", `Pedido ${pedidoId} foi cancelado.`, "info");
      return { sucesso: true };
    } catch (erro) {
      return { sucesso: false, message: erro.message };
    }
  }
};
