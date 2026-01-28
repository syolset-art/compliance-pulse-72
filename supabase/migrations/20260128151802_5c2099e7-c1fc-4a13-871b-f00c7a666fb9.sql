-- Create enum for performer roles
CREATE TYPE integration_performer_role AS ENUM (
  'it_provider',
  'accountant',
  'internal_it',
  'owner'
);

-- Create table for integration performers (guests who can set up integrations)
CREATE TABLE public.integration_performers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.company_profile(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role integration_performer_role NOT NULL,
  organization_name TEXT,
  invite_token TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  created_by TEXT
);

-- Create audit log table for integration actions
CREATE TABLE public.integration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  performer_id UUID REFERENCES public.integration_performers(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'api_key_added', 'synced', 'revoked', 'updated', 'invite_sent', 'invite_accepted')),
  performed_by_email TEXT,
  performed_by_name TEXT,
  performed_by_role integration_performer_role,
  performed_by_organization TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to integration_connections
ALTER TABLE public.integration_connections
ADD COLUMN setup_performer_id UUID REFERENCES public.integration_performers(id),
ADD COLUMN setup_completed_at TIMESTAMPTZ,
ADD COLUMN performer_role integration_performer_role;

-- Enable RLS on new tables
ALTER TABLE public.integration_performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_performers
CREATE POLICY "Allow all access to integration_performers"
ON public.integration_performers
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for integration_audit_log
CREATE POLICY "Allow all access to integration_audit_log"
ON public.integration_audit_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_integration_performers_invite_token ON public.integration_performers(invite_token);
CREATE INDEX idx_integration_performers_company_id ON public.integration_performers(company_id);
CREATE INDEX idx_integration_audit_log_integration_id ON public.integration_audit_log(integration_id);