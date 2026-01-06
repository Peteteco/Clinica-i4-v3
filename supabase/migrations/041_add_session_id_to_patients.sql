-- Adicionar coluna session_id à tabela patients
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Comentário descritivo
COMMENT ON COLUMN public.patients.session_id IS 'ID da sessão/conversa associada ao paciente (vínculo com sistema de chat/WhatsApp)';

-- Índice simples para buscas por session_id
CREATE INDEX IF NOT EXISTS idx_patients_session_id
ON public.patients(session_id);

-- Índice composto para filtros por organização + session_id
CREATE INDEX IF NOT EXISTS idx_patients_org_session
ON public.patients(organization_id, session_id);

