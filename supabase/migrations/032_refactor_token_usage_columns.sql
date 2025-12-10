-- Ajustar estrutura da tabela token_usage
-- type passa a ser total_tokens (INTEGER)
-- tokens passa a ser cost_reais (NUMERIC)

-- 1. Renomear coluna 'type' para 'total_tokens' e mudar tipo
ALTER TABLE public.token_usage 
RENAME COLUMN type TO total_tokens;

ALTER TABLE public.token_usage 
ALTER COLUMN total_tokens TYPE INTEGER USING total_tokens::integer;

ALTER TABLE public.token_usage 
ALTER COLUMN total_tokens SET NOT NULL;

ALTER TABLE public.token_usage 
ALTER COLUMN total_tokens SET DEFAULT 0;

-- 2. Renomear coluna 'tokens' para 'cost_reais' e mudar tipo
ALTER TABLE public.token_usage 
RENAME COLUMN tokens TO cost_reais;

ALTER TABLE public.token_usage 
ALTER COLUMN cost_reais TYPE NUMERIC(10, 2) USING cost_reais::numeric;

-- 3. Atualizar comentários
COMMENT ON COLUMN public.token_usage.total_tokens IS 'Quantidade total de tokens consumidos na operação';
COMMENT ON COLUMN public.token_usage.cost_reais IS 'Valor em reais (R$) da execução/operação';

