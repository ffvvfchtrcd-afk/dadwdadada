// Utilitários de Formatação - NEXMARKET

export const FormatarMoeda = (valor) => {
  if (typeof valor !== "number") return "R$ 0,00";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
};

export const FormatarTempo = (segundosTotais) => {
  if (typeof segundosTotais !== "number" || segundosTotais < 0) return "00:00";
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = segundosTotais % 60;
  return `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
};
