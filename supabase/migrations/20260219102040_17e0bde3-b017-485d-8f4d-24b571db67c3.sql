
-- Add new columns to mynder_me_shared_content
ALTER TABLE public.mynder_me_shared_content
  ADD COLUMN is_mandatory boolean NOT NULL DEFAULT false,
  ADD COLUMN is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN regulatory_basis text;

-- Update existing rows with mandatory/premium/regulatory info
UPDATE public.mynder_me_shared_content
SET is_mandatory = true, is_enabled = true, regulatory_basis = 'GDPR Art. 13-14'
WHERE content_type = 'processing_records';

UPDATE public.mynder_me_shared_content
SET is_mandatory = true, is_enabled = true, regulatory_basis = 'AI Act Art. 13-14'
WHERE content_type = 'ai_systems';

UPDATE public.mynder_me_shared_content
SET is_mandatory = true, is_enabled = true, regulatory_basis = 'GDPR Art. 13(1)(f)'
WHERE content_type = 'data_systems';

UPDATE public.mynder_me_shared_content
SET is_mandatory = true, is_enabled = true, regulatory_basis = 'GDPR Art. 13(1)(e)-(f)'
WHERE content_type = 'vendors';

UPDATE public.mynder_me_shared_content
SET is_mandatory = false, is_premium = true, regulatory_basis = 'GDPR Art. 34 (utvidet)'
WHERE content_type = 'incidents';

UPDATE public.mynder_me_shared_content
SET is_mandatory = false, is_premium = false, is_enabled = true
WHERE content_type = 'frameworks';
