import React, { useEffect, useState } from 'react';
import { supabase } from '../../configuracoes/supabase';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { ServicoEstoque } from '../../servicos/servico_estoque';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Plus, ShieldAlert, Eye, Trash2, Package, Search, Zap, Clock, AlertTriangle, Layers, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { FormatarMoeda } from '../../utilitarios/formatadores';

export default function GerenciarEstoque() {
  const { eAdmin } = useAuth();
  const navigate = useNavigate();

  const [variacoes, setVariacoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  const [variacaoSelecionada, setVariacaoSelecionada] = useState(null);
  const [novasChavesText, setNovasChavesText] = useState('');
  const [restocando, setRestocando] = useState(false);
  const [removendoChave, setRemovendoChave] = useState(null);
  const [visualizandoEstoque, setVisualizandoEstoque] = useState(null);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [vRes, pRes] = await Promise.all([
        supabase.from('variacoes').select('*'),
        supabase.from('products').select('*')
      ]);
      setVariacoes(vRes.data || []);
      setProdutos(pRes.data || []);
    } catch (err) {
      setErro('Erro ao carregar as variações de estoque.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!eAdmin) { navigate('/'); return; }
    carregarDados();
  }, [eAdmin]);

  const obterNomeProduto = (produtoId) => {
    const p = produtos.find(item => item.id === produtoId);
    return p ? p.nome : `Produto ID ${produtoId}`;
  };

  const produtosComVariacao = produtos
    .map(prod => {
      let vars = variacoes.filter(v => String(v.produtoId) === String(prod.id));
      if (filtroTipo !== 'TODOS') {
        vars = vars.filter(v => filtroTipo === 'AUTO' ? v.estoque_tipo === 'AUTOMATICA' : v.estoque_tipo !== 'AUTOMATICA');
      }
      if (busca) {
        const termo = busca.toLowerCase();
        vars = vars.filter(v =>
          v.nome?.toLowerCase().includes(termo) ||
          prod.nome?.toLowerCase().includes(termo)
        );
      }
      return { ...prod, variações: vars };
    })
    .filter(p => p.variações.length > 0);

  const totalAuto = variacoes.filter(v => v.estoque_tipo === 'AUTOMATICA').length;
  const totalManual = variacoes.filter(v => v.estoque_tipo !== 'AUTOMATICA').length;
  const totalChaves = variacoes
    .filter(v => v.estoque_tipo === 'AUTOMATICA')
    .reduce((s, v) => s + (v.quantidadeStock || 0), 0);
  const totalZeradas = variacoes.filter(v => v.estoque_tipo === 'AUTOMATICA' && (v.quantidadeStock || 0) === 0).length;

  const lidarComReabastecimento = async (e) => {
    e.preventDefault();
    if (!novasChavesText.trim()) return;
    setRestocando(true);
    setErro('');
    setSucesso('');
    try {
      const chavesArray = novasChavesText.split('\n').map(l => l.trim()).filter(l => l);
      if (chavesArray.length === 0) { setErro('Nenhuma chave válida.'); return; }
      const res = await ServicoEstoque.reabastecerEstoque(variacaoSelecionada.id, chavesArray);
      if (res.sucesso) {
        setSucesso(`${chavesArray.length} chave(s) adicionada(s) com sucesso!`);
        setVariacaoSelecionada(null);
        setNovasChavesText('');
        carregarDados();
        setTimeout(() => setSucesso(''), 4000);
      } else { setErro(res.message); }
    } catch (err) {
      console.error(err);
      setErro('Falha ao reabastecer.');
    } finally { setRestocando(false); }
  };

  const removerChaveDoEstoque = async (variacao, indexChave) => {
    if (removendoChave === indexChave) return;
    if (!window.confirm('Remover esta chave do estoque? Esta ação é irreversível!')) return;
    setRemovendoChave(indexChave);
    try {
      const chavesAtuais = [...(variacao.stockData || [])];
      chavesAtuais.splice(indexChave, 1);
      const { error } = await supabase.from('variacoes').update({
        stockData: chavesAtuais, quantidadeStock: chavesAtuais.length, dataAtualizacao: new Date().toISOString()
      }).eq('id', variacao.id);
      if (error) throw error;
      carregarDados();
      if (visualizandoEstoque?.id === variacao.id) {
        setVisualizandoEstoque({ ...variacao, stockData: chavesAtuais, quantidadeStock: chavesAtuais.length });
      }
    } catch (err) { setErro('Erro: ' + err.message); }
    finally { setRemovendoChave(null); }
  };

  if (!eAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="font-bold text-lg text-white mb-2">Acesso Negado</h3>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="inline-flex items-center gap-1 text-zinc-400 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Key className="text-amber-400" size={22} /> Gerenciar Estoque
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Visualize, adicione e remova chaves/credenciais do estoque de cada produto.</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-primary" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Total Variações</span>
          </div>
          <span className="text-lg font-bold text-white">{variacoes.length}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-cyan-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Automáticas</span>
          </div>
          <span className="text-lg font-bold text-cyan-400">{totalAuto}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Database size={14} className="text-emerald-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Chaves em Estoque</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">{totalChaves}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-rose-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Zeradas</span>
          </div>
          <span className={`text-lg font-bold ${totalZeradas > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>{totalZeradas}</span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por produto ou variação..." className="input-padrao w-full pl-9 text-xs" />
        </div>
        <div className="flex gap-1">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'AUTO', label: 'Automática' },
            { id: 'MANUAL', label: 'Manual' }
          ].map(t => (
            <button key={t.id} onClick={() => setFiltroTipo(t.id)}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase transition-colors ${
                filtroTipo === t.id ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Error/Success */}
      {erro && (
        <div className="mb-4 bg-rose-500/20 border border-rose-600 p-3 rounded-xl text-rose-400 font-bold text-xs">
          {erro} <button onClick={() => setErro('')} className="ml-2 text-rose-300 hover:text-white">✕</button>
        </div>
      )}
      {sucesso && (
        <div className="mb-4 bg-emerald-500/20 border border-emerald-600 p-3 rounded-xl text-emerald-400 font-bold text-xs">
          ✅ {sucesso}
        </div>
      )}

      {/* Content */}
      {carregando ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : produtosComVariacao.length === 0 ? (
        <div className="card-padrao p-12 text-center">
          <Package size={40} className="text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-medium">Nenhuma variação encontrada.</p>
          {busca && <p className="text-[10px] text-zinc-600 mt-1">Tente alterar o filtro ou busca.</p>}
        </div>
      ) : (
        <div className="space-y-8">
          {produtosComVariacao.map(prod => (
            <section key={prod.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center text-primary font-bold text-sm border border-zinc-700">
                  {prod.nome?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">{prod.nome}</h3>
                    <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-mono">ID: {prod.id}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-3 mt-0.5">
                    <span>{prod.categoria || 'Sem categoria'}</span>
                    <span>•</span>
                    <span>{prod.variações.length} variação(ões)</span>
                    <span>•</span>
                    <span className={prod.status === 'ATIVO' ? 'text-emerald-400' : 'text-rose-400'}>
                      {prod.status || 'ATIVO'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pl-4 border-l-2 border-zinc-800/50">
                {prod.variações.map(v => {
                  const isAuto = v.estoque_tipo === 'AUTOMATICA';
                  const stockItems = v.stockData || [];
                  const qtd = v.quantidadeStock || stockItems.length || 0;
                  const dataAtualizacao = v.dataAtualizacao ? new Date(v.dataAtualizacao).toLocaleString('pt-BR') : null;

                  return (
                    <div key={v.id} className="card-padrao overflow-hidden hover:border-zinc-700 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-sm font-bold text-white truncate">{v.nome}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                              isAuto ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {isAuto ? <Zap size={11} /> : <Package size={11} />}
                              {isAuto ? 'ENTREGA AUTOMÁTICA' : 'ENTREGA MANUAL'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                            <span>Preço: <strong className="text-white">{FormatarMoeda(v.preco)}</strong></span>
                            {isAuto ? (
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                qtd === 0 ? 'bg-rose-500/20 text-rose-400' :
                                qtd < 5 ? 'bg-amber-500/20 text-amber-400' :
                                'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                ESTOQUE {qtd}
                              </span>
                            ) : (
                              <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold">ENTREGA MANUAL</span>
                            )}
                            {dataAtualizacao && (
                              <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                <Clock size={10} /> {dataAtualizacao}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAuto && (
                            <button onClick={() => setVisualizandoEstoque(v)}
                              className="botao-neutro text-[10px] py-1.5 px-2.5" title="Ver itens">
                              <Eye size={14} /> <span className="hidden sm:inline">Itens</span>
                            </button>
                          )}
                          <button onClick={() => { setVariacaoSelecionada(v); setNovasChavesText(''); }}
                            className="botao-primario text-[10px] py-1.5 px-2.5">
                            <Plus size={14} /> <span className="hidden sm:inline">Add</span>
                          </button>
                        </div>
                      </div>

                      {isAuto && stockItems.length > 0 && (
                        <div className="border-t border-zinc-800/50 px-4 py-2 bg-zinc-900/30">
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 overflow-hidden">
                            <span>Primeira:</span>
                            <code className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono truncate max-w-[200px]">{stockItems[0]}</code>
                            {stockItems.length > 1 && (
                              <><span>•</span><span>Última:</span>
                                <code className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono truncate max-w-[200px]">{stockItems[stockItems.length - 1]}</code>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal: Visualizar Itens */}
      {visualizandoEstoque && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card-padrao w-full max-w-2xl bg-zinc-950 text-white p-6 relative max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye size={16} className="text-cyan-400" /> Itens no Estoque
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {obterNomeProduto(visualizandoEstoque.produtoId)} &gt; <strong className="text-cyan-400">{visualizandoEstoque.nome}</strong>
                </p>
              </div>
              <button onClick={() => setVisualizandoEstoque(null)} className="text-zinc-500 hover:text-white text-lg">✕</button>
            </div>
            <div className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
              <span className="bg-zinc-800 px-2 py-1 rounded font-bold">Total: {(visualizandoEstoque.stockData || []).length} item(ns)</span>
              <span className="text-[10px] text-zinc-600">Cada linha é um produto individual para entrega.</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {(visualizandoEstoque.stockData || []).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-500 text-sm">Estoque vazio. Adicione chaves para esta variação.</p>
                </div>
              ) : (
                (visualizandoEstoque.stockData || []).map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 group hover:border-zinc-700">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] text-zinc-600 font-mono w-6 text-right flex-shrink-0">#{index + 1}</span>
                      <code className="text-xs text-zinc-200 font-mono truncate flex-1">{item}</code>
                    </div>
                    <button onClick={() => removerChaveDoEstoque(visualizandoEstoque, index)} disabled={removendoChave === index}
                      className={`ml-2 flex-shrink-0 p-1 transition-opacity ${removendoChave === index ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400'}`}>
                      {removendoChave === index ? <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-zinc-800">
              <button onClick={() => { setVariacaoSelecionada(visualizandoEstoque); setVisualizandoEstoque(null); setNovasChavesText(''); }}
                className="botao-primario text-xs uppercase"><Plus size={14} /> Adicionar Chaves</button>
              <button onClick={() => setVisualizandoEstoque(null)} className="botao-neutro text-xs uppercase">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reabastecer */}
      {variacaoSelecionada && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card-padrao w-full max-w-md bg-zinc-950 text-white p-6 relative">
            <h3 className="font-bold text-xs text-white mb-2 uppercase tracking-wider flex items-center gap-2">
              <Key size={14} className="text-amber-400" /> Reabastecer Variação
            </h3>
            <p className="text-[10px] text-cyan-400 font-bold mb-4">
              {obterNomeProduto(variacaoSelecionada.produtoId)} &gt; {variacaoSelecionada.nome}
            </p>
            <p className="text-[10px] text-zinc-500 mb-3">
              Estoque atual: <strong className="text-white">{variacaoSelecionada.quantidadeStock || 0}</strong> chave(s)
            </p>
            <form onSubmit={lidarComReabastecimento} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1.5">Cole as Chaves (1 por linha)</label>
                <textarea rows={8} required value={novasChavesText} onChange={e => setNovasChavesText(e.target.value)}
                  placeholder={"email1@gmail.com:senha123\nemail2@gmail.com:senha456\nSTEAM-KEY-XXXXX"}
                  className="input-padrao w-full text-xs font-mono" />
                {novasChavesText.trim() && (
                  <p className="text-[10px] text-zinc-500 mt-1">{novasChavesText.split('\n').filter(l => l.trim()).length} linha(s)</p>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setVariacaoSelecionada(null)} className="botao-neutro text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={restocando} className="botao-sucesso text-xs uppercase">
                  {restocando ? 'Salvando...' : 'Adicionar no Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
