import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
  console.error('   Copie .env.example para .env e preencha com seus dados do Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('=== SEED NEXMARKET ===');
  
  // CATEGORIAS
  console.log('Criando categorias...');
  const { data: cats, error: catErr } = await supabase.from('categories').insert([
    { id: 1, nome: 'Streaming', slug: 'streaming', hierarquia: 1, icone: '📺', status: 'ATIVO' },
    { id: 2, nome: 'Jogos', slug: 'jogos', hierarquia: 2, icone: '🎮', status: 'ATIVO' },
    { id: 3, nome: 'Software', slug: 'software', hierarquia: 3, icone: '💻', status: 'ATIVO' },
    { id: 4, nome: 'Redes Sociais', slug: 'redes-sociais', hierarquia: 4, icone: '📱', status: 'ATIVO' }
  ]).select();
  
  if (catErr) { console.error('Erro categorias:', catErr.message); return; }
  console.log(`✅ ${cats.length} categorias criadas`);

  const catMap = {};
  cats.forEach(c => catMap[c.nome] = c.id);

  // PRODUTOS - 10 produtos distribuídos em 4 categorias
  const agora = new Date().toISOString();
  const produtos = [
    // ===== STREAMING (3) =====
    {
      id: Date.now(),
      nome: 'Netflix Premium 4K',
      miniDesc: 'Tela compartilhada com entrega imediata',
      descricao: 'Conta Netflix Premium 4K - 1 Tela Compartilhada (30 Dias). Receba os dados de acesso automaticamente após o pagamento.',
      categoriaId: catMap['Streaming'],
      imagens: ['https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: true,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: '1 Mês (Automática)', preco: 15.00, estoque_tipo: 'AUTOMATICA', stockData: ['netflix1@email.com:senha123','netflix2@email.com:senha456','netflix3@email.com:senha789'], quantidadeStock: 3 },
        { nome: '3 Meses (Automática)', preco: 35.00, estoque_tipo: 'AUTOMATICA', stockData: ['netflix3m_1@email.com:abc','netflix3m_2@email.com:def'], quantidadeStock: 2 }
      ]
    },
    {
      id: Date.now() + 1,
      nome: 'Spotify Premium',
      miniDesc: 'Upgrade na sua própria conta',
      descricao: 'Fazemos o upgrade da sua conta pessoal para Spotify Premium. Processo 100% seguro e manual.',
      categoriaId: catMap['Streaming'],
      imagens: ['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: true,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: 'Upgrade 1 Mês (Manual)', preco: 8.90, estoque_tipo: 'MANUAL', stockData: [], quantidadeStock: 0 },
        { nome: 'Upgrade 3 Meses (Manual)', preco: 22.00, estoque_tipo: 'MANUAL', stockData: [], quantidadeStock: 0 }
      ]
    },
    {
      id: Date.now() + 2,
      nome: 'Disney+ Premium',
      miniDesc: 'Acesso completo ao catálogo Disney',
      descricao: 'Conta Disney+ com acesso total ao catálogo: Marvel, Star Wars, Pixar e mais. Entrega automática.',
      categoriaId: catMap['Streaming'],
      imagens: ['https://images.unsplash.com/photo-1640499900704-b00dd6a1104a?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: false,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: '30 Dias (Automática)', preco: 12.00, estoque_tipo: 'AUTOMATICA', stockData: ['disney1@mail.com:pass1','disney2@mail.com:pass2'], quantidadeStock: 2 }
      ]
    },

    // ===== JOGOS (3) =====
    {
      id: Date.now() + 3,
      nome: 'Valorant Points VP',
      miniDesc: 'Gift Cards oficiais Brasil',
      descricao: 'Código (Gift Card) para resgatar VP no Valorant. Resgate instantâneo na sua conta Riot Games.',
      categoriaId: catMap['Jogos'],
      imagens: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: true,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: '600 VP', preco: 20.00, estoque_tipo: 'AUTOMATICA', stockData: ['VAL-AAAA-BBBB','VAL-CCCC-DDDD'], quantidadeStock: 2 },
        { nome: '1200 VP', preco: 35.00, estoque_tipo: 'AUTOMATICA', stockData: ['VAL-XXXX-YYYY'], quantidadeStock: 1 }
      ]
    },
    {
      id: Date.now() + 4,
      nome: 'Roblox Robux',
      miniDesc: 'Robux via Gamepass seguro',
      descricao: 'Compre Robux com preço baixo. Envio feito manualmente via Gamepass após confirmação do pagamento.',
      categoriaId: catMap['Jogos'],
      imagens: ['https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: false,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: '1.000 Robux (Manual)', preco: 25.00, estoque_tipo: 'MANUAL', stockData: [], quantidadeStock: 0 },
        { nome: '2.500 Robux (Manual)', preco: 55.00, estoque_tipo: 'MANUAL', stockData: [], quantidadeStock: 0 }
      ]
    },
    {
      id: Date.now() + 5,
      nome: 'Steam Gift Card R$50',
      miniDesc: 'Cartão presente Steam Brasil',
      descricao: 'Gift Card Steam de R$50 para usar na loja Steam. Código entregue automaticamente.',
      categoriaId: catMap['Jogos'],
      imagens: ['https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: false,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: 'R$50 (Automática)', preco: 45.00, estoque_tipo: 'AUTOMATICA', stockData: ['STEAM-1111-2222','STEAM-3333-4444','STEAM-5555-6666'], quantidadeStock: 3 }
      ]
    },

    // ===== SOFTWARE (2) =====
    {
      id: Date.now() + 6,
      nome: 'Windows 11 Pro Key',
      miniDesc: 'Licença vitalícia original',
      descricao: 'Chave de ativação original Windows 11 Pro. Ativação vitalícia, funciona em qualquer PC.',
      categoriaId: catMap['Software'],
      imagens: ['https://images.unsplash.com/photo-1662970592942-054452e89791?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: true,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: 'Licença OEM (Automática)', preco: 29.90, estoque_tipo: 'AUTOMATICA', stockData: ['WIN11-ABCDE-FGHIJ-KLMNO','WIN11-12345-67890-PQRST'], quantidadeStock: 2 }
      ]
    },
    {
      id: Date.now() + 7,
      nome: 'Office 365 Anual',
      miniDesc: 'Pacote completo Microsoft 365',
      descricao: 'Licença Microsoft 365 (Word, Excel, PowerPoint, OneDrive 1TB). Válida por 12 meses.',
      categoriaId: catMap['Software'],
      imagens: ['https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: false,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: '12 Meses (Automática)', preco: 39.90, estoque_tipo: 'AUTOMATICA', stockData: ['OFF365-KEY-001','OFF365-KEY-002','OFF365-KEY-003'], quantidadeStock: 3 }
      ]
    },

    // ===== REDES SOCIAIS (2) =====
    {
      id: Date.now() + 8,
      nome: 'Discord Nitro',
      miniDesc: 'Nitro Gaming com boost incluso',
      descricao: 'Discord Nitro Gaming de 1 mês. Inclui 2 boosts de servidor, emojis e uploads de 100MB.',
      categoriaId: catMap['Redes Sociais'],
      imagens: ['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: false,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: 'Link de Ativação (Automática)', preco: 14.90, estoque_tipo: 'AUTOMATICA', stockData: ['https://discord.gift/EXEMP01','https://discord.gift/EXEMP02','https://discord.gift/EXEMP03'], quantidadeStock: 3 },
        { nome: 'Ativação na Conta (Manual)', preco: 12.90, estoque_tipo: 'MANUAL', stockData: [], quantidadeStock: 0 }
      ]
    },
    {
      id: Date.now() + 9,
      nome: 'YouTube Premium',
      miniDesc: 'Sem anúncios e com YouTube Music',
      descricao: 'Convite para família YouTube Premium. Sem anúncios, downloads offline e YouTube Music incluído.',
      categoriaId: catMap['Redes Sociais'],
      imagens: ['https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&q=80&w=600'],
      status: 'ATIVO', destaque: false,
      dataCriacao: agora, dataAtualizacao: agora,
      variacoes: [
        { nome: 'Convite Família 1 Mês (Manual)', preco: 9.90, estoque_tipo: 'MANUAL', stockData: [], quantidadeStock: 0 }
      ]
    }
  ];

  // INSERIR TUDO
  let totalProdutos = 0;
  let totalVariacoes = 0;
  let varId = Date.now(); // Contador de IDs para variações

  for (const p of produtos) {
    const vars = p.variacoes;
    delete p.variacoes;

    const { error: pErr } = await supabase.from('products').insert([p]);
    if (pErr) {
      console.error(`❌ Erro produto "${p.nome}":`, pErr.message);
      continue;
    }
    totalProdutos++;

    const varsPayload = vars.map(v => {
      varId++;
      return {
        id: String(varId),
        produtoId: p.id,
        nome: v.nome,
        preco: v.preco,
        estoque_tipo: v.estoque_tipo,
        stockData: v.stockData,
        quantidadeStock: v.quantidadeStock,
        status: 'ATIVO',
        dataAtualizacao: agora
      };
    });

    const { error: vErr } = await supabase.from('variacoes').insert(varsPayload);
    if (vErr) {
      console.error(`❌ Erro variações de "${p.nome}":`, vErr.message);
    } else {
      totalVariacoes += varsPayload.length;
    }
  }

  console.log(`\n✅ SEED COMPLETO!`);
  console.log(`   ${cats.length} categorias (Streaming, Jogos, Software, Redes Sociais)`);
  console.log(`   ${totalProdutos} produtos`);
  console.log(`   ${totalVariacoes} variações`);
}

seed();
