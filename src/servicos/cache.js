const cache = new Map();
const pendentes = new Map();

export const cacheConsulta = {
  async obter(chave, fn, ttlMs = 30000) {
    const agora = Date.now();
    const existente = cache.get(chave);
    if (existente && agora - existente.ts < ttlMs) return existente.data;

    if (pendentes.has(chave)) return pendentes.get(chave);

    const promessa = fn().then(dados => {
      cache.set(chave, { data: dados, ts: Date.now() });
      pendentes.delete(chave);
      return dados;
    }).catch(err => {
      pendentes.delete(chave);
      throw err;
    });

    pendentes.set(chave, promessa);
    return promessa;
  },

  limpar(chave) {
    if (chave) cache.delete(chave);
    else cache.clear();
  }
};
