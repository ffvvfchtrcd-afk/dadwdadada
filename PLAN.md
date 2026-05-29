# Performance, Robustness & UX Optimization Plan

> **Goal:** Improve the NEXMARKET e-commerce application's resilience under real-world conditions (network failures, slow APIs, rapid user actions, rendering crashes), while reducing unnecessary re-renders and streamlining the AI assistant flow.

---

## Area 1: API Layer — Timeout, Retry & Validation

### Files to change
| File | Change Type |
|------|-------------|
| `api/chat-ia.js` | Add timeout, retry, use frontend context |
| `api/criar-pagamento.js` | Add timeout, retry, input validation |
| `api/verificar-pagamento.js` | Add timeout, retry |

### 1.1 — Add AbortController timeout to all outbound `fetch()` calls

| Detail | Value |
|--------|-------|
| **What** | Wrap every `fetch()` in an `AbortController` with a 15-second timeout. In Vercel serverless (Hobby plan 10s max), this prevents hanging requests from consuming function runtime. |
| **Why** | If OpenRouter or Mercado Pago API hangs, the Vercel function will eventually timeout (10s Hobby, 60s Pro) but the user gets no feedback and the invocation is wasted. A proactive AbortController rejects with a clear `TimeoutError` that we can message to the user. |
| **Pattern** | `const ac = new AbortController(); setTimeout(() => ac.abort(), 15000);` … `fetch(url, { signal: ac.signal })` |
| **Priority** | **P0** |

**Implementation in each file:**

- **`api/chat-ia.js`** (around line 38):
  ```js
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 15000);
  const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: ac.signal,
    headers: { … },
    body
  });
  clearTimeout(timeout);
  ```

- **`api/criar-pagamento.js`** (around line 17) — same pattern.
- **`api/verificar-pagamento.js`** (around line 11) — same pattern.

> **Extra for criar-pagamento:** Validate `transaction_amount` is a finite number > 0, `pedidoId` is a non-empty string before calling Mercado Pago. Returns early with a 400-level message instead of wasting an API call.

### 1.2 — Add retry logic on network failure / 5xx

| Detail | Value |
|--------|-------|
| **What** | Retry the fetch once with a 1-second delay if the first attempt throws a network error or returns a 5xx status. |
| **Why** | Transient failures (DNS hiccup, temporary OpenRouter/MercadoPago 502) self-resolve within seconds. One retry massively improves success rate with negligible cost. |
| **Pattern** | Wrap the fetch in a `for (let attempt = 0; attempt < 2; attempt++)` loop. On `TypeError` (network) or `res.status >= 500`, wait 1s then retry. AbortController timeout still applies. |
| **Priority** | **P1** |

### 1.3 — Use frontend context in chat-ia.js

| Detail | Value |
|--------|-------|
| **What** | The frontend (`chat_ia.jsx` line 78) sends `context: contexto` in the request body, containing `nomeLoja`, `catalogo` (id/nome/status), `categorias` (id/nome), and `produtosCount`. The server currently ignores it entirely. Destructure `context` from `req.body` and inject relevant data into the system prompt. |
| **Why** | Without this, the AI has no awareness of the current catalog. It can use tools to query, but injecting counts & category names upfront reduces API calls for simple questions like "how many products do I have?" |
| **Priority** | **P1** |

**Implementation:**
```js
const { message, historico, context } = req.body;

// Build enriched system prompt
let systemContent = 'Você é o assistente IA da loja NEXMARKET. Responda em português brasileiro.';
if (context?.categorias?.length) {
  systemContent += `\nCategorias disponíveis: ${context.categorias.map(c => c.nome).join(', ')}.`;
}
if (context?.produtosCount !== undefined) {
  systemContent += `\nTotal de produtos no catálogo: ${context.produtosCount}.`;
}
```

---

## Area 2: Auth — Session Persistence & Unexpected Logouts

### Files to change
| File | Change Type |
|------|-------------|
| `src/contextos/contexto_autenticacao.jsx` | Add session validation, storage corruption handling |
| `src/servicos/servico_autenticacao.js` | No changes (validation is client-side concern) |

### 2.1 — Validate stored session on app start

| Detail | Value |
|--------|-------|
| **What** | In the `useEffect` on mount (line 12-39), after reading the user from `localStorage`, verify the user still exists in Supabase. If the Supabase query fails (network error), keep the cached user. If the query succeeds but returns no rows (user was deleted), clear the session and set `usuario` to `null`. |
| **Why** | Currently, if an admin deletes a user from the database, that user remains logged in until they manually clear localStorage. Without server-side validation, there's no way to remotely revoke sessions. |
| **Priority** | **P0** |

