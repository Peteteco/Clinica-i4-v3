-- Criar tabela de uso de tokens
CREATE TABLE IF NOT EXISTS public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tokens INTEGER NOT NULL DEFAULT 0,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Comentários
COMMENT ON TABLE public.token_usage IS 'Registro de uso de tokens por organização';
COMMENT ON COLUMN public.token_usage.organization_id IS 'ID da organização que consumiu os tokens';
COMMENT ON COLUMN public.token_usage.tokens IS 'Quantidade de tokens gastos na operação';
COMMENT ON COLUMN public.token_usage.type IS 'Tipo de uso: chat, email, summary, etc';
COMMENT ON COLUMN public.token_usage.created_at IS 'Data/hora do consumo';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_token_usage_organization 
ON public.token_usage(organization_id);

CREATE INDEX IF NOT EXISTS idx_token_usage_created_at 
ON public.token_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_usage_org_date 
ON public.token_usage(organization_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem tokens da própria organização
CREATE POLICY "Users can view their organization tokens"
ON public.token_usage
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Política: Super admins veem tudo
CREATE POLICY "Super admins can view all tokens"
ON public.token_usage
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_super_admin = true
  )
);

-- Política: Sistema pode inserir (para webhooks/APIs)
CREATE POLICY "System can insert tokens"
ON public.token_usage
FOR INSERT
TO authenticated
WITH CHECK (true);

