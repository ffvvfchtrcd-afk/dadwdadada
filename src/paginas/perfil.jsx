import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/contexto_autenticacao';
import { ServicoPedidos } from '../servicos/servico_pedidos';
import { FormatarMoeda } from '../utilitarios/formatadores';
import { Clipboard, CheckCircle, Package, Clock, ShieldAlert, User, Mail, Wallet, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Perfil() {
  const { usuario, eAdmin, sair } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [copiadoId, setCopiadoId] = useState(null);

  const carregarPedidos = async () => {
    if (!usuario) return;
    try {
      setCarregando(true);
      const data = await ServicoPedidos.obterPedidosDoUsuario(usuario.id);
      setPedidos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, [usuario]);

  const copiarChave = (texto, itemId) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(itemId);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const obterBadgeStatus = (status) => {
    switch (status) {
      case 'ENTREGUE':
        return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Entregue</span>;
      case 'AGUARDANDO_PAGAMENTO':
        return <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Aguardando Pagamento</span>;
      case 'CANCELADO':
        return <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Cancelado</span>;
      case 'PROCESSANDO':
      case 'PENDENTE_SUPORTE':
        return <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Aguardando Envio</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  if (!usuario) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="font-bold text-lg text-white mb-2">Faça Login para Acessar</h3>
        <p className="text-zinc-400 text-xs">Você precisa estar logado para ver seu perfil e pedidos.</p>
        <Link to="/login" className="botao-primario inline-block mt-4">Fazer Login</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
      
      {/* Header do Perfil */}
      <div className="card-padrao p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2 relative z-10">
          <User className="text-primary" size={24} /> Meu Perfil
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* Dados Pessoais */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-primary font-bold text-lg uppercase">
                {usuario.nome.charAt(0)}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{usuario.nome}</h3>
                <span className="text-[10px] text-zinc-500 font-mono">ID: {usuario.id}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <Mail size={14} /> {usuario.email}
            </div>
          </div>

          {/* Saldo e Status */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex flex-col justify-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Wallet size={12} /> Saldo em Carteira
            </span>
            <h3 className="text-2xl font-bold text-emerald-400">{FormatarMoeda(usuario.saldo || 0)}</h3>
            <div className="mt-2 text-[10px]">
              Status da Conta: <strong className="text-primary">{usuario.status}</strong>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex flex-col gap-2 justify-center">
            {eAdmin && (
              <Link to="/admin" className="botao-secundario text-xs py-2 w-full flex items-center justify-center gap-2">
                <LayoutDashboard size={14} /> Acessar Painel Admin
              </Link>
            )}
            <button onClick={sair} className="botao-perigo text-xs py-2 w-full">
              Sair da Conta
            </button>
          </div>
        </div>
      </div>

      {/* Histórico de Pedidos */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Package className="text-secondary" size={20} /> Histórico de Pedidos
        </h2>
        <button 
          onClick={carregarPedidos}
          className="botao-neutro text-xs px-3 py-1.5"
        >
          Atualizar Lista
        </button>
      </div>

      {carregando ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-zinc-500 font-medium">Buscando seus pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="card-padrao p-12 text-center">
          <Package className="text-zinc-600 mx-auto mb-4" size={40} />
          <h3 className="text-sm font-bold text-zinc-400 mb-1">Nenhum pedido realizado</h3>
          <p className="text-zinc-500 text-xs">Suas compras digitais aparecerão detalhadas aqui.</p>
          <Link to="/" className="botao-primario inline-block mt-6 text-xs px-6 py-2">Explorar Produtos</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div 
              key={pedido.id}
              className="card-padrao p-5"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold block mb-0.5">PEDIDO ID</span>
                  <code className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">{pedido.id}</code>
                </div>
                <div className="flex items-center gap-2">
                  {obterBadgeStatus(pedido.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-sm text-white mb-3">{pedido.productName}</h4>
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <p className="flex justify-between border-b border-zinc-800/50 pb-1">
                      <span>Variação:</span> <strong className="text-white">{pedido.variationName}</strong>
                    </p>
                    <p className="flex justify-between border-b border-zinc-800/50 pb-1">
                      <span>Quantidade:</span> <strong className="text-white">{pedido.quantity}x</strong>
                    </p>
                    <p className="flex justify-between border-b border-zinc-800/50 pb-1">
                      <span>Total pago:</span> <strong className="text-emerald-400">{FormatarMoeda(pedido.total)}</strong>
                    </p>
                    <p className="flex justify-between border-b border-zinc-800/50 pb-1">
                      <span>Data:</span> <strong className="text-zinc-300">{new Date(pedido.dateCreated || pedido.date).toLocaleString('pt-BR')}</strong>
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center">
                  {pedido.status === 'ENTREGUE' ? (
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle size={14} /> Credenciais Entregues:
                      </span>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {(pedido.deliveryContent || []).map((cred, idx) => (
                          <div 
                            key={idx}
                            className="bg-black/50 border border-zinc-800 rounded-lg p-2.5 text-xs flex justify-between items-center gap-3 group hover:border-zinc-700 transition-colors"
                          >
                            <span className="font-mono break-all select-all text-zinc-300">{cred}</span>
                            <button
                              onClick={() => copiarChave(cred, `${pedido.id}_${idx}`)}
                              className="text-zinc-500 hover:text-white flex-shrink-0"
                              title="Copiar para área de transferência"
                            >
                              {copiadoId === `${pedido.id}_${idx}` ? (
                                <CheckCircle size={16} className="text-emerald-400" />
                              ) : (
                                <Clipboard size={16} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : pedido.status === 'AGUARDANDO_PAGAMENTO' ? (
                    <div className="text-center py-2 space-y-3">
                      <Clock className="text-amber-400 mx-auto animate-pulse" size={28} />
                      <p className="text-xs text-zinc-300 font-bold">Pagamento Pendente</p>
                      <button
                        onClick={() => {
                          sessionStorage.setItem("nexmarket_checkout", JSON.stringify({
                            pedidoIds: [pedido.id],
                            total: pedido.total,
                            limparCarrinho: false
                          }));
                          navigate("/checkout");
                        }}
                        className="botao-sucesso w-full text-xs font-bold py-2.5 shadow-sm uppercase tracking-wider"
                      >
                        Pagar com PIX
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Package className="text-cyan-400/50 mx-auto mb-2" size={24} />
                      <p className="text-xs text-zinc-300 font-medium">Seu pedido está sendo processado.</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Aguarde, as credenciais aparecerão aqui em breve.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
