import { supabase } from '../configuracoes/supabase';

export const ServicoCupons = {
  async listar() {
    try {
      const { data, error } = await supabase.from('cupons').select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch { return []; }
  },

  async criar(codigo, porcentagem) {
    try {
      const { error } = await supabase.from('cupons').insert([{ codigo: codigo.toUpperCase(), porcentagem }]);
      if (error) throw error;
      return { sucesso: true };
    } catch (err) {
      return { sucesso: false, message: err.message };
    }
  },

  async alternarAtivo(id, ativo) {
    try {
      await supabase.from('cupons').update({ ativo }).eq('id', id);
      return { sucesso: true };
    } catch { return { sucesso: false }; }
  },

  async deletar(id) {
    try {
      await supabase.from('cupons').delete().eq('id', id);
      return { sucesso: true };
    } catch { return { sucesso: false }; }
  }
};
