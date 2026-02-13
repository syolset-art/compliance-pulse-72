
-- Add new columns to vendor_documents
ALTER TABLE public.vendor_documents ADD COLUMN IF NOT EXISTS linked_regulations text[] DEFAULT '{}';
ALTER TABLE public.vendor_documents ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.vendor_documents ADD COLUMN IF NOT EXISTS category text;

-- Insert HULT IT as 'self' asset if not exists
INSERT INTO public.assets (name, asset_type, description, lifecycle_status, vendor, category)
SELECT 'HULT IT AS', 'self', 'Egen virksomhetsprofil – selverklæring for compliance og dokumenthåndtering', 'active', NULL, 'self'
WHERE NOT EXISTS (SELECT 1 FROM public.assets WHERE asset_type = 'self');

-- Seed demo vendor documents for HULT IT
INSERT INTO public.vendor_documents (asset_id, file_name, file_path, document_type, status, version, valid_from, valid_to, source, display_name, category, linked_regulations, received_at)
SELECT a.id, 'informasjonssikkerhetspolicy.pdf', 'self/informasjonssikkerhetspolicy.pdf', 'iso27001', 'current', 'v2.1', '2024-01-15'::date, '2025-12-31'::date, 'manual_upload', 'Informasjonssikkerhetspolicy', 'Security', ARRAY['ISO 27001', 'NIS2'], now()
FROM public.assets a WHERE a.asset_type = 'self';

INSERT INTO public.vendor_documents (asset_id, file_name, file_path, document_type, status, version, valid_from, valid_to, source, display_name, category, linked_regulations, received_at)
SELECT a.id, 'personvernerklaering.pdf', 'self/personvernerklaering.pdf', 'dpa', 'current', 'v1.3', '2024-03-01'::date, '2025-06-30'::date, 'manual_upload', 'Personvernerklæring', 'Privacy', ARRAY['GDPR', 'ISO 27701'], now()
FROM public.assets a WHERE a.asset_type = 'self';
