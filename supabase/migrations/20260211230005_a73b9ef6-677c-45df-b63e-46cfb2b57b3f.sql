
-- Extend vendor_documents with version, validity, status, tracking
ALTER TABLE vendor_documents
  ADD COLUMN IF NOT EXISTS version text DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS valid_from date,
  ADD COLUMN IF NOT EXISTS valid_to date,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual_upload';

-- Document requests table
CREATE TABLE IF NOT EXISTS vendor_document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  requested_by text,
  due_date date NOT NULL,
  status text DEFAULT 'pending',
  reminder_count integer DEFAULT 0,
  last_reminder_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to vendor_document_requests"
  ON vendor_document_requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- Lara inbox table
CREATE TABLE IF NOT EXISTS lara_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_email text,
  sender_name text,
  subject text,
  received_at timestamptz DEFAULT now(),
  file_name text,
  file_path text,
  matched_asset_id uuid REFERENCES assets(id),
  matched_document_type text,
  confidence_score float,
  status text DEFAULT 'new',
  processed_at timestamptz,
  processed_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lara_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to lara_inbox"
  ON lara_inbox FOR ALL
  USING (true)
  WITH CHECK (true);
