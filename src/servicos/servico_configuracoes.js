import { supabase } from '../configuracoes/supabase';

const PADRAO = {
  nome_loja: 'NEXMARKET',
  cupom_ativo: false,
  cupom_codigo: '',
  cupom_porcentagem: 0,
  link_discord: '',
  link_suporte: '',
};

export const ServicoConfiguracoes = {
  async carregar() {
    try {
      const { data, error } = await supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data || PADRAO;
    } catch {
      return PADRAO;
    }
  },

  async salvar(config) {
    try {
      const { error } = await supabase.from('configuracoes').upsert({ id: 1, ...config, atualizado_em: new Date().toISOString() });
      if (error) throw error;
      return { sucesso: true };
    } catch (err) {
      return { sucesso: false, message: err.message };
    }
  }
};
