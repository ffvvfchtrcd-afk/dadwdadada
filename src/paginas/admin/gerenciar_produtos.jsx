import React, { useEffect, useState } from 'react';
import { supabase } from '../../configuracoes/supabase';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, ShieldAlert, Layers, Package, Tag, ChevronDown, ChevronUp, Image, Check, X, AlertTriangle, Upload } from 'lucide-react';
import { FormatarMoeda } from '../../utilitarios/formatadores';
import { ServicoUpload } from '../../servicos/servico_upload';

export default function GerenciarProdutos() {
  const { eAdmin } = useAuth();
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [todasVariacoes, setTodasVariacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});

  // Estados do formulário de produto
  const [exibindoForm, setExibindoForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [miniDesc, setMiniDesc] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [status, setStatus] = useState('ATIVO');
  const [variacoes, setVariacoes] = useState([]);

  // Estado de nova categoria
  const [uploadando, setUploadando] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState({basicas: true, imagem: false, descricao: true});
  const [variacaoAvancada, setVariacaoAvancada] = useState({});
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const { data: pData } = await supabase.from('products').select('*');
      const { data: cData } = await supabase.from('categories').select('*').order('hierarquia', { ascending: true });
      const { data: vData } = await supabase.from('variacoes').select('*');
      setProdutos(pData || []);
      setCategorias(cData || []);
      setTodasVariacoes(vData || []);
    } catch (err) {
      console.error(err);
      setErro('Erro ao carregar os produtos.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!eAdmin) { navigate('/'); return; }
    carregarDados();
  }, [eAdmin]);

  const toggleCategoria = (id) => {
    setCategoriasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Categoria sem produtos e "Sem Categoria"
  const produtosSemCategoria = produtos.filter(p => !p.categoriaId);

  const categoriasComProdutos = categorias.map(c => ({
    ...c,
    produtos: produtos.filter(p => String(p.categoriaId) === String(c.id))
  })).filter(c => c.produtos.length > 0 || categoriasExpandidas[c.id]);

  // Criar nova categoria
  const lidarComCriarCategoria = async () => {
    const nomeTrim = novaCategoriaNome.trim();
    if (!nomeTrim) return;
    setErro('');
    try {
      const existe = categorias.some(c => c.nome?.toLowerCase() === nomeTrim.toLowerCase());
      if (existe) {
        setErro('Já existe uma categoria com este nome.');
        return;
      }
      const maxHierarquia = categorias.length > 0 ? Math.max(...categorias.map(c => c.hierarquia || 0)) : 0;
      const { error } = await supabase.from('categories').insert([{
        nome: nomeTrim,
        hierarquia: maxHierarquia + 1,
        status: 'ATIVO'
      }]);
      if (error) throw error;
      setSucesso(`Categoria "${nomeTrim}" criada!`);
      setNovaCategoriaNome('');
      setCriandoCategoria(false);
      carregarDados();
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro('Erro ao criar categoria: ' + err.message);
    }
  };

  // Excluir categoria
  const lidarComExcluirCategoria = async (cat) => {
    const produtosNaCat = produtos.filter(p => String(p.categoriaId) === String(cat.id));
    const msg = produtosNaCat.length > 0
      ? `A categoria "${cat.nome}" contém ${produtosNaCat.length} produto(s). Deseja excluir mesmo assim? Os produtos ficarão sem categoria.`
      : `Excluir categoria "${cat.nome}"?`;
    if (!window.confirm(msg)) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);
      if (error) throw error;
      setSucesso(`Categoria "${cat.nome}" excluída.`);
      carregarDados();
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro('Erro ao excluir categoria: ' + err.message);
    }
  };

  const abrirNovo = (catNome) => {
    setEditandoId(null);
    setNome('');
    setCategoria(catNome || categorias[0]?.nome || '');
    setDescricao('');
    setMiniDesc('');
    setBannerUrl('');
    setStatus('ATIVO');
    setVariacoes([{ tempId: Date.now(), nome: 'Opção Padrão', preco: 10.00, estoque_tipo: 'AUTOMATICA' }]);
    setExibindoForm(true);
  };

  const abrirEditar = (prod) => {
    setEditandoId(prod.id);
    setNome(prod.nome);
    setCategoria(prod.categoriaId || '');
    setDescricao(prod.descricao);
    setMiniDesc(prod.miniDesc);
    setBannerUrl(prod.bannerUrl);
    setStatus(prod.status);

    const varsDoProduto = todasVariacoes.filter(v => String(v.produtoId) === String(prod.id));
    setVariacoes(varsDoProduto.length > 0 ? varsDoProduto : [{ tempId: Date.now(), nome: 'Opção Padrão', preco: 10.00, estoque_tipo: 'AUTOMATICA' }]);
    setExibindoForm(true);
  };

  const adicionarVariacao = () => {
    setVariacoes([...variacoes, { tempId: Date.now(), nome: 'Nova Variação', preco: 0, estoque_tipo: 'AUTOMATICA' }]);
  };

  const removerVariacao = async (index, varId) => {
    if (varId && !window.confirm('Remover esta variação do banco de dados? O estoque será perdido!')) return;
    if (varId) {
      try { await supabase.from('variacoes').delete().eq('id', varId); } catch (err) { setErro('Falha ao remover variação.'); return; }
    }
    const novasVars = [...variacoes];
    novasVars.splice(index, 1);
    setVariacoes(novasVars);
  };

  const atualizarVariacao = (index, campo, valor) => {
    const novasVars = [...variacoes];
    novasVars[index][campo] = valor;
    setVariacoes(novasVars);
  };

  const lidarComUploadBanner = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setUploadando(true);
    const caminho = `produtos/${editandoId || 'novo'}/banner.${arquivo.name.split('.').pop()}`;
    const url = await ServicoUpload.fazerUpload(arquivo, caminho);
    if (url) setBannerUrl(url);
    setUploadando(false);
    e.target.value = '';
  };

  const lidarComUploadVariacao = async (index, e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setUploadando(true);
    const varId = variacoes[index].id || `temp_${Date.now()}`;
    const prodId = editandoId || 'novo';
    const caminho = `produtos/${prodId}/variacoes/${varId}.${arquivo.name.split('.').pop()}`;
    const url = await ServicoUpload.fazerUpload(arquivo, caminho);
    if (url) {
      const novasVars = [...variacoes];
      novasVars[index].imagem_url = url;
      setVariacoes(novasVars);
    }
    setUploadando(false);
    e.target.value = '';
  };

  async function salvarTabela(tabela, payload, match, isInsert = false) {
    const tentar = async (dados, profundidade) => {
      if (profundidade > 5) throw new Error('Muitas colunas desconhecidas ao salvar.');
      let resultado;
      if (isInsert) {
        resultado = await supabase.from(tabela).insert([dados]);
      } else {
        resultado = await supabase.from(tabela).update(dados).eq('id', match);
      }
      if (resultado.error) {
        if (resultado.error.code === 'PGRST204') {
          const coluna = resultado.error.message.match(/'([^']+)'/) || resultado.error.message.match(/"([^"]+)"/);
          if (coluna && coluna[1] && dados[coluna[1]] !== undefined) {
            const novo = { ...dados };
            delete novo[coluna[1]];
            return tentar(novo, profundidade + 1);
          }
        }
        throw resultado.error;
      }
      return resultado;
    };
    return tentar(payload, 0);
  }

  const lidarComSalvar = async (e) => {
    e.preventDefault();
    if (salvando) return;
    if (variacoes.length === 0) {
      setErro('O produto precisa de pelo menos uma variação (preço e tipo de entrega).');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const catSelecionada = categorias.find(c => c.nome === categoria);
      const payloadProduto = { nome, descricao, miniDesc, status, dataAtualizacao: new Date().toISOString() };
      if (catSelecionada) payloadProduto.categoriaId = catSelecionada.id;
      if (bannerUrl) payloadProduto.bannerUrl = bannerUrl;

      let produtoId = editandoId;

      if (produtoId) {
        await salvarTabela('products', payloadProduto, produtoId);
      } else {
        produtoId = Date.now();
        await salvarTabela('products', { id: produtoId, ...payloadProduto, dataCriacao: new Date().toISOString() }, null, true);
      }

      for (const v of variacoes) {
        if (v.id) {
          await salvarTabela('variacoes', {
            nome: v.nome, preco: v.preco, estoque_tipo: v.estoque_tipo,
            stockData: v.stockData || [], quantidadeStock: v.quantidadeStock || 0,
            imagem_url: v.imagem_url || null, descricao: v.descricao || null,
            status: 'ATIVO', dataAtualizacao: new Date().toISOString()
          }, v.id);
        } else {
          await salvarTabela('variacoes', {
            id: Date.now() + Math.floor(Math.random() * 10000), produtoId,
            nome: v.nome, preco: v.preco, estoque_tipo: v.estoque_tipo,
            stockData: v.stockData || [], quantidadeStock: v.quantidadeStock || 0,
            imagem_url: v.imagem_url || null, descricao: v.descricao || null,
            status: 'ATIVO', dataAtualizacao: new Date().toISOString()
          }, null, true);
        }
      }

      setExibindoForm(false);
      setSucesso(editandoId ? 'Produto atualizado!' : 'Produto criado!');
      carregarDados();
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      console.error(err);
      setErro('Erro ao salvar: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const lidarComExcluir = async (id) => {
    if (excluindo) return;
    if (!window.confirm('Excluir este produto e TODAS as suas variações?')) return;
    setExcluindo(id);
    try {
      await supabase.from('variacoes').delete().eq('produtoId', id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setSucesso('Produto excluído.');
      carregarDados();
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      console.error(err);
      setErro('Erro ao excluir produto.');
    } finally {
      setExcluindo(null);
    }
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="text-primary" size={22} /> Gerenciar Produtos
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Insira, edite ou exclua produtos e crie variações (Entrega Automática ou Manual).</p>
        </div>
      </div>

      {erro && (
        <div className="mb-4 bg-rose-500/20 border border-rose-600 p-3 rounded-xl text-rose-400 font-bold text-xs flex items-center gap-2">
          <AlertTriangle size={14} /> {erro} <button onClick={() => setErro('')} className="ml-auto text-rose-300 hover:text-white">✕</button>
        </div>
      )}
      {sucesso && (
        <div className="mb-4 bg-emerald-500/20 border border-emerald-600 p-3 rounded-xl text-emerald-400 font-bold text-xs flex items-center gap-2">
          <Check size={14} /> {sucesso}
        </div>
      )}

      {carregando ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* Category Manager Bar */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Tag size={14} className="text-primary" /> Categorias
              </h3>
              <div className="flex items-center gap-2">
                {criandoCategoria ? (
                  <form onSubmit={(e) => { e.preventDefault(); lidarComCriarCategoria(); }} className="flex items-center gap-2">
                    <input type="text" value={novaCategoriaNome} onChange={e => setNovaCategoriaNome(e.target.value)}
                      placeholder="Nome da nova categoria..." className="input-padrao text-xs py-1.5 w-48" autoFocus />
                    <button type="submit" className="botao-primario text-[10px] py-1.5 px-2.5"><Check size={14} /></button>
                    <button type="button" onClick={() => { setCriandoCategoria(false); setNovaCategoriaNome(''); }} className="botao-neutro text-[10px] py-1.5 px-2.5"><X size={14} /></button>
                  </form>
                ) : (
                  <button onClick={() => setCriandoCategoria(true)} className="botao-primario text-[10px] py-1.5 px-2.5 uppercase flex items-center gap-1">
                    <Plus size={13} /> Nova Categoria
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categorias.map(c => (
                <div key={c.id} className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 group">
                  <Tag size={12} className="text-cyan-400" />
                  <span className="text-[11px] text-white font-bold">{c.nome}</span>
                  <span className="text-[9px] text-zinc-600 ml-0.5">({produtos.filter(p => String(p.categoriaId) === String(c.id)).length})</span>
                  <button onClick={() => lidarComExcluirCategoria(c)} className="text-zinc-600 hover:text-rose-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {categorias.length === 0 && (
                <p className="text-[11px] text-zinc-500 italic">Nenhuma categoria ainda. Crie uma acima.</p>
              )}
            </div>
          </div>

          {/* Products by Category */}
          <div className="space-y-6">
            {categoriasComProdutos.length > 0 && (
              <>
                {categoriasComProdutos.map(cat => (
                  <section key={cat.id}>
                    <div className="flex items-center gap-3 mb-3">
                      <button onClick={() => toggleCategoria(cat.id)} className="text-zinc-600 hover:text-white transition-colors p-0.5">
                        {categoriasExpandidas[cat.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Tag size={14} className="text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{cat.nome}</h3>
                        <p className="text-[10px] text-zinc-500">{cat.produtos.length} produto(s)</p>
                      </div>
                      <button onClick={() => abrirNovo(cat.nome)} className="botao-primario text-[10px] py-1.5 px-2.5 uppercase flex items-center gap-1">
                        <Plus size={13} /> Adicionar Produto
                      </button>
                    </div>

                    {categoriasExpandidas[cat.id] && (
                      <div className="space-y-2 ml-8">
                        {cat.produtos.length === 0 ? (
                          <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg p-6 text-center">
                            <p className="text-xs text-zinc-600">Nenhum produto nesta categoria.</p>
                          </div>
                        ) : (
                          cat.produtos.map(p => {
                            const vars = todasVariacoes.filter(v => String(v.produtoId) === String(p.id));
                            const varsAuto = vars.filter(v => v.estoque_tipo === 'AUTOMATICA').length;
                            const varsManual = vars.filter(v => v.estoque_tipo !== 'AUTOMATICA').length;
                            const menorPreco = vars.length > 0 ? Math.min(...vars.map(v => v.preco)) : 0;
                            return (
                              <div key={p.id} className="card-padrao overflow-hidden hover:border-zinc-700 transition-colors group">
                                <div className="flex items-center gap-4 p-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                                    {p.bannerUrl ? (
                                      <img src={p.bannerUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Image size={16} className="text-zinc-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-white truncate">{p.nome}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        p.status === 'ATIVO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                      }`}>{p.status}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-0.5 flex-wrap">
                                      <span>{vars.length} variação(ões)</span>
                                      {varsAuto > 0 && <span className="text-cyan-400">{varsAuto} auto</span>}
                                      {varsManual > 0 && <span className="text-amber-400">{varsManual} manual</span>}
                                      {menorPreco > 0 && <span className="text-emerald-400 font-bold">a partir de {FormatarMoeda(menorPreco)}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => abrirEditar(p)} className="botao-neutro text-[10px] py-1.5 px-2" title="Editar">
                                      <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => lidarComExcluir(p.id)} disabled={excluindo === p.id} className={`${excluindo === p.id ? 'botao-neutro opacity-50 cursor-not-allowed' : 'botao-perigo'} text-[10px] py-1.5 px-2`} title="Excluir">
                                      {excluindo === p.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </section>
                ))}
              </>
            )}

            {/* Seção: Sem Categoria */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <Package size={14} className="text-zinc-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Sem Categoria</h3>
                  <p className="text-[10px] text-zinc-600">{produtosSemCategoria.length} produto(s)</p>
                </div>
                <button onClick={() => abrirNovo('')} className="botao-neutro text-[10px] py-1.5 px-2.5 uppercase flex items-center gap-1">
                  <Plus size={13} /> Adicionar Produto
                </button>
              </div>
              {produtosSemCategoria.length > 0 && (
                <div className="space-y-2 ml-8">
                  {produtosSemCategoria.map(p => {
                    const vars = todasVariacoes.filter(v => String(v.produtoId) === String(p.id));
                    return (
                      <div key={p.id} className="card-padrao overflow-hidden hover:border-zinc-700 transition-colors group">
                        <div className="flex items-center gap-4 p-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                            {p.bannerUrl ? (
                              <img src={p.bannerUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image size={16} className="text-zinc-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-white truncate block">{p.nome}</span>
                            <span className="text-[10px] text-zinc-500">{vars.length} variação(ões)</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => abrirEditar(p)} className="botao-neutro text-[10px] py-1.5 px-2"><Edit2 size={12} /></button>
                            <button onClick={() => lidarComExcluir(p.id)} disabled={excluindo === p.id} className={`${excluindo === p.id ? 'botao-neutro opacity-50 cursor-not-allowed' : 'botao-perigo'} text-[10px] py-1.5 px-2`}>{excluindo === p.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {categoriasComProdutos.length === 0 && produtosSemCategoria.length === 0 && (
              <div className="card-padrao p-12 text-center">
                <Package size={40} className="text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm font-medium">Nenhum produto cadastrado.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Crie uma categoria e adicione produtos.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Form Modal */}
      {exibindoForm && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card-padrao w-full max-w-3xl bg-zinc-950 text-white p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                {editandoId ? <Edit2 size={16} className="text-cyan-400" /> : <Plus size={16} className="text-primary" />}
                {editandoId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setExibindoForm(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={lidarComSalvar} className="space-y-6 text-left">

              {/* === SEÇÃO 1: INFORMAÇÕES BÁSICAS === */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <button type="button" onClick={() => setSecaoAberta(p => ({...p, basicas: !p.basicas}))} className="flex items-center gap-2 w-full text-left">
                  <div className={`transition-transform ${secaoAberta.basicas ? 'rotate-90' : ''}`}>▶</div>
                  <Layers size={14} className="text-primary" />
                  <h4 className="text-primary font-bold text-xs uppercase tracking-wider">Informações Básicas</h4>
                </button>
                {secaoAberta.basicas && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Nome do Produto</label>
                        <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                          placeholder="Ex: Minecraft Premium" className="input-padrao w-full text-xs py-2" />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Categoria</label>
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input-padrao w-full text-xs py-2">
                          <option value="">Sem Categoria</option>
                          {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Chamada Rápida</label>
                      <input type="text" required value={miniDesc} onChange={(e) => setMiniDesc(e.target.value)}
                        placeholder="Ex: Entrega imediata no Pix, sem taxas." className="input-padrao w-full text-xs py-2" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Status</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-padrao w-full text-xs py-2">
                        <option value="ATIVO">ATIVO — Produto visível na loja</option>
                        <option value="INATIVO">INATIVO — Produto oculto</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* === SEÇÃO 2: IMAGEM === */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <button type="button" onClick={() => setSecaoAberta(p => ({...p, imagem: !p.imagem}))} className="flex items-center gap-2 w-full text-left">
                  <div className={`transition-transform ${secaoAberta.imagem ? 'rotate-90' : ''}`}>▶</div>
                  <Image size={14} className="text-primary" />
                  <h4 className="text-primary font-bold text-xs uppercase tracking-wider">Imagem do Produto</h4>
                </button>
                {secaoAberta.imagem && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">URL da Imagem</label>
                      <input type="url" value={bannerUrl || ''} onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="https://..." className="input-padrao w-full text-xs py-2" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Ou faça upload</label>
                      <label className={`inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase px-3 py-2 rounded-lg border transition-colors ${uploadando ? 'botao-neutro opacity-50' : 'botao-neutro hover:text-white hover:border-zinc-500'}`}>
                        <Upload size={14} />
                        {uploadando ? 'Enviando...' : 'Escolher Arquivo'}
                        <input type="file" accept="image/*" onChange={lidarComUploadBanner} disabled={uploadando} className="hidden" />
                      </label>
                    </div>
                    {bannerUrl && (
                      <img src={bannerUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-zinc-700" />
                    )}
                  </div>
                )}
              </div>

              {/* === SEÇÃO 3: DESCRIÇÃO === */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <button type="button" onClick={() => setSecaoAberta(p => ({...p, descricao: !p.descricao}))} className="flex items-center gap-2 w-full text-left">
                  <div className={`transition-transform ${secaoAberta.descricao ? 'rotate-90' : ''}`}>▶</div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <h4 className="text-primary font-bold text-xs uppercase tracking-wider">Descrição do Produto</h4>
                </button>
                {secaoAberta.descricao && (
                  <div className="mt-4">
                    <textarea rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Texto descritivo ou HTML..." className="input-padrao w-full text-xs py-2" />
                  </div>
                )}
              </div>

              {/* === SEÇÃO 4: VARIAÇÕES === */}
              <div className="bg-zinc-900/50 border border-cyan-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-cyan-400" />
                    <h4 className="text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      Variações ({variacoes.length})
                    </h4>
                  </div>
                  <button type="button" onClick={adicionarVariacao} className="botao-primario text-[10px] py-1.5 px-3">
                    <Plus size={13} /> Nova Variação
                  </button>
                </div>

                <div className="space-y-3">
                  {variacoes.map((v, index) => (
                    <div key={v.id || v.tempId} className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
                      {/* Cabeçalho compacto da variação */}
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 p-3 items-end">
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">Nome</label>
                          <input type="text" required value={v.nome} onChange={(e) => atualizarVariacao(index, 'nome', e.target.value)}
                            placeholder="Ex: 1 Mês" className="input-padrao w-full text-xs py-1.5" />
                        </div>
                        <div className="w-24">
                          <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">Preço</label>
                          <input type="number" step="0.01" required value={v.preco} onChange={(e) => atualizarVariacao(index, 'preco', e.target.value)}
                            className="input-padrao w-full text-xs py-1.5" />
                        </div>
                        <div className="w-32">
                          <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">Entrega</label>
                          <select value={v.estoque_tipo || 'AUTOMATICA'} onChange={(e) => atualizarVariacao(index, 'estoque_tipo', e.target.value)}
                            className="input-padrao w-full text-xs py-1.5">
                            <option value="AUTOMATICA">⚡ Automática</option>
                            <option value="MANUAL">👤 Manual</option>
                          </select>
                        </div>
                        <div className="flex gap-1 items-end pb-0.5">
                          <button type="button" onClick={() => setVariacaoAvancada(p => ({...p, [v.id || v.tempId]: !p[v.id || v.tempId]}))}
                            className={`p-1.5 rounded border transition-colors ${variacaoAvancada[v.id || v.tempId] ? 'border-cyan-700 text-cyan-400 bg-cyan-900/20' : 'border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500'}`}
                            title="Mais opções">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                          </button>
                          {variacoes.length > 1 && (
                            <button type="button" onClick={() => removerVariacao(index, v.id)} className="p-1.5 rounded border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-500/50 transition-colors" title="Remover">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Opções avançadas (colapsado por padrão) */}
                      {variacaoAvancada[v.id || v.tempId] && (
                        <div className="border-t border-zinc-800 px-3 py-3 space-y-3">
                          <div>
                            <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">Descrição da Variação</label>
                            <textarea rows={2} value={v.descricao || ''} onChange={(e) => atualizarVariacao(index, 'descricao', e.target.value)}
                              placeholder="Ex: Entrega automática em até 5 minutos." className="input-padrao w-full text-xs py-1.5" />
                          </div>
                          <div className="flex items-center gap-3">
                            <div>
                              <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-0.5">Imagem da Variação</label>
                              <div className="flex items-center gap-2">
                                <label className={`flex items-center gap-1 cursor-pointer text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg border transition-colors ${uploadando ? 'botao-neutro opacity-50' : 'botao-neutro hover:text-white hover:border-zinc-500'}`}>
                                  <Upload size={11} />
                                  {uploadando ? '...' : 'Upload'}
                                  <input type="file" accept="image/*" onChange={(e) => lidarComUploadVariacao(index, e)} disabled={uploadando} className="hidden" />
                                </label>
                                {v.imagem_url && (
                                  <img src={v.imagem_url} alt="" className="w-10 h-10 object-cover rounded border border-zinc-700" />
                                )}
                              </div>
                            </div>
                          </div>
                          {v.id && (
                            <p className="text-[9px] text-zinc-600 font-mono">ID: {v.id} | Estoque: {v.quantidadeStock || 0} chave(s)</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AÇÕES */}
              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setExibindoForm(false)} disabled={salvando} className="botao-neutro text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={salvando} className={`botao-primario text-xs uppercase flex items-center gap-1 ${salvando ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {salvando ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
                  ) : (
                    <><Check size={14} /> {editandoId ? 'Salvar Alterações' : 'Criar Produto'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
