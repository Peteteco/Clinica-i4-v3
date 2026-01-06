-- Adicionar coluna content para armazenar o texto do documento/chunk
ALTER TABLE public.documents_geral
ADD COLUMN IF NOT EXISTS content TEXT;

COMMENT ON COLUMN public.documents_geral.content IS 'Conteúdo textual do documento ou chunk armazenado';
