ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS privacy_contact_address text;
UPDATE public.assets SET privacy_contact_address = 'Karl Johans gate 25, 0159 Oslo' WHERE name ILIKE 'Dintero%';