-- Add OpenAI API Key to agent_ia_config table

ALTER TABLE public.agent_ia_config
ADD COLUMN openai_api_key TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN public.agent_ia_config.openai_api_key IS 'OpenAI API Key for AI features like email confirmation, chatbot, etc.';

-- Create index for performance (optional, but good practice)
CREATE INDEX idx_agent_ia_config_has_api_key ON public.agent_ia_config (organization_id) WHERE openai_api_key IS NOT NULL;

