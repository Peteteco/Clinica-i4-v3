-- Recriar tabela documents_geral consolidando todas as colunas/índices/policies

-- Remover tabela anterior
DROP TABLE IF EXISTS public.documents_geral CASCADE;

-- Extensão para vetores
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela
CREATE TABLE public.documents_geral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  content TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.documents_geral IS 'Documentos gerais vinculados à organização';
COMMENT ON COLUMN public.documents_geral.url IS 'URL do arquivo armazenado (storage ou externo)';
COMMENT ON COLUMN public.documents_geral.metadata IS 'Metadados arbitrários (ex: organizacao, fonte, etc)';
COMMENT ON COLUMN public.documents_geral.embedding IS 'Embedding vetorial do documento para busca semântica';
COMMENT ON COLUMN public.documents_geral.content IS 'Conteúdo textual do documento ou chunk armazenado';

-- Índices
CREATE INDEX IF NOT EXISTS idx_documents_geral_org ON public.documents_geral (organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_geral_tags ON public.documents_geral USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_documents_geral_metadata_gin ON public.documents_geral USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_documents_geral_embedding_ivfflat
  ON public.documents_geral
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_documents_geral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_geral_updated_at
BEFORE UPDATE ON public.documents_geral
FOR EACH ROW
EXECUTE FUNCTION update_documents_geral_updated_at();

-- RLS e policies
ALTER TABLE public.documents_geral ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select documents of their organization"
ON public.documents_geral FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert documents of their organization"
ON public.documents_geral FOR INSERT
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update documents of their organization"
ON public.documents_geral FOR UPDATE
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete documents of their organization"
ON public.documents_geral FOR DELETE
USING (organization_id = get_user_organization_id());
