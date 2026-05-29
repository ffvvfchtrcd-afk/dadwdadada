// Banco de dados simulado de produtos - NEXMARKET
export const PRODUTOS = [
  {
    id: "produto_tiktok_shop",
    titulo: "FORNECEDORES TIK TOK SHOP & MONETIZADAS",
    precoOriginal: 44.90,
    precoAtual: 16.90,
    desconto: 62,
    categoria: "FORNECEDORES",
    tipoEntrega: "Automática",
    estoque: 14,
    vendidos: 120,
    descricao: {
      titulo: "Fornecedores TikTok Shop — Monetização Rápida",
      detalhes: [
        "Acesso imediato a lista de fornecedores selecionados do TikTok Shop.",
        "Dicas exclusivas para monetização em menos de 14 dias.",
        "Segurança 100% garantida com suporte pós-venda.",
        "Bônus: Script de vendas virais para iniciantes."
      ]
    },
    avaliacoes: [
      { id: "rev_1", autor: "Gabriel", estrelas: 5, comentario: "Entrega super rápida e lista muito completa!", data: "2026-05-20" },
      { id: "rev_2", autor: "Mariana", estrelas: 4, comentario: "Muito bom, consegui entrar em contato com os melhores fornecedores.", data: "2026-05-18" }
    ]
  },
  {
    id: "produto_robux",
    titulo: "FORNECEDORES ROBUX MAIS BARATOS",
    precoOriginal: 23.50,
    precoAtual: 13.90,
    desconto: 40,
    categoria: "ROBUX",
    tipoEntrega: "Automática",
    estoque: 8,
    vendidos: 85,
    descricao: {
      titulo: "Fornecedores de Robux Baratos para Revenda",
      detalhes: [
        "Robux com valores de revenda direto da fonte.",
        "Métodos seguros para transferência sem riscos de banimento.",
        "Guia completo passo a passo de como resgatar.",
        "Entrega instantânea no painel."
      ]
    },
    avaliacoes: []
  },
  {
    id: "produto_steam_jogos",
    titulo: "FORNECEDOR JOGOS STEAM ESPECIFICOS",
    precoOriginal: 15.90,
    precoAtual: 15.90,
    desconto: 0,
    categoria: "STEAM",
    tipoEntrega: "Automática",
    estoque: 35,
    vendidos: 230,
    descricao: {
      titulo: "Keys de Jogos Steam Aleatórios e Específicos",
      detalhes: [
        "Ative jogos incríveis na sua biblioteca Steam.",
        "Chaves 100% autênticas e vitalícias.",
        "Chances de vir jogos triplo A (AAA).",
        "Suporte especializado em caso de chaves duplicadas."
      ]
    },
    avaliacoes: [
      { id: "rev_3", autor: "Lucas", estrelas: 5, comentario: "Ganhei um jogo de R$ 60 por R$ 15! Valeu muito a pena.", data: "2026-05-25" }
    ]
  },
  {
    id: "produto_streaming",
    titulo: "FORNECEDOR STREAMING + BRINDES",
    precoOriginal: 26.00,
    precoAtual: 16.90,
    desconto: 35,
    categoria: "STREAMING",
    tipoEntrega: "Automática",
    estoque: 5,
    vendidos: 67,
    descricao: {
      titulo: "Fornecedores de Streamings Variados (Netflix, Max, Spotify)",
      detalhes: [
        "Contas compartilhadas e individuais com garantia de tela única.",
        "Suporte de 30 dias para qualquer queda de sinal.",
        "Brinde exclusivo: Método de ativação de YouTube Premium por 3 meses.",
        "Entrega no painel da conta."
      ]
    },
    avaliacoes: []
  },
  {
    id: "produto_blox_fruits",
    titulo: "FORNECEDORES BLOX FRUITS",
    precoOriginal: 26.00,
    precoAtual: 14.90,
    desconto: 42,
    categoria: "JOGOS",
    tipoEntrega: "Automática",
    estoque: 19,
    vendidos: 142,
    descricao: {
      titulo: "Fornecedores de Itens e Contas Blox Fruits",
      detalhes: [
        "Frutas míticas e lendárias a preço de custo.",
        "Contas level max com espadas raras para revenda.",
        "Segurança absoluta com entrega garantida ou seu dinheiro de volta.",
        "Acesso à comunidade secreta de traders de Blox Fruits."
      ]
    },
    avaliacoes: [
      { id: "rev_4", autor: "Rodrigo", estrelas: 5, comentario: "Lista de fornecedores confiável, já comprei 3 vezes e deu certo.", data: "2026-05-22" }
    ]
  },
  {
    id: "produto_supercell",
    titulo: "FORNECEDORES SUPERCELL + BRINDE",
    precoOriginal: 26.50,
    precoAtual: 14.90,
    desconto: 43,
    categoria: "JOGOS",
    tipoEntrega: "Automática",
    estoque: 3,
    vendidos: 45,
    descricao: {
      titulo: "Fornecedores Supercell (Brawl Stars, Clash Royale)",
      detalhes: [
        "Contas raras de Brawl Stars e Clash Royale com skins antigas.",
        "Gemas e passes mais baratos via ID da Supercell.",
        "Brinde: Lista de revendedores de gift cards oficiais.",
        "Entrega digital instantânea no e-mail."
      ]
    },
    avaliacoes: []
  },
  {
    id: "produto_painel_seguidores",
    titulo: "PAINEL SEGUIDORES TIKTOK, INSTAGRAM, MEMBROS...",
    precoOriginal: 23.90,
    precoAtual: 14.90,
    desconto: 37,
    categoria: "PAINEIS",
    tipoEntrega: "Automática",
    estoque: 99,
    vendidos: 540,
    descricao: {
      titulo: "Acesso ao Melhor Painel SMM de Seguidores do Brasil",
      detalhes: [
        "Seguidores, curtidas e visualizações para todas as redes sociais.",
        "Preços extremamente baixos (a partir de R$ 0,50 por 1000 curtidas).",
        "Serviços com reposição automática de 30 dias em caso de queda.",
        "Interface fácil de usar com saldo via PIX."
      ]
    },
    avaliacoes: [
      { id: "rev_5", autor: "Renata", estrelas: 5, comentario: "Painel excelente, entrega de seguidores imediata após o pedido.", data: "2026-05-24" }
    ]
  },
  {
    id: "produto_keys_steam",
    titulo: "FORNECEDOR KEYS STEAM + BRINDE PAINEL SEGUIDOR",
    precoOriginal: 35.70,
    precoAtual: 14.90,
    desconto: 58,
    categoria: "STEAM",
    tipoEntrega: "Automática",
    estoque: 22,
    vendidos: 125,
    descricao: {
      titulo: "Super Combo Keys Steam + Brinde Acesso Painel",
      detalhes: [
        "3 chaves aleatórias de jogos Steam ativáveis globalmente.",
        "Brinde: Link direto para o painel de seguidores com cupom de R$ 5 de saldo.",
        "Suporte técnico completo via chat ou e-mail.",
        "Entrega por sistema automático no checkout."
      ]
    },
    avaliacoes: []
  },
  {
    id: "produto_discord_nitro",
    titulo: "FORNECEDORES DISCORD NITRO + GERADORES DE NITRO",
    precoOriginal: 25.00,
    precoAtual: 14.90,
    desconto: 40,
    categoria: "DISCORD",
    tipoEntrega: "Automática",
    estoque: 1, // Exatamente 1 disponível conforme imagem de referência
    vendidos: 934, // "+9 Vendidos" ou mais
    descricao: {
      titulo: "💎 Discord Nitro — Link (1 ou 3 Meses) 🚀💜",
      detalhes: [
        "Ative o Discord Nitro e desbloqueie todos os recursos premium do seu servidor favorito!",
        "Receba um link Nitro pronto para uso, com segurança total e entrega instantânea ⚡",
        "✨ O que oferecemos:",
        "➕ Gerador de Nitro exclusivo",
        "➖ Contas com Nitro pré-ativado",
        "🔗 Links promocionais diretos",
        "💰 Os mais baratos e seguros do mercado"
      ]
    },
    avaliacoes: []
  },
  {
    id: "produto_email_virgem",
    titulo: "FORNECEDORES EMAIL VIRGEM (GMAIL, OUTLOOK)",
    precoOriginal: 26.00,
    precoAtual: 16.90,
    desconto: 35,
    categoria: "OUTROS",
    tipoEntrega: "Automática",
    estoque: 70,
    vendidos: 310,
    descricao: {
      titulo: "Lista de E-mails Virgens Criados à Mão (Gmail, Outlook)",
      detalhes: [
        "Contas limpas, perfeitas para criação de perfis e contas novas.",
        "Sem verificação de telefone vinculada.",
        "Acompanha dados de recuperação secundários.",
        "Formatado em lista organizada prontas para importar."
      ]
    },
    avaliacoes: [
      { id: "rev_6", autor: "Bruno", estrelas: 5, comentario: "Contas excelentes para subir campanhas de tráfego pago.", data: "2026-05-19" }
    ]
  }
];
