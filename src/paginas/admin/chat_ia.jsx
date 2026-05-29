import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { supabase } from '../../configuracoes/supabase';
import { FerramentasIA } from '../../servicos/ferramentas_ia';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, Sparkles, Loader, Copy, Check, Lightbulb, FileText, TrendingUp, MessageCircle, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

const SUGESTOES = [
  { icone: Lightbulb, label: 'Dicas de vendas', texto: 'Me dê 3 dicas práticas para aumentar as vendas da loja hoje' },
  { icone: FileText, label: 'Criar produto', texto: 'Crie um produto novo chamado "Discord Nitro 3 Meses" com descrição criativa' },
  { icone: TrendingUp, label: 'Ver estatísticas', texto: 'Quero ver as estatísticas completas da loja' },
  { icone: MessageCircle, label: 'Responder cliente', texto: 'Escreva uma resposta educada para um cliente que quer saber se o produto é seguro' },
];

export default function ChatIA() {
  const { eAdmin } = useAuth();
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([
    { role: 'assistant', content: 'Olá! Sou o assistente IA da NEXMARKET. **Posso criar, editar, deletar produtos, gerenciar variações, ver pedidos e estatísticas.** O que você precisa?' }
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
      const [products, categorias] = await Promise.all([
        supabase.from('products').select('id, nome, status'),
        supabase.from('categories').select('id, nome').order('id')
      ]);

      setContexto({
        nomeLoja: 'NEXMARKET',
        catalogo: products.data || [],
        categorias: categorias.data || [],
        produtosCount: (products.data || []).length,
      });
    } catch {}
  };

  const enviar = async (texto) => {
    const msg = texto || input;
    if (!msg.trim() || enviando) return;
    setInput('');

    const historico = mensagens.slice(1).map(m => ({
      role: m.role,
      content: m.content
    }));

    setMensagens(prev => [...prev, { role: 'user', content: msg }]);
    setEnviando(true);

    await processarMensagem(msg, historico);
  };

  const processarMensagem = async (msg, historico, profundidade = 0) => {
    if (profundidade >= 5) {
      setMensagens(prev => [...prev, { role: 'assistant', content: '⚠️ Número máximo de ações em sequência atingido.' }]);
      setEnviando(false);
      return;
    }
    try {
      const res = await fetch('/api/chat-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, historico, context: contexto })
      });
      const data = await res.json();

      if (data.error) {
        setMensagens(prev => [...prev, { role: 'assistant', content: `❌ ${data.error}` }]);
        return;
      }

      if (data.tool_calls?.length > 0) {
        let log = data.content || '';
        for (const tool of data.tool_calls) {
          if (!tool.name || !tool.args) continue;
          const result = await FerramentasIA.executar(tool.name, tool.args);
          const resumo = result.sucesso
            ? JSON.stringify(result.dados || { sucesso: true }).slice(0, 1000)
            : `Erro: ${result.erro}`;

          if (result.sucesso) {
            if (profundidade === 0) {
              const acoesComFestas = ['deletar_produto', 'criar_produto', 'editar_produto', 'adicionar_variacao'];
              if (acoesComFestas.includes(tool.name)) {
                confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#00e676', '#b92cff'] });
              }
            }
            log += `\n\n[Ferramenta: ${tool.name}] OK`;
          } else {
            log += `\n\n[Ferramenta: ${tool.name}] Erro: ${resumo}`;
          }
        }

        await processarMensagem(msg, [
          ...historico,
          { role: 'assistant', content: log }
        ], profundidade + 1);
      } else {
        setMensagens(prev => [...prev, { role: 'assistant', content: data.content || 'Pronto!' }]);
      }
    } catch (err) {
      setMensagens(prev => [...prev, { role: 'assistant', content: `❌ Erro: ${err.message}` }]);
    } finally {
      setEnviando(false);
    }
  };

  const copiar = (texto) => navigator.clipboard.writeText(texto);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6 flex flex-col h-[calc(100vh-8rem)]">
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
            <p className="text-[10px] text-zinc-500">Open Router — ferramentas ativas</p>
          </div>
        </div>
      </div>

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
              {m.tool_usada && (
                <div className="mt-2 text-[10px] text-secondary flex items-center gap-1">
                  <Sparkles size={10} /> Ferramenta usada: {m.tool_usada}
                </div>
              )}
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
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader size={16} className="animate-spin text-zinc-500" />
              <span className="text-xs text-zinc-500">Processando...</span>
            </div>
          </div>
        )}

        <div ref={fimRef} />
      </div>

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

      <form onSubmit={e => { e.preventDefault(); enviar(); }} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Peça para criar, editar, deletar produtos, ver dados..."
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
