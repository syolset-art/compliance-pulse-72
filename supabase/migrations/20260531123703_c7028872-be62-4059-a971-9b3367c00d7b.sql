-- Remove 'private' as a publish_mode option: migrate existing rows and update constraints
UPDATE public.assets SET publish_mode = 'ecosystem' WHERE publish_mode = 'private';

ALTER TABLE public.assets ALTER COLUMN publish_mode SET DEFAULT 'ecosystem';

-- Update validation trigger to only allow ecosystem and public
CREATE OR REPLACE FUNCTION public.validate_assets_publish_mode()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.publish_mode IS NOT NULL AND NEW.publish_mode NOT IN ('ecosystem','public') THEN
    RAISE EXCEPTION 'Invalid publish_mode: %. Allowed: ecosystem, public', NEW.publish_mode;
  END IF;
  RETURN NEW;
END;
$$;