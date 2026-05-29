import { supabase } from '../configuracoes/supabase';

const BUCKET = 'produtos-imagens';

export const ServicoUpload = {
  async fazerUpload(arquivo, caminho) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(data.path);
      return publicUrl;
    } catch (erro) {
      console.error('Erro no upload:', erro);
      return null;
    }
  },

  async deletar(caminho) {
    try {
      await supabase.storage.from(BUCKET).remove([caminho]);
    } catch {}
  },

  gerarCaminhoProduto(produtoId, arquivo) {
    const ext = arquivo.name.split('.').pop();
    return `produtos/${produtoId}/banner.${ext}`;
  },

  gerarCaminhoVariacao(produtoId, variacaoId, arquivo) {
    const ext = arquivo.name.split('.').pop();
    return `produtos/${produtoId}/variacoes/${variacaoId}.${ext}`;
  }
};
