
ALTER TABLE public.vendor_documents DROP CONSTRAINT IF EXISTS vendor_documents_evidence_status_check;

ALTER TABLE public.vendor_documents
  ADD COLUMN IF NOT EXISTS tier numeric(3,2),
  ADD COLUMN IF NOT EXISTS tier_source text,
  ADD COLUMN IF NOT EXISTS tier_signals jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS document_date date,
  ADD COLUMN IF NOT EXISTS attested_by text,
  ADD COLUMN IF NOT EXISTS attested_role text,
  ADD COLUMN IF NOT EXISTS attested_at timestamptz,
  ADD COLUMN IF NOT EXISTS placement text[] DEFAULT ARRAY[]::text[];

UPDATE public.vendor_documents SET evidence_status = 'uploaded' WHERE evidence_status = 'draft';
UPDATE public.vendor_documents SET evidence_status = 'confirmed' WHERE evidence_status = 'evidence';

ALTER TABLE public.vendor_documents
  ADD CONSTRAINT vendor_documents_evidence_status_check
  CHECK (evidence_status IN ('uploaded','classified','confirmed','attested','verified'));

UPDATE public.vendor_documents SET tier = 0.60, tier_source = 'legacy_confirmed'
  WHERE tier IS NULL AND evidence_status IN ('confirmed','attested','verified');
UPDATE public.vendor_documents SET tier = 0.30, tier_source = 'legacy_unverified'
  WHERE tier IS NULL;
