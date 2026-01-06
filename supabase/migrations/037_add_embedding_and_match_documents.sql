-- Habilitar pgvector (caso ainda não esteja ativo)
CREATE EXTENSION IF NOT EXISTS vector;

-- Coluna de embedding para consultas semânticas
ALTER TABLE public.documents_geral
ADD COLUMN IF NOT EXISTS embedding vector(1536);

COMMENT ON COLUMN public.documents_geral.embedding IS 'Embedding vetorial do documento para busca semântica';

-- Índice IVFFlat com métrica de cosseno (recomendação pgvector)
-- Ajuste o número de lists conforme volume de dados (ex.: 100 para bases pequenas)
CREATE INDEX IF NOT EXISTS idx_documents_geral_embedding_ivfflat
ON public.documents_geral
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Função de similaridade para recuperar documentos por embedding
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  organization_slug text DEFAULT NULL,
  organization_uuid uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  url text,
  tags text[],
  metadata jsonb,
  similarity double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.description,
    d.url,
    d.tags,
    d.metadata,
    1 - (d.embedding <#> query_embedding) AS similarity
  FROM public.documents_geral d
  WHERE d.embedding IS NOT NULL
    AND (organization_slug IS NULL OR d.metadata->>'organizacao' = organization_slug)
    AND (organization_uuid IS NULL OR d.organization_id = organization_uuid)
  ORDER BY d.embedding <#> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.match_documents(vector, int, text, uuid) IS
'Retorna documentos mais similares por embedding (cosseno), com filtros opcionais por organização';
