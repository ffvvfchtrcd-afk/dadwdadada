import { supabase } from '../configuracoes/supabase';

export const ServicoNotificacoes = {
  async listar(usuarioId) {
    if (!usuarioId) return [];
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch { return []; }
  },

  async naoLidas(usuarioId) {
    if (!usuarioId) return 0;
    try {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .eq('lida', false);
      if (error) throw error;
      return count || 0;
    } catch { return 0; }
  },

  async criar(usuarioId, mensagem, tipo = 'info', pedidoId = null) {
    if (!usuarioId || !mensagem) return;
    try {
      await supabase.from('notificacoes').insert([{
        usuario_id: usuarioId,
        mensagem,
        tipo,
        pedido_id: pedidoId,
        criado_em: new Date().toISOString()
      }]);
    } catch (err) { console.error('Erro ao criar notificação:', err); }
  },

  async marcarLida(notificacaoId) {
    try {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', notificacaoId);
    } catch {}
  },

  async marcarTodasLidas(usuarioId) {
    if (!usuarioId) return;
    try {
      await supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', usuarioId).eq('lida', false);
    } catch {}
  }
};
