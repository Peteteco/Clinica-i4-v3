-- Remover defaults indevidos em title e url
ALTER TABLE public.documents_geral
  ALTER COLUMN title DROP DEFAULT,
  ALTER COLUMN url DROP DEFAULT;

-- Opcional: reforçar NOT NULL já existente
ALTER TABLE public.documents_geral
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN url SET NOT NULL,
  ALTER COLUMN organization_id SET NOT NULL;