**Current behavior (line 22-28):**
```js
if (data && !error) {
  setUsuario(mappedUser);  // ✅ syncs with DB — good
} else {
  setUsuario(user);        // ❌ keeps stale user if data is null
}
```

**Change to:**
```js
if (data && !error) {
  const mappedUser = { ...data };
  delete mappedUser.senha;
  localStorage.setItem('nexmarket_user', JSON.stringify(mappedUser));
  setUsuario(mappedUser);
} else if (error) {
  // Network error — keep cached user
  setUsuario(user);
} else {
  // Data is null — user was deleted/deactivated. Clear session.
  localStorage.removeItem('nexmarket_user');
  setUsuario(null);
}
```

> Note: The `.catch()` at line 32 already handles query errors gracefully (keeps cached user). This change handles the "user deleted" case where the query succeeds but returns no data.

### 2.2 — Handle localStorage corruption

| Detail | Value |
|--------|-------|
| **What** | Wrap the `JSON.parse(userStr)` in `obterUsuarioLogado` (line 129) with additional validation. If the parsed object lacks an `id` field, treat it as corrupted and clear it. |
| **Why** | The existing `try/catch` catches `JSON.parse` errors, but if a manual edit or another script corrupts the value to valid JSON that's not a user object (e.g., `"null"`, `"{}"`), the app would set a user with no `id`, causing crashes downstream. |
| **Priority** | **P1** |

**Change `servico_autenticacao.js` (line 126-133):**
```js
obterUsuarioLogado() {
  try {
    const userStr = localStorage.getItem('nexmarket_user');
    if (!userStr) return null;
    const parsed = JSON.parse(userStr);
    if (!parsed || !parsed.id) {
      localStorage.removeItem('nexmarket_user');
      return null;
    }
    return parsed;
  } catch (erro) {
    localStorage.removeItem('nexmarket_user');
    return null;
  }
},
```

### 2.3 — Add periodic re-validation

| Detail | Value |
|--------|-------|
| **What** | Every 5 minutes, if a user is logged in, fire a lightweight Supabase query (`select id, status from users where id = X`) to check if the user is still active. If `status !== 'ATIVO'`, force logout. |
| **Why** | Admins can deactivate users. Without periodic checks, deactivated users can browse authenticated pages for up to 5 minutes (or until next manual refresh). |
| **Priority** | **P2** |

**In `contexto_autenticacao.jsx`, add a second `useEffect`:**
```js
useEffect(() => {
  if (!usuario) return;
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('users')
      .select('status')
      .eq('id', usuario.id)
      .maybeSingle();
    if (data && data.status !== 'ATIVO') {
      sair();  // force logout
    }
  }, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, [usuario?.id]);
```

> Note: `sair()` is defined below in the same component — this works because hooks capture the current closure.

---

## Area 3: React Performance — Missing `useMemo`/`useCallback`

### Files to change
| File | Change Type |
|------|-------------|
| `src/paginas/admin/gerenciar_pedidos.jsx` | Add `useCallback` on handlers, `useMemo` on stats |
| `src/paginas/admin/gerenciar_produtos.jsx` | Add `useMemo` for computed categories |
| `src/paginas/loja.jsx` | Add `useMemo` for filtered products, `useCallback` on handlers |

### 3.1 — gerenciar_pedidos.jsx

| Change | Lines | Detail | Priority |
|--------|-------|--------|----------|
| Wrap `carregarPedidos` in `useCallback` | 73-84 | Currently a raw `async function` inside the component — recreated every render. Used by `useEffect` and called after mutations. | **P1** |
| Wrap `lidarComAprovarPagamento` in `useCallback` | 98-113 | Recreated every render, passed as `onClick` to buttons inside `.map()` | **P1** |
| Wrap `lidarComCancelar` in `useCallback` | 115-131 | Same pattern | **P1** |
| Wrap `submeterEntregaManual` in `useCallback` | 133-157 | Same pattern | **P1** |
| Wrap `copiarTexto` in `useCallback` | 91-96 | Recreated every render | **P2** |
| Move stats into `useMemo` | 202-210 | `totalPedidos`, `totalReceita`, `totalAguardando`, `totalPendenteSuporte`, `totalEntregue`, `totalCancelado` are all derived from `pedidos` array — compute once per `pedidos` change | **P2** |

