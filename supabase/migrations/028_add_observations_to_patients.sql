-- Adicionar coluna observations à tabela patients
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Comentário descritivo
COMMENT ON COLUMN public.patients.observations IS 'Observações e anotações sobre o paciente';

