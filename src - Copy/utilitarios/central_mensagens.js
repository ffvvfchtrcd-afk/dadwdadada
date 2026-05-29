// Central de Mensagens e Alertas - NEXMARKET
// Contém os padrões visuais e textos estruturados do tema Dark Cartoon

export const CentralMensagens = {
  // Paletas de cores e badges de quadrinhos para cada tipo de mensagem
  estilos: {
    sucesso: {
      corFundo: "bg-[#0c1f17]",
      corBorda: "border-[#00e676]",
      corTexto: "text-[#00e676]",
      corSombra: "shadow-[#00e676]/30",
      badgeComic: "POW!",
      icone: "✔️"
    },
    erro: {
      corFundo: "bg-[#250d18]",
      corBorda: "border-[#ff3b30]",
      corTexto: "text-[#ff3b30]",
      corSombra: "shadow-[#ff3b30]/30",
      badgeComic: "OPS!",
      icone: "❌"
    },
    alerta: {
      corFundo: "bg-[#271d0b]",
      corBorda: "border-[#ff9500]",
      corTexto: "text-[#ff9500]",
      corSombra: "shadow-[#ff9500]/30",
      badgeComic: "HEIN?",
      icone: "⚠️"
    },
    info: {
      corFundo: "bg-[#0b1b2b]",
      corBorda: "border-[#00f0ff]",
      corTexto: "text-[#00f0ff]",
      corSombra: "shadow-[#00f0ff]/30",
      badgeComic: "WOW!",
      icone: "💬"
    }
  },

  // Retorna os dados completos do alerta formatado
  criarMensagem(tipo, mensagemTexto, tituloPersonalizado = "") {
    const estilo = this.estilos[tipo] || this.estilos.info;
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tipo,
      titulo: tituloPersonalizado || estilo.badgeComic,
      mensagem: mensagemTexto,
      estilo,
      timestamp: new Date().toLocaleTimeString("pt-BR")
    };
  }
};
