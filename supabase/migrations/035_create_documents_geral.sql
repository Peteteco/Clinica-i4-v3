-- Criar tabela documents_geral para armazenar documentos gerais por organização
CREATE TABLE IF NOT EXISTS public.documents_geral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documents_geral_org ON public.documents_geral(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_geral_tags ON public.documents_geral USING GIN (tags);

-- Comentários
COMMENT ON TABLE public.documents_geral IS 'Documentos gerais vinculados à organização';
COMMENT ON COLUMN public.documents_geral.url IS 'URL do arquivo armazenado (storage ou externo)';

-- Trigger de updated_at
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

-- RLS
ALTER TABLE public.documents_geral ENABLE ROW LEVEL SECURITY;

-- Policies: CRUD restrito à organização do usuário
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
