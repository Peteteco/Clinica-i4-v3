-- Migration: Adicionar estágio "consulta_cancelado" ao Kanban
-- Descrição: Permite rastrear consultas canceladas no funil de vendas

-- Remove a constraint antiga
ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_kanban_status_check;

-- Adiciona nova constraint com o estágio adicional
ALTER TABLE public.patients
ADD CONSTRAINT patients_kanban_status_check CHECK (
  kanban_status IN (
    'novo_contato',
    'qualificado',
    'em_atendimento',
    'agendado',
    'aguardando_confirmacao',
    'concluido',
    'consulta_cancelado'
  )
);

-- Atualiza o comentário
COMMENT ON COLUMN public.patients.kanban_status IS 'Status do lead no funil de vendas do Kanban - Inclui: novo_contato, qualificado, em_atendimento, agendado, aguardando_confirmacao, concluido, consulta_cancelado';


