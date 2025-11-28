-- Remove old confirmation_email_body column from agent_ia_config table
-- Now we only use confirmation_email_html

ALTER TABLE public.agent_ia_config
DROP COLUMN IF EXISTS confirmation_email_body;

