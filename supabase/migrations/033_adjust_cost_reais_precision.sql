-- Ajustar precisão da coluna cost_reais para suportar valores pequenos
-- Mudando de NUMERIC(10,2) para NUMERIC(15,8)
-- Permite valores como 0.00122, 0.000034, etc.

ALTER TABLE public.token_usage 
ALTER COLUMN cost_reais TYPE NUMERIC(15, 8);

COMMENT ON COLUMN public.token_usage.cost_reais IS 'Valor em reais (R$) da execução/operação - Suporta até 8 casas decimais (ex: 0.00122000)';

