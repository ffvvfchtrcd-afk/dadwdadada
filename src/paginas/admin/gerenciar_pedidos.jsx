import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../configuracoes/supabase';
import { useAuth } from '../../contextos/contexto_autenticacao';
import { ServicoPedidos } from '../../servicos/servico_pedidos';
import { ServicoEntregas } from '../../servicos/servico_entregas';
import { ServicoNotificacoes } from '../../servicos/servico_notificacoes';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldAlert, Key, Package, Clock, CheckCircle, AlertTriangle, Eye, Send, Filter, Search, TrendingUp, Copy, ArrowUpDown, Layers } from 'lucide-react';
import { FormatarMoeda } from '../../utilitarios/formatadores';

const STATUS_LABELS = {
  'ENTREGUE': 'Entregue',
  'AGUARDANDO_PAGAMENTO': 'Aguardando PIX',
  'CANCELADO': 'Cancelado',
  'PROCESSANDO': 'Processando',
  'PENDENTE_SUPORTE': 'Aguardando Envio',
};

const STATUS_STYLES = {
  'ENTREGUE': 'bg-emerald-500/20 text-emerald-400',
  'AGUARDANDO_PAGAMENTO': 'bg-amber-500/20 text-amber-400',
  'CANCELADO': 'bg-rose-500/20 text-rose-400',
  'PROCESSANDO': 'bg-cyan-500/20 text-cyan-400',
  'PENDENTE_SUPORTE': 'bg-orange-500/20 text-orange-400',
};

