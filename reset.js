import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const perguntar = (q) => new Promise(r => rl.question(q, r));

async function resetCompleto() {
  console.log('\n⚠️  RESET COMPLETO DA NEXMARKET ⚠️');
  console.log('Isso vai DELETAR: produtos, variações, pedidos, usuários, cupons, logs, notificações, etc.');
  console.log('Tudo será perdido permanentemente.\n');

  const conf = await perguntar('Digite "ZERAR" para confirmar: ');
  if (conf !== 'ZERAR') { console.log('Cancelado.'); rl.close(); return; }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
    rl.close(); return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const tabelas = ['variacoes', 'compras', 'notificacoes', 'logs_sistema', 'products', 'categories', 'cupons', 'configuracoes', 'users'];

  for (const t of tabelas) {
    console.log(`🗑️  Limpando ${t}...`);
    const { error } = await supabase.from(t).delete().neq('id', t === 'configuracoes' ? 0 : -1);
    if (error) console.error(`   Erro em ${t}:`, error.message);
  }

  console.log('\n📦 Recriando configuração padrão...');
  await supabase.from('configuracoes').insert({ id: 1, nome_loja: 'NEXMARKET', cupom_ativo: false });

  console.log('\n👤 Criar novo admin:');
  const nome = await perguntar('  Nome: ');
  const email = await perguntar('  Email: ');
  const senha = await perguntar('  Senha: ');

  const { error: userErr } = await supabase.from('users').insert({
    id: Date.now(),
    nome: nome.trim(),
    email: email.trim(),
    senha: senha,
    role: 'ADMIN',
    cargo: 'ADMIN',
    status: 'ATIVO',
    saldo: 0,
    comprasIds: '',
    emailVerificado: true,
    dataCadastro: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
    dataCriacao: new Date().toISOString()
  });

  if (userErr) console.error('❌ Erro ao criar admin:', userErr.message);
  else console.log(`✅ Admin "${nome}" criado! Faça login com email "${email}" e sua senha.`);

  rl.close();
}

resetCompleto();
