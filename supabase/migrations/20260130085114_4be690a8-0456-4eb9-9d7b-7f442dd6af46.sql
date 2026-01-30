-- Create integration_providers table for distinguishing between direct API and agent-based integrations
CREATE TABLE public.integration_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('direct_api', 'agent_partner')),
  partner_name TEXT,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'customer_id', 'oauth')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_providers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (these are reference data)
CREATE POLICY "Anyone can read integration providers"
ON public.integration_providers
FOR SELECT
USING (true);

-- Add new columns to integration_connections for partner integrations
ALTER TABLE public.integration_connections
ADD COLUMN IF NOT EXISTS partner_customer_id TEXT,
ADD COLUMN IF NOT EXISTS access_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.integration_providers(id);

-- Create trigger for updated_at on integration_providers
CREATE TRIGGER update_integration_providers_updated_at
BEFORE UPDATE ON public.integration_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial provider data for 7 Security / Acronis integration
INSERT INTO public.integration_providers (name, display_name, access_type, partner_name, auth_type, description)
VALUES 
  ('acronis', 'Acronis via 7 Security', 'agent_partner', '7 Security', 'customer_id', 'Import enheter fra Acronis Cyber Protect via 7 Security AI-agent'),
  ('azure-ad', 'Microsoft Entra ID', 'direct_api', NULL, 'api_key', 'Hent applikasjoner og enheter fra Azure AD'),
  ('sharepoint', 'SharePoint', 'direct_api', NULL, 'api_key', 'Importer fra SharePoint-lister og dokumentbibliotek'),
  ('intune', 'Microsoft Intune', 'direct_api', NULL, 'api_key', 'Importer administrerte enheter fra Intune'),
  ('servicenow', 'ServiceNow', 'direct_api', NULL, 'api_key', 'Synkroniser fra ServiceNow CMDB');