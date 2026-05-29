import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ServicoCarrinho } from '../servicos/servico_carrinho';
import { CentralMensagens } from '../utilitarios/central_mensagens';
import { useAuth } from './contexto_autenticacao';

const ContextoCarrinho = createContext(null);

export function CartProvider({ children }) {
  const { usuario } = useAuth();
  const [carrinho, setCarrinho] = useState([]);
  const [carregandoCarrinho, setCarregandoCarrinho] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState("");
  const [toast, setToast] = useState(null);

  const [termoBusca, setTermoBusca] = useState("");
  const [logsAbertos, setLogsAbertos] = useState(false);

  const carregarCarrinho = useCallback(async () => {
    if (!usuario) {
      setCarrinho([]);
      return;
    }
    setCarregandoCarrinho(true);
    const itens = await ServicoCarrinho.listarItens(usuario.id);
    setCarrinho(itens);
    setCarregandoCarrinho(false);
  }, [usuario]);

  useEffect(() => {
    carregarCarrinho();
  }, [carregarCarrinho]);

  const mostrarToast = (tipo, mensagem, titulo = "") => {
    const novaMsg = CentralMensagens.criarMensagem(tipo, mensagem, titulo);
    setToast(novaMsg);
    setTimeout(() => {
      setToast((prev) => (prev && prev.id === novaMsg.id ? null : prev));
    }, 4000);
  };

  const adicionarAoCarrinho = async (produto, qtd) => {
    if (!usuario) {
      mostrarToast("erro", "Você precisa fazer login para adicionar ao carrinho.", "OPS!");
      return;
    }
    try {
      await ServicoCarrinho.adicionarItem(usuario.id, produto, produto.variacao_id || null, qtd);
      await carregarCarrinho();
      mostrarToast("sucesso", `Adicionado ${qtd}x ${produto.titulo || produto.nome} ao carrinho!`, "POW!");
    } catch (e) {
      mostrarToast("erro", e.message, "OPS!");
    }
  };

  const removerDoCarrinho = async (itemId) => {
    if (!usuario) return;
    try {
      await ServicoCarrinho.removerItem(usuario.id, itemId);
      await carregarCarrinho();
      mostrarToast("info", "Item removido do seu carrinho.");
    } catch (e) {
      console.error(e);
    }
  };

  const atualizarQuantidade = async (itemId, novaQtd, estoqueMax) => {
    if (!usuario) return;
    try {
      await ServicoCarrinho.atualizarQuantidade(usuario.id, itemId, novaQtd, estoqueMax);
      await carregarCarrinho();
    } catch (e) {
      mostrarToast("alerta", e.message, "CUIDADO!");
    }
  };

  const aplicarCupom = (codigo) => {
    setCupomAplicado(codigo);
    mostrarToast("sucesso", "Cupom 10% OFF aplicado!", "WOW!");
  };

  const limparCarrinho = async () => {
    if (!usuario) return;
    await ServicoCarrinho.limparCarrinho(usuario.id);
    setCarrinho([]);
    setCupomAplicado("");
  };

  const carrinhoCount = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <ContextoCarrinho.Provider value={{
      carrinho,
      carregandoCarrinho,
      carrinhoCount,
      cupomAplicado,
      aplicarCupom,
      adicionarAoCarrinho,
      removerDoCarrinho,
      atualizarQuantidade,
      limparCarrinho,
      toast,
      mostrarToast,
      termoBusca,
      setTermoBusca,
      logsAbertos,
      setLogsAbertos
    }}>
      {children}
    </ContextoCarrinho.Provider>
  );
}

export function useCart() {
  const context = useContext(ContextoCarrinho);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
