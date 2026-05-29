-- ==========================================
-- RESET COMPLETO NEXMARKET
-- Limpa TODOS os dados da loja
-- ==========================================

-- 1. DELETA dados de todas as tabelas (ordem correta por FK)
DELETE FROM public.logs_sistema;
DELETE FROM public.notificacoes;
DELETE FROM public.compras;
DELETE FROM public.variacoes;
DELETE FROM public.products;
DELETE FROM public.categories;
DELETE FROM public.cupons;
DELETE FROM public.configuracoes;
DELETE FROM public.users;

-- 2. Reseta sequences (auto-increment)
ALTER SEQUENCE public.categories_id_seq RESTART WITH 1;
ALTER SEQUENCE public.variacoes_id_seq RESTART WITH 1;
ALTER SEQUENCE public.notificacoes_id_seq RESTART WITH 1;
ALTER SEQUENCE public.logs_sistema_id_seq RESTART WITH 1;
ALTER SEQUENCE public.cupons_id_seq RESTART WITH 1;

-- 3. Recria configuração padrão
INSERT INTO public.configuracoes (id, nome_loja, cupom_ativo)
VALUES (1, 'NEXMARKET', false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- CRIAR ADMIN (edite email/senha/nome abaixo)
-- ==========================================
-- Descomente e edite antes de executar:
-- INSERT INTO public.users (id, nome, email, senha, role, cargo, status, saldo, comprasIds, emailVerificado, dataCadastro, dataAtualizacao, dataCriacao)
-- VALUES (EXTRACT(EPOCH FROM NOW())::BIGINT, 'SeuNome', 'seu@email.com', 'sua-senha', 'ADMIN', 'ADMIN', 'ATIVO', 0, '', false, NOW(), NOW(), NOW());

-- ==========================================
-- VERIFICAÇÃO (deve mostrar 0 em todas)
-- ==========================================
SELECT 'categories' as tabela, COUNT(*) FROM public.categories
UNION ALL SELECT 'products', COUNT(*) FROM public.products
UNION ALL SELECT 'variacoes', COUNT(*) FROM public.variacoes
UNION ALL SELECT 'compras', COUNT(*) FROM public.compras
UNION ALL SELECT 'notificacoes', COUNT(*) FROM public.notificacoes
UNION ALL SELECT 'cupons', COUNT(*) FROM public.cupons
UNION ALL SELECT 'logs_sistema', COUNT(*) FROM public.logs_sistema
UNION ALL SELECT 'users', COUNT(*) FROM public.users;