**Why:** The render tree includes ~20+ buttons in the `.map()` loop. Each raw arrow function creates a new closure, causing child memo'd elements to re-render. With `useCallback`, closures stabilize across renders unless dependencies change.

### 3.2 — gerenciar_produtos.jsx

| Change | Lines | Detail | Priority |
|--------|-------|--------|----------|
| Wrap `categoriasComProdutos` in `useMemo` | 71-74 | Filters all products per category on every render. With 50+ products and 10 categories, this is 500+ iterations per render. | **P1** |
| Wrap `produtosSemCategoria` in `useMemo` | 69 | Recomputes every render | **P2** |
| Wrap `carregarDados` in `useCallback` | 42-57 | Recreated every render, used in `useEffect` | **P1** |
| Wrap `lidarComCriarCategoria`, `lidarComExcluirCategoria` etc. in `useCallback` | 77-120 | Event handlers passed to child elements | **P2** |
| Wrap `lidarComSalvar` in `useCallback` | 221-274 | Complex save handler with async operations | **P2** |

**Why `categoriasComProdutos` is the highest impact:** It runs `produtos.filter()` inside `.map()` (O(n*m) per render). `useMemo` with `[produtos, categorias]` dependencies reduces this to O(n*m) only when data changes.

### 3.3 — loja.jsx (catalog)

| Change | Lines | Detail | Priority |
|--------|-------|--------|----------|
| Wrap `produtosFiltrados` in `useMemo` | 91-95 | Filters all products by search term + category on every render (typing in search re-renders immediately) | **P1** |
| Wrap `categoriasDisponiveis` in `useMemo` | 88 | Derives unique categories from products | **P2** |
| Wrap `lidarComComprarImediato` in `useCallback` | 46-67 | Recreated on every render, passed to multiple `<CardProduto>` children | **P2** |
| Wrap `lidarComAtualizacaoEstoque` in `useCallback` | 69-79 | Recreated every render | **P2** |
| Wrap `reabastecerEstoqueTudo` in `useCallback` | 81-85 | Recreated every render | **P2** |

**Why `produtosFiltrados` is the highest impact:** The search input triggers re-render on every keystroke. Without `useMemo`, the entire product array is refiltered each time. With 100+ products, this causes visible input lag on slower devices.

### 3.4 — card_produto.jsx ✅

Already uses `useMemo` for `fotoUrl` (line 11). No changes needed.

### 3.5 — grade_produtos.jsx ✅

Pure presentational component. No changes needed.

### 3.6 — chat_ia.jsx

| Change | Lines | Detail | Priority |
|--------|-------|--------|----------|
| Wrap `enviar` in `useCallback` | 52-66 | Recreated on every render | **P2** |
| Wrap `processarMensagem` in `useCallback` | 68-121 | Recursive function, currently recreated every render | **P2** |
| Wrap `copiar` in `useCallback` | 123 | Simple handler | **P2** |

---

## Area 4: Error Boundaries

### Files to change
| File | Change Type |
|------|-------------|
| `src/componentes/ErrorBoundary.jsx` | **NEW** — Create error boundary component |
| `src/App.jsx` | Wrap root routes with error boundary |

### 4.1 — Create React Error Boundary (class component)

| Detail | Value |
|--------|-------|
| **What** | Create `src/componentes/ErrorBoundary.jsx` — a class component implementing `componentDidCatch(error, errorInfo)` and `getDerivedStateFromError(error)`. Renders a fallback UI with: (a) user-friendly message ("Algo deu errado"), (b) a "Recarregar" button that does `window.location.reload()`, (c) an expandable `details` block with the error stack for debugging. |
| **Why** | Currently, any uncaught render error (e.g., `Cannot read properties of null` in a deeply nested component) crashes the entire React tree (white screen). Error boundaries contain the crash, showing a fallback and logging the error to console. |
| **Priority** | **P0** |

