-- Adicionar coluna metadata à tabela documents_geral para armazenar informações variadas (ex.: organização)
ALTER TABLE public.documents_geral
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.documents_geral.metadata IS 'Metadados arbitrários (ex: organizacao, tags extras, fonte)';

-- Índice GIN para consultas por chave/valor
CREATE INDEX IF NOT EXISTS idx_documents_geral_metadata_gin
ON public.documents_geral
USING GIN (metadata);