function BadgeStatus({ status }) {
  return (
    <span className={`${STATUS_STYLES[status] || 'bg-zinc-800 text-zinc-400'} px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        status === 'ENTREGUE' ? 'bg-emerald-400' :
        status === 'AGUARDANDO_PAGAMENTO' ? 'bg-amber-400' :
        status === 'CANCELADO' ? 'bg-rose-400' :
        status === 'PROCESSANDO' ? 'bg-cyan-400' :
        status === 'PENDENTE_SUPORTE' ? 'bg-orange-400' : 'bg-zinc-400'
      }`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function BadgeEntrega({ metodo }) {
  if (!metodo) return null;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
      metodo === 'AUTOMATICA' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-amber-500/10 text-amber-500'
    }`}>
      {metodo === 'AUTOMATICA' ? 'ENTREGA AUTOMÁTICA' : 'ENTREGA MANUAL'}
    </span>
  );
}

export default function GerenciarPedidos() {
  const { eAdmin } = useAuth();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('recente');

  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [conteudoEntregaText, setConteudoEntregaText] = useState('');
  const [enviandoEntrega, setEnviandoEntrega] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(null);
  const [cancelandoPedido, setCancelandoPedido] = useState(null);
  const [detalhesPedido, setDetalhesPedido] = useState(null);
  const [copiado, setCopiado] = useState(null);

  const carregarPedidos = async () => {
    try {
      setCarregando(true);
      const data = await ServicoPedidos.obterTodosPedidos();
      setPedidos(data);
    } catch (err) {
      console.error(err);
      setErro('Erro ao carregar as compras.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!eAdmin) { navigate('/'); return; }
    carregarPedidos();
  }, [eAdmin]);

  const copiarTexto = (texto, id) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(id);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  const lidarComAprovarPagamento = async (pedidoId) => {
    if (processandoPagamento) return;
    setErro(''); setSucesso('');
    setProcessandoPagamento(pedidoId);
    try {
      const res = await ServicoPedidos.aprovarPagamentoPedido(pedidoId);
      if (res.sucesso) {
        setSucesso(`Pagamento do pedido ${pedidoId} aprovado!`);
        carregarPedidos();
        setTimeout(() => setSucesso(''), 4000);
      } else { setErro(res.message); }
    } catch (err) {
      console.error(err);
      setErro('Erro ao aprovar pagamento.');
    } finally { setProcessandoPagamento(null); }
  };

  const lidarComCancelar = async (pedidoId) => {
    if (cancelandoPedido) return;
    if (!window.confirm('Deseja realmente cancelar este pedido?')) return;
    setErro('');
    setCancelandoPedido(pedidoId);
    try {
      const res = await ServicoPedidos.cancelarPedido(pedidoId);
      if (res.sucesso) {
        setSucesso(`Pedido ${pedidoId} cancelado.`);
        carregarPedidos();
        setTimeout(() => setSucesso(''), 4000);
      } else { setErro(res.message); }
    } catch (err) {
      console.error(err);
      setErro('Erro ao cancelar pedido.');
    } finally { setCancelandoPedido(null); }
  };

  const submeterEntregaManual = async (e) => {
    e.preventDefault();
    if (!conteudoEntregaText.trim()) return;
    setEnviandoEntrega(true);
    setErro('');
    try {
      const res = await ServicoEntregas.processarEntregaManual(pedidoSelecionado.id, conteudoEntregaText);
      if (res.sucesso) {
        ServicoNotificacoes.criar(
          pedidoSelecionado.userId,
          `Seu pedido ${pedidoSelecionado.id} foi entregue! Confira o conteúdo na página do pedido.`,
          'entrega',
          pedidoSelecionado.id
        );
        setSucesso(`Pedido ${pedidoSelecionado.id} entregue!`);
        setPedidoSelecionado(null);
        setConteudoEntregaText('');
        carregarPedidos();
        setTimeout(() => setSucesso(''), 4000);
      } else { setErro(res.message); }
    } catch (err) {
      console.error(err);
      setErro('Erro ao submeter a entrega.');
    } finally { setEnviandoEntrega(false); }
  };

  // Group pedidos by groupId (fallback: each order is its own group)
  const grupos = useMemo(() => {
    const map = new Map();
    for (const p of pedidos) {
      const gid = p.groupId || p.id;
      if (!map.has(gid)) {
        map.set(gid, { id: gid, pedidos: [], data: p.dateCreated, usuario: p.userName });
      }
      map.get(gid).pedidos.push(p);
    }
    // Sort groups by date
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const da = a.pedidos[0]?.dateCreated || '';
      const db = b.pedidos[0]?.dateCreated || '';
      return ordem === 'antigo'
        ? new Date(da) - new Date(db)
        : new Date(db) - new Date(da);
    });
    return arr;
  }, [pedidos, ordem]);

  // Apply search + status filter to groups
  const gruposFiltrados = useMemo(() => {
    return grupos.map(g => {
      let items = g.pedidos;
      if (filtroAtivo !== 'TODOS') {
        items = items.filter(p => p.status === filtroAtivo);
      }
      if (busca.trim()) {
        const t = busca.toLowerCase();
        items = items.filter(p =>
          p.id?.toLowerCase().includes(t) ||
          p.userName?.toLowerCase().includes(t) ||
          p.productName?.toLowerCase().includes(t) ||
          p.variationName?.toLowerCase().includes(t)
        );
      }
      return { ...g, pedidos: items };
    }).filter(g => g.pedidos.length > 0);
  }, [grupos, filtroAtivo, busca]);

  // Stats
  const totalPedidos = pedidos.length;
  const totalReceita = pedidos
    .filter(p => p.status === 'ENTREGUE' || p.status === 'PROCESSANDO' || p.status === 'PENDENTE_SUPORTE')
    .reduce((s, p) => s + (p.total || 0), 0);
  const totalAguardando = pedidos.filter(p => p.status === 'AGUARDANDO_PAGAMENTO').length;
  const totalPendenteSuporte = pedidos.filter(p => p.status === 'PENDENTE_SUPORTE').length;

  const totalEntregue = pedidos.filter(p => p.status === 'ENTREGUE').length;
  const totalCancelado = pedidos.filter(p => p.status === 'CANCELADO').length;

  const abas = [
    { id: 'TODOS', label: 'Todos', icone: Layers, cor: 'text-zinc-400' },
    { id: 'AGUARDANDO_PAGAMENTO', label: 'Pendentes', icone: Clock, cor: 'text-amber-400' },
    { id: 'PENDENTE_SUPORTE', label: 'Entregar', icone: AlertTriangle, cor: 'text-orange-400' },
    { id: 'ENTREGUE', label: 'Entregues', icone: CheckCircle, cor: 'text-emerald-400' },
    { id: 'CANCELADO', label: 'Cancelados', icone: X, cor: 'text-rose-400' },
  ];

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
          <Package className="text-primary" size={22} /> Pedidos & Entregas
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Aprove pagamentos, visualize entregas e envie credenciais para pedidos manuais.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-primary" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Total Pedidos</span>
          </div>
          <span className="text-lg font-bold text-white">{totalPedidos}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Receita (pagos)</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">{FormatarMoeda(totalReceita)}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Entregues</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">{totalEntregue}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Send size={14} className="text-orange-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Pendentes Envio</span>
          </div>
          <span className={`text-lg font-bold ${totalPendenteSuporte > 0 ? 'text-orange-400' : 'text-zinc-500'}`}>{totalPendenteSuporte}</span>
        </div>
      </div>

      {erro && (
        <div className="mb-4 bg-rose-500/20 border border-rose-600 p-3 rounded-xl text-rose-400 font-bold text-xs">
          {erro} <button onClick={() => setErro('')} className="ml-2 text-rose-300 hover:text-white">✕</button>
        </div>
      )}
      {sucesso && (
        <div className="mb-4 bg-emerald-500/20 border border-emerald-600 p-3 rounded-xl text-emerald-400 font-bold text-xs">
          ✓ {sucesso}
        </div>
      )}

      {/* Search + Order */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por ID, cliente, produto ou variação..." className="input-padrao w-full pl-9 text-xs" />
        </div>
        <button onClick={() => setOrdem(ordem === 'recente' ? 'antigo' : 'recente')}
          className="flex items-center gap-1.5 text-[10px] px-3 py-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors font-bold uppercase flex-shrink-0">
          <ArrowUpDown size={14} />
          {ordem === 'recente' ? 'Mais Recente' : 'Mais Antigo'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {abas.map((aba) => {
          const count = aba.id === 'TODOS' ? totalPedidos : pedidos.filter(p => p.status === aba.id).length;
          return (
            <button key={aba.id} onClick={() => setFiltroAtivo(aba.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filtroAtivo === aba.id
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'
              }`}>
              <aba.icone size={14} className={filtroAtivo === aba.id ? aba.cor : ''} />
              {aba.label}
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                filtroAtivo === aba.id ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-900 text-zinc-600'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {carregando ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="card-padrao p-12 text-center">
          <Package className="text-zinc-600 mx-auto mb-3" size={40} />
          <p className="text-zinc-500 text-sm font-medium">Nenhum pedido encontrado.</p>
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="card-padrao p-12 text-center">
          <Filter className="text-zinc-600 mx-auto mb-3" size={40} />
          <p className="text-zinc-500 text-sm font-medium">Nenhum pedido corresponde ao filtro ou busca.</p>
          {busca && <p className="text-[10px] text-zinc-600 mt-1">Tente outro termo.</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {gruposFiltrados.map((grupo) => {
            const items = grupo.pedidos;
            const clientes = [...new Set(items.map(p => p.userName))];
            const entregues = items.filter(p => p.status === 'ENTREGUE').length;
            const pendentes = items.filter(p => p.status === 'PENDENTE_SUPORTE').length;
            const aguardando = items.filter(p => p.status === 'AGUARDANDO_PAGAMENTO').length;
            const primeiroItem = items[0];
            const ehGrupoReal = items.length > 1 || grupo.id?.startsWith('GRP-');

            return (
              <div key={grupo.id} className="card-padrao overflow-hidden border-zinc-800">
                {/* Group Header */}
                <div className="bg-zinc-900/80 border-b border-zinc-800/80 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <Package size={14} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {clientes.length === 1 ? clientes[0] : `${clientes.length} clientes`}
                        </span>
                        {(primeiroItem?.dateCreated || primeiroItem?.date) && (
                          <span className="text-[10px] text-zinc-500">
                            {new Date(primeiroItem.dateCreated || primeiroItem.date).toLocaleString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        )}
                        {grupo.id?.startsWith('GRP-') && (
                          <code className="text-[9px] text-zinc-600 font-mono">{grupo.id}</code>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {items.length} item(ns)
                        {entregues > 0 && <span className="text-emerald-400 ml-2">{entregues} entregue(s)</span>}
                        {pendentes > 0 && <span className="text-orange-400 ml-2">{pendentes} pendente(s)</span>}
                        {aguardando > 0 && <span className="text-amber-400 ml-2">{aguardando} aguardando PIX</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entregues === items.length && items.length > 1 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> Completo
                      </span>
                    )}
                    {items.some(p => p.status === 'AGUARDANDO_PAGAMENTO') && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-bold">
                        {items.filter(p => p.status === 'AGUARDANDO_PAGAMENTO').length} pendente(s) PIX
                      </span>
                    )}
                    {items.some(p => p.status === 'PENDENTE_SUPORTE') && (
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded font-bold">
                        Precisa entregar
                      </span>
                    )}
                  </div>
                </div>

                {/* Items dentro do grupo */}
                <div className="divide-y divide-zinc-800/50">
                  {items.map((p) => (
                    <div key={p.id} className={`px-4 py-3 transition-colors ${
                      p.status === 'ENTREGUE' ? 'bg-emerald-500/[0.02]' :
                      p.status === 'CANCELADO' ? 'bg-rose-500/[0.02]' :
                      p.status === 'PENDENTE_SUPORTE' ? 'bg-orange-500/[0.02]' : ''
                    }`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-bold text-white truncate">{p.productName || 'Produto'}</span>
                            {p.variationName && p.variationName !== 'Opção Padrão' && (
                              <span className="text-[10px] text-cyan-400 font-mono">({p.variationName})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-zinc-500">
                            <code className="text-zinc-600 font-mono">{p.id}</code>
                            <BadgeStatus status={p.status} />
                            <BadgeEntrega metodo={p.metodoEntrega} />
                            <span className="text-zinc-600">{p.quantity}x {FormatarMoeda(p.total)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => setDetalhesPedido(p)} className="botao-neutro text-[10px] py-1.5 px-2" title="Detalhes">
                            <Eye size={13} />
                          </button>
                          {p.status === 'AGUARDANDO_PAGAMENTO' && (
                            <button onClick={() => lidarComAprovarPagamento(p.id)} disabled={processandoPagamento === p.id} className={`botao-sucesso text-[10px] py-1.5 px-2.5 ${processandoPagamento === p.id ? 'opacity-60 cursor-not-allowed' : ''}`}>
                              {processandoPagamento === p.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={13} />} Aprovar
                            </button>
                          )}
                          {p.status === 'PENDENTE_SUPORTE' && (
                            <button onClick={() => { setPedidoSelecionado(p); setConteudoEntregaText(''); }} className="botao-primario text-[10px] py-1.5 px-2.5">
                              <Send size={13} /> Entregar
                            </button>
                          )}
                          {p.status !== 'ENTREGUE' && p.status !== 'CANCELADO' && (
                            <button onClick={() => lidarComCancelar(p.id)} disabled={cancelandoPedido === p.id} className={`text-zinc-600 hover:text-rose-400 p-1 transition-colors ${cancelandoPedido === p.id ? 'opacity-50 cursor-not-allowed' : ''}`} title="Cancelar">
                              {cancelandoPedido === p.id ? <div className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /> : <X size={15} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Delivery content preview */}
                      {p.status === 'ENTREGUE' && p.deliveryContent?.length > 0 && (
                        <div className="mt-2 border-t border-zinc-800/30 pt-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold mb-1">
                            <CheckCircle size={11} /> Itens entregues:
                          </div>
                          {p.deliveryContent.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 group">
                              <code className="flex-1 text-[10px] text-zinc-300 font-mono bg-zinc-900/60 px-2 py-0.5 rounded truncate">{item}</code>
                              <button onClick={() => copiarTexto(item, `g-${p.id}-${i}`)}
                                className="text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5">
                                {copiado === `g-${p.id}-${i}` ? <span className="text-emerald-400 text-[9px] font-bold">OK</span> : <Copy size={11} />}
                              </button>
                            </div>
                          ))}
                          {p.deliveryContent.length > 2 && (
                            <button onClick={() => setDetalhesPedido(p)} className="text-[10px] text-zinc-600 hover:text-zinc-400 mt-0.5 font-medium">
                              +{p.deliveryContent.length - 2} mais...
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Detalhes */}
      {detalhesPedido && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card-padrao w-full max-w-lg bg-zinc-950 text-white p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye size={16} className="text-primary" /> Detalhes do Pedido
                </h3>
                <code className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{detalhesPedido.id}</code>
              </div>
              <button onClick={() => setDetalhesPedido(null)} className="text-zinc-500 hover:text-white text-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
                {[
                  { label: 'Status', value: <BadgeStatus status={detalhesPedido.status} /> },
                  { label: 'Cliente', value: <span className="text-white font-bold">{detalhesPedido.userName || 'N/A'}</span> },
                  { label: 'Produto', value: <span className="text-white font-bold">{detalhesPedido.productName || 'N/A'}</span> },
                  ...(detalhesPedido.variationName && detalhesPedido.variationName !== 'Opção Padrão'
                    ? [{ label: 'Variação', value: <span className="text-cyan-400">{detalhesPedido.variationName}</span> }]
                    : []),
                  { label: 'Quantidade', value: <span className="text-white font-bold">{detalhesPedido.quantity || 1}x</span> },
                  { label: 'Valor Total', value: <span className="text-emerald-400 font-bold">{FormatarMoeda(detalhesPedido.total || 0)}</span> },
                  { label: 'Método', value: (
                    <span className={detalhesPedido.metodoEntrega === 'AUTOMATICA' ? 'text-cyan-400' : 'text-amber-400'}>
                      {detalhesPedido.metodoEntrega === 'AUTOMATICA' ? 'ENTREGA AUTOMÁTICA' : 'ENTREGA MANUAL'}
                    </span>
                  )},
                  { label: 'Data', value: <span className="text-zinc-300">{(detalhesPedido.dateCreated || detalhesPedido.date) ? new Date(detalhesPedido.dateCreated || detalhesPedido.date).toLocaleString('pt-BR') : 'N/A'}</span> },
                  ...(detalhesPedido.groupId
                    ? [{ label: 'Grupo', value: <code className="text-zinc-500 text-[10px] font-mono">{detalhesPedido.groupId}</code> }]
                    : []),
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-zinc-400">{r.label}</span>
                    <div className="text-right">{r.value}</div>
                  </div>
                ))}
              </div>

              {detalhesPedido.timeline?.length > 0 && (
                <div>
                  <h4 className="text-xs text-zinc-400 font-bold uppercase mb-3 flex items-center gap-2">
                    <Clock size={14} /> Timeline
                  </h4>
                  <div className="relative pl-6 space-y-3">
                    <div className="absolute left-[7px] top-1 bottom-0 w-px bg-zinc-800" />
                    {detalhesPedido.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[19px] top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          i === detalhesPedido.timeline.length - 1 && detalhesPedido.status === 'ENTREGUE'
                            ? 'border-emerald-500 bg-emerald-500/20'
                            : detalhesPedido.status === 'CANCELADO' && i === detalhesPedido.timeline.length - 1
                            ? 'border-rose-500 bg-rose-500/20'
                            : 'border-primary bg-zinc-900'
                        }`}>
                          {i === detalhesPedido.timeline.length - 1 && detalhesPedido.status === 'ENTREGUE' && <Check size={7} className="text-emerald-400" />}
                        </div>
                        <p className="text-xs text-white font-medium">{t.label}</p>
                        <p className="text-[10px] text-zinc-500">{t.date ? new Date(t.date).toLocaleString('pt-BR') : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detalhesPedido.deliveryContent?.length > 0 && (
                <div>
                  <h4 className="text-xs text-zinc-400 font-bold uppercase mb-3">Conteúdo Entregue</h4>
                  <div className="space-y-1.5">
                    {detalhesPedido.deliveryContent.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 group">
                        <code className="flex-1 text-xs text-zinc-200 font-mono break-all">{item}</code>
                        <button onClick={() => copiarTexto(item, `det-${i}`)}
                          className="text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1">
                          {copiado === `det-${i}` ? <span className="text-emerald-400 text-[10px] font-bold">Copiado</span> : <Copy size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-zinc-800">
              {detalhesPedido.status === 'PENDENTE_SUPORTE' && (
                <button onClick={() => { setPedidoSelecionado(detalhesPedido); setDetalhesPedido(null); setConteudoEntregaText(''); }}
                  className="botao-primario text-xs uppercase"><Send size={14} /> Entregar Agora</button>
              )}
              <button onClick={() => setDetalhesPedido(null)} className="botao-neutro text-xs uppercase">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Entrega Manual */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card-padrao w-full max-w-md bg-zinc-950 text-white p-6 relative">
            <h3 className="font-bold text-xs text-white mb-2 uppercase tracking-wider flex items-center gap-2">
              <Send size={14} className="text-primary" /> Enviar Credenciais
            </h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 mb-4 space-y-1">
              {[
                { label: 'Pedido', value: <code className="text-white font-mono">{pedidoSelecionado.id}</code> },
                { label: 'Produto', value: <span className="text-white font-bold">{pedidoSelecionado.productName}</span> },
                ...(pedidoSelecionado.variationName && pedidoSelecionado.variationName !== 'Opção Padrão'
                  ? [{ label: 'Variação', value: <span className="text-cyan-400 font-bold">{pedidoSelecionado.variationName}</span> }]
                  : []),
                { label: 'Cliente', value: <span className="text-cyan-400 font-bold">{pedidoSelecionado.userName}</span> },
                { label: 'Quantidade', value: <span className="text-white">{pedidoSelecionado.quantity || 1}x</span> },
                { label: 'Valor', value: <span className="text-emerald-400 font-bold">{FormatarMoeda(pedidoSelecionado.total || 0)}</span> },
              ].map((r, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">{r.label}</span>
                  <div className="text-right">{r.value}</div>
                </div>
              ))}
            </div>

            <form onSubmit={submeterEntregaManual} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1.5">
                  Conteúdo (email:senha, chave, link...)
                </label>
                <textarea rows={6} required value={conteudoEntregaText} onChange={e => setConteudoEntregaText(e.target.value)}
                  placeholder={"Email: usuario@email.com\nSenha: MinhaChave123\nLink: https://exemplo.com/ativar"}
                  className="input-padrao w-full text-xs font-mono" />
                {conteudoEntregaText.trim() && (
                  <p className="text-[10px] text-zinc-500 mt-1">{conteudoEntregaText.split('\n').filter(l => l.trim()).length} linha(s)</p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setPedidoSelecionado(null)} className="botao-neutro text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={enviandoEntrega} className="botao-primario text-xs uppercase">
                  {enviandoEntrega ? 'Enviando...' : 'Entregar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