**Estimated implementation:**
```jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="…">  {/* styled fallback matching the dark theme */}
          <h2>Algo deu errado</h2>
          <p>Ocorreu um erro inesperado.</p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
          {process.env.NODE_ENV === 'development' && (
            <details><pre>{this.state.error?.stack}</pre></details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 4.2 — Apply ErrorBoundary in App.jsx

| Detail | Value |
|--------|-------|
| **What** | Wrap the `<Routes>` block (lines 72-146) with `<ErrorBoundary>`. |
| **Why** | If any page component crashes during render, only the routes area shows the fallback. The header (Cabeçalho), floating Discord button, toast, and mobile menu remain functional. The user can still navigate to other pages. |
| **Priority** | **P0** |

**Implementation in `src/App.jsx`:**
```diff
+ import ErrorBoundary from './componentes/ErrorBoundary';

  return (
    <div className="…">
      <Cabecalho />
+     <ErrorBoundary>
        <Routes>
          …
        </Routes>
+     </ErrorBoundary>
      <FlutuanteDiscord />
      {toast && ( … )}
      <MenuInferior />
    </div>
  );
```

### 4.3 — Add route-level errorElement (React Router v7+)

| Detail | Value |
|--------|-------|
| **What** | Add a catch-all `errorElement` at the Route level using React Router v7's data router APIs. |
| **Why** | `errorElement` catches both render errors AND thrown errors from loaders/actions. However, since the current app uses `<BrowserRouter>` (not `createBrowserRouter`), this would require a router migration. Mark as **P2** — implement only if other changes make the migration natural. |
| **Priority** | **P2** |

---

## Area 5: Chat IA — Parallel Tool Execution & Better UX

### Files to change
| File | Change Type |
|------|-------------|
| `src/servicos/ferramentas_ia.js` | Add dependency metadata for grouping |
| `src/paginas/admin/chat_ia.jsx` | Parallel tool execution, better feedback |

### 5.1 — Parallel execution of independent tools

| Detail | Value |
|--------|-------|
| **What** | Group tool calls by dependency. Read-only tools (`listar_produtos`, `listar_categorias`, `listar_pedidos`, `estatisticas_loja`, `recomendar_ajuste_preco`) are **independent** and can run in parallel via `Promise.all`. Write tools (`criar_produto`, `editar_produto`, `deletar_produto`, `adicionar_variacao`) must run **sequentially** because later calls may depend on earlier ones. |
| **Why** | The OpenRouter API can return multiple `tool_calls` in a single response (e.g., asking "list products and categories and stats"). The current `for...of` loop runs them sequentially, taking 3× the latency. Parallel execution reduces total time to `max(t1, t2, t3)` instead of `t1 + t2 + t3`. |
| **Priority** | **P0** |

**Implementation in `chat_ia.jsx`, inside `processarMensagem` (replace lines 89-106):**

```js
if (data.tool_calls?.length > 0) {
  let log = data.content || '';
  const toolCalls = data.tool_calls.filter(t => t.name && t.args);

  // Separate into read-only (parallel-safe) vs write (sequential)
  const readOnlyTools = ['listar_produtos', 'listar_categorias', 'listar_pedidos', 'estatisticas_loja', 'recomendar_ajuste_preco'];
  const reads = toolCalls.filter(t => readOnlyTools.includes(t.name));
  const writes = toolCalls.filter(t => !readOnlyTools.includes(t.name));

  // Run all reads in parallel
  if (reads.length > 0) {
    const results = await Promise.all(
      reads.map(tool => FerramentasIA.executar(tool.name, tool.args))
    );
    results.forEach((result, i) => {
      const resumo = result.sucesso
        ? JSON.stringify(result.dados || { sucesso: true }).slice(0, 1000)
        : `Erro: ${result.erro}`;
      log += `\n\n[Ferramenta: ${reads[i].name}] ${result.sucesso ? 'OK' : resumo}`;
    });
  }

  // Run writes sequentially (they may have ordering dependencies)
  for (const tool of writes) {
    const result = await FerramentasIA.executar(tool.name, tool.args);
    const resumo = result.sucesso
      ? JSON.stringify(result.dados || { sucesso: true }).slice(0, 1000)
      : `Erro: ${result.erro}`;

    // Confetti on first write action at depth 0
    if (result.sucesso && profundidade === 0) {
      const acoesComFestas = ['deletar_produto', 'criar_produto', 'editar_produto', 'adicionar_variacao'];
      if (acoesComFestas.includes(tool.name)) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#00e676', '#b92cff'] });
      }
    }
    log += `\n\n[Ferramenta: ${tool.name}] ${result.sucesso ? 'OK' : `Erro: ${resumo}`}`;
  }

  // Recursive call with results
  await processarMensagem(msg, [
    ...historico,
    { role: 'assistant', content: log }
  ], profundidade + 1);
}
```

### 5.2 — Better error messages from tool execution

| Detail | Value |
|--------|-------|
| **What** | In `ferramentas_ia.js`, after each `catch` block (line 228), map the raw error message to a user-friendly alternative. Common cases: permission errors ("Você não tem permissão"), not-found errors ("Produto não encontrado"), RLS errors ("Erro de acesso ao banco de dados"). |
| **Why** | Raw Supabase errors like `"new row violates row-level security policy for table X"` are confusing to a shop admin. Friendly translations build trust in the AI. |
| **Priority** | **P1** |

**Implementation:**
Add a helper at the top of `ferramentas_ia.js`:
```js
function amigavel(erro, contexto) {
  if (!erro) return 'Erro desconhecido.';
  if (erro.includes('violates row-level security')) return `Sem permissão para acessar ${contexto || 'este recurso'}.`;
  if (erro.includes('duplicate key')) return `Já existe um registro com este identificador.`;
  if (erro.includes('not found') || erro.includes('não encontrado')) return `${contexto || 'Registro'} não encontrado.`;
  return erro;  // fallback to raw message
}
```

Wrap each Supabase error: `return { sucesso: false, erro: amigavel(error.message, 'produto') };`

### 5.3 — Prevent double-send (debounce)

| Detail | Value |
|--------|-------|
| **What** | The `enviar` function (line 52-66) already checks `if (enviando) return;`. This is sufficient. However, the Enter key handler could fire twice in rapid succession if React batches poorly. Add a `inputRef` check or use `useRef` for a submission lock. |
| **Why** | Defensive — prevents duplicate tool executions if the `enviando` state hasn't propagated yet. |
| **Priority** | **P2** |

**Implementation:**
```js
const enviandoRef = useRef(false);
// In enviar:
if (enviandoRef.current) return;
enviandoRef.current = true;
setEnviando(true);
try { … } finally { enviandoRef.current = false; setEnviando(false); }
```

---

## Execution Order

### Wave 1 (No dependencies — can run in parallel)

| # | Area | Description | Dependency |
|---|------|-------------|------------|
| 1 | API | Add AbortController timeout to all 3 API files | None |
| 2 | Auth | Session validation (2.1) + storage corruption (2.2) | None |
| 3 | Error Boundary | Create ErrorBoundary component (4.1) | None |

### Wave 2 (Depends on Wave 1)

| # | Area | Description | Dependency |
|---|------|-------------|------------|
| 4 | Error Boundary | Wrap routes with ErrorBoundary in App.jsx | Wave 1 item 3 |
| 5 | API | Add retry logic (1.2) + use context in chat-ia (1.3) | Wave 1 item 1 |
| 6 | React Perf | gerenciar_pedidos: useCallback + useMemo | None |
| 7 | React Perf | gerenciar_produtos: useMemo for categories | None |
| 8 | React Perf | loja.jsx: useMemo for filtered products | None |
| 9 | Chat IA | Parallel tool execution (5.1) | None |

### Wave 3 (Polish — no hard dependencies)

| # | Area | Description | Dependency |
|---|------|-------------|------------|
| 10 | Auth | Periodic re-validation (2.3) | Wave 1 item 2 |
| 11 | Chat IA | Better error messages (5.2) | None |
| 12 | Chat IA | Prevent double-send (5.3) | None |
| 13 | React Perf | Remaining useCallback/useMemo (P2 items) | None |

---

## Verification Criteria

| Area | How to verify |
|------|---------------|
| API Timeout | Temporarily set timeout to 1ms → should see "Request timed out" error message, not a hanging request |
| API Retry | Block external API in dev tools → should see a retry attempt before final error |
| Auth Session | In Supabase dashboard, delete a user → within 30s (or page reload), that user should be logged out |
| Auth Storage | Manually edit localStorage `nexmarket_user` to `"invalid"` → app should not crash, user appears logged out |
| Error Boundary | Add `throw new Error("test")` in any page render → header remains visible, fallback shown, other routes work |
| useMemo (catalog) | Type rapidly in search bar → no visible lag, profiler shows stable filtered products reference |
| useMemo (categories) | Toggle category expand → no recomputation of unrelated categories |
| useCallback | Profiler shows button onClick handlers don't change reference unless dependencies change |
| Parallel Tools | Ask AI "list products and categories and stats" → network tab shows 3 parallel tool executions |
| Friendly Errors | Simulate a Supabase RLS error → message says "Sem permissão" not "row-level security policy" |
