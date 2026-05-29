import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { supabase } from '../../configuracoes/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, Sparkles, Loader, Copy, Check, Lightbulb, FileText, TrendingUp, MessageCircle } from 'lucide-react';

const SUGESTOES = [
  { icone: Lightbulb, label: 'Dicas de vendas', texto: 'Me dê 3 dicas práticas para aumentar as vendas da loja hoje' },
  { icone: FileText, label: 'Descrição de produto', texto: 'Gere uma descrição criativa para um produto de streaming' },
  { icone: TrendingUp, label: 'Analisar resultados', texto: 'Com base nos meus dados, o que posso melhorar?' },
  { icone: MessageCircle, label: 'Resposta para cliente', texto: 'Escreva uma resposta educada para um cliente que quer saber se o produto é seguro' },
];

export default function ChatIA() {
  const { eAdmin } = useAuth();
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([
    { role: 'assistant', content: 'Olá! Sou o assistente IA da NEXMARKET. Posso ajudar com descrições, dicas de vendas, análises e muito mais. O que você precisa?' }
  ]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [contexto, setContexto] = useState(null);
  const fimRef = useRef(null);

  useEffect(() => {
    if (!eAdmin) { navigate('/'); return; }
    carregarContexto();
  }, [eAdmin]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const carregarContexto = async () => {
    try {
      const [compras, products, config] = await Promise.all([
        supabase.from('compras').select('total, status'),
        supabase.from('products').select('id'),
        supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle()
      ]);
      const faturamento = (compras.data || [])
        .filter(c => c.status === 'ENTREGUE' || c.status === 'PAGO' || c.status === 'PROCESSANDO')
        .reduce((s, c) => s + (c.total || 0), 0);
      setContexto({
        nomeLoja: config?.data?.nome_loja || 'NEXMARKET',
        produtosCount: (products.data || []).length,
        pedidosCount: (compras.data || []).length,
        faturamento: faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      });
    } catch {}
  };

  const enviar = async (texto) => {
    const msg = texto || input;
    if (!msg.trim() || enviando) return;
    setInput('');

    const novaMsg = { role: 'user', content: msg };
    setMensagens(prev => [...prev, novaMsg]);
    setEnviando(true);

    try {
      const res = await fetch('/api/chat-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context: contexto })
      });
      const data = await res.json();
      setMensagens(prev => [...prev, { role: data.role, content: data.content }]);
    } catch {
      setMensagens(prev => [...prev, { role: 'assistant', content: '❌ Erro de conexão com o servidor.' }]);
    } finally {
      setEnviando(false);
    }
  };

  const copiar = (texto) => {
    navigator.clipboard.writeText(texto);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/admin" className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Assistente IA</h1>
            <p className="text-[10px] text-zinc-500">Powered by Open Router</p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 scroll-smooth">
        {mensagens.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 mt-1 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              m.role === 'user'
                ? 'bg-primary/20 border border-primary/30 text-zinc-100'
                : 'bg-zinc-900/80 border border-zinc-800 text-zinc-200'
            }`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
              {m.role === 'assistant' && m.content.length > 20 && (
                <button onClick={() => copiar(m.content)} className="mt-2 text-zinc-600 hover:text-zinc-300 transition-colors">
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>
        ))}

        {enviando && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3">
              <Loader size={16} className="animate-spin text-zinc-500" />
            </div>
          </div>
        )}

        <div ref={fimRef} />
      </div>

      {/* Sugestões rápidas */}
      {mensagens.length <= 2 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {SUGESTOES.map((s, i) => (
            <button key={i} onClick={() => enviar(s.texto)} disabled={enviando}
              className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-50">
              <s.icone size={14} className="text-secondary flex-shrink-0" />
              <span className="text-[11px] text-zinc-300">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); enviar(); }} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={enviando}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary disabled:opacity-50"
        />
        <button type="submit" disabled={enviando || !input.trim()}
          className="bg-primary hover:bg-primary/80 text-white px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center">
          {enviando ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
