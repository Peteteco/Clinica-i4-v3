-- Migration: Adicionar duração padrão de consulta nos horários de trabalho
-- Descrição: Define o tempo padrão de cada consulta (em minutos) para facilitar o agendamento

ALTER TABLE public.work_schedules
ADD COLUMN IF NOT EXISTS consultation_duration INTEGER DEFAULT 30;

COMMENT ON COLUMN public.work_schedules.consultation_duration IS 'Duração padrão de cada consulta em minutos (ex: 30, 45, 60)';

-- Adicionar constraint para garantir valores razoáveis (entre 15 e 240 minutos - 4 horas)
ALTER TABLE public.work_schedules
ADD CONSTRAINT work_schedules_consultation_duration_check 
CHECK (consultation_duration >= 15 AND consultation_duration <= 240);

