-- Migrate publish_mode values to new visibility model
UPDATE public.assets SET publish_mode = 'public' WHERE publish_mode = 'all';
UPDATE public.assets SET publish_mode = 'ecosystem' WHERE publish_mode IS NULL;

ALTER TABLE public.assets ALTER COLUMN publish_mode SET DEFAULT 'ecosystem';

-- Validation trigger (per project memory: use triggers, not CHECK constraints)
CREATE OR REPLACE FUNCTION public.validate_assets_publish_mode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.publish_mode IS NOT NULL AND NEW.publish_mode NOT IN ('private','ecosystem','public') THEN
    RAISE EXCEPTION 'Invalid publish_mode: %. Allowed: private, ecosystem, public', NEW.publish_mode;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_assets_publish_mode_trigger ON public.assets;
CREATE TRIGGER validate_assets_publish_mode_trigger
BEFORE INSERT OR UPDATE OF publish_mode ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.validate_assets_publish_mode();