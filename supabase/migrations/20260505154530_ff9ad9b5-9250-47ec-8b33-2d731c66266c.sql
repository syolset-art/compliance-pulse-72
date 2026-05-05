ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS privacy_policy_url text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS incident_report_url text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS security_contact_phone text;
UPDATE public.assets SET 
  privacy_policy_url = 'https://www.dintero.com/privacy',
  incident_report_url = 'https://www.dintero.com/security/report',
  security_contact_phone = '+47 22 00 00 00'
WHERE name ILIKE 'Dintero%';