-- Create company_profile table
CREATE TABLE public.company_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_number TEXT,
  industry TEXT NOT NULL,
  employees TEXT,
  maturity TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

-- Create policy for access
CREATE POLICY "Allow all access to company_profile" 
ON public.company_profile 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create work_area_templates table
CREATE TABLE public.work_area_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_area_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for access
CREATE POLICY "Allow all access to work_area_templates" 
ON public.work_area_templates 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert industry-specific templates
INSERT INTO public.work_area_templates (industry, name, description, icon, sort_order) VALUES
-- Energy
('Energi', 'Drift og vedlikehold', 'Daglig drift av energianlegg og infrastruktur', 'Wrench', 1),
('Energi', 'HMS og sikkerhet', 'Helse, miljø og sikkerhet i energisektoren', 'Shield', 2),
('Energi', 'Nettforvaltning', 'Forvaltning av strømnett og distribusjon', 'Network', 3),
('Energi', 'Kundeservice', 'Kundebehandling og fakturering', 'Users', 4),
-- Health
('Helse', 'Pasientbehandling', 'Klinisk behandling og oppfølging av pasienter', 'Heart', 1),
('Helse', 'Administrasjon', 'Administrativ drift og ledelse', 'Building', 2),
('Helse', 'Laboratorium', 'Laboratorietjenester og analyser', 'FlaskConical', 3),
('Helse', 'IT og digitalisering', 'Digitale helsetjenester og systemer', 'Monitor', 4),
-- Finance
('Finans', 'Regnskap', 'Finansiell rapportering og bokføring', 'Calculator', 1),
('Finans', 'Risikostyring', 'Identifisering og håndtering av finansiell risiko', 'AlertTriangle', 2),
('Finans', 'Compliance', 'Etterlevelse av regelverk og standarder', 'Scale', 3),
('Finans', 'Kundeservice', 'Kundebehandling og rådgivning', 'Users', 4),
-- Technology/SaaS
('Teknologi', 'Produktutvikling', 'Utvikling og vedlikehold av programvare', 'Code', 1),
('Teknologi', 'Kundesuksess', 'Onboarding og oppfølging av kunder', 'UserCheck', 2),
('Teknologi', 'Sikkerhet', 'Informasjonssikkerhet og personvern', 'Lock', 3),
('Teknologi', 'Salg og markedsføring', 'Kommersiell vekst og markedsføring', 'TrendingUp', 4),
-- Public sector
('Offentlig', 'Saksbehandling', 'Behandling av søknader og henvendelser', 'FileText', 1),
('Offentlig', 'IT-drift', 'Drift og vedlikehold av IT-systemer', 'Server', 2),
('Offentlig', 'HR og personal', 'Personalforvaltning og rekruttering', 'Users', 3),
('Offentlig', 'Økonomi', 'Budsjett og økonomistyring', 'Wallet', 4);

-- Create trigger for updated_at on company_profile
CREATE TRIGGER update_company_profile_updated_at
BEFORE UPDATE ON public.company_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();