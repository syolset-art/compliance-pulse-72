-- Tabell for system-maler som kobles til arbeidsområde-typer
CREATE TABLE public.system_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_area_type TEXT NOT NULL, -- matcher work_area_templates.name
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  vendor TEXT,
  has_ai BOOLEAN DEFAULT false,
  ai_features TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;

-- Policy for read access
CREATE POLICY "Allow all access to system_templates" ON public.system_templates
  FOR ALL USING (true) WITH CHECK (true);

-- Insert standard systems for each work area type
INSERT INTO public.system_templates (work_area_type, name, description, category, has_ai, ai_features, sort_order) VALUES
-- Økonomi og regnskap
('Økonomi og regnskap', 'Regnskapssystem', 'System for føring, rapportering og årsregnskap', 'ERP', false, NULL, 1),
('Økonomi og regnskap', 'Fakturasystem', 'Elektronisk fakturering og betalingsoppfølging', 'Finance', false, NULL, 2),
('Økonomi og regnskap', 'Lønnssystem', 'Lønnsberegning, skattetrekk og utbetaling', 'Payroll', false, NULL, 3),

-- HR og personal
('HR og personal', 'HR-system', 'Personaladministrasjon, onboarding og fravær', 'HR', true, 'CV-screening, kandidatmatching', 1),
('HR og personal', 'Rekrutteringsportal', 'Stillingsutlysninger og søknadshåndtering', 'Recruitment', true, 'AI-basert kandidatvurdering', 2),
('HR og personal', 'Kompetansesystem', 'Opplæring og kompetanseutvikling', 'Learning', true, 'Personaliserte læringsforslag', 3),

-- IT og systemer
('IT og systemer', 'ServiceDesk', 'IT-brukerstøtte og tickethåndtering', 'ITSM', true, 'Automatisk kategorisering, chatbot', 1),
('IT og systemer', 'Overvåkningssystem', 'Infrastruktur og applikasjonsovervåkning', 'Monitoring', true, 'Anomalideteksjon', 2),
('IT og systemer', 'Dokumenthåndtering', 'Lagring og versjonskontroll av dokumenter', 'DMS', false, NULL, 3),

-- Ledelse og administrasjon
('Ledelse og administrasjon', 'Intranett', 'Intern kommunikasjon og samarbeid', 'Collaboration', false, NULL, 1),
('Ledelse og administrasjon', 'Sakshåndtering', 'Saksbehandling og arkivering', 'Case Management', false, NULL, 2),
('Ledelse og administrasjon', 'Styringssystem', 'Kvalitet, avvik og forbedringer', 'QMS', false, NULL, 3),

-- Salg og marked
('Salg og marked', 'CRM-system', 'Kundehåndtering og salgspipeline', 'CRM', true, 'Leadscoring, prediktiv analyse', 1),
('Salg og marked', 'Markedsføringsplattform', 'Kampanjer, e-post og automatisering', 'Marketing', true, 'Innholdsforslag, A/B-testing', 2),
('Salg og marked', 'Nettbutikk', 'E-handel og betalingsløsning', 'E-commerce', true, 'Produktanbefalinger', 3),

-- Kundeservice
('Kundeservice', 'Kundeservicesystem', 'Henvendelser, chat og telefoni', 'Customer Service', true, 'Chatbot, sentimentanalyse', 1),
('Kundeservice', 'Tilbakemeldingssystem', 'Undersøkelser og kundetilfredshet', 'Feedback', true, 'Automatisk kategorisering', 2),

-- Produksjon og logistikk
('Produksjon og logistikk', 'ERP-system', 'Ressursplanlegging og produksjonsstyring', 'ERP', false, NULL, 1),
('Produksjon og logistikk', 'Lagersystem', 'Lagerstyring og vareflyt', 'WMS', true, 'Behovsprediksjon', 2),
('Produksjon og logistikk', 'Transportsystem', 'Ruteplanlegging og sporing', 'TMS', true, 'Ruteoptimalisering', 3),

-- Helse og sikkerhet
('Helse og sikkerhet', 'HMS-system', 'Risikovurdering og avvikshåndtering', 'HSE', false, NULL, 1),
('Helse og sikkerhet', 'Sikkerhetssystem', 'Adgangskontroll og overvåkning', 'Security', true, 'Anomalideteksjon', 2),

-- Forskning og utvikling
('Forskning og utvikling', 'Prosjektstyring', 'Prosjektplanlegging og ressursallokering', 'Project Management', false, NULL, 1),
('Forskning og utvikling', 'Laboratoriesystem', 'Prøvehåndtering og resultater', 'LIMS', true, 'Dataanalyse', 2),

-- Juridisk
('Juridisk', 'Kontraktssystem', 'Kontraktslivssyklus og arkiv', 'CLM', true, 'Kontraktsanalyse, risikoidentifikasjon', 1),
('Juridisk', 'Personvernsystem', 'GDPR-samsvar og databehandling', 'Privacy', false, NULL, 2);

-- Index for raskere oppslag
CREATE INDEX idx_system_templates_work_area_type ON public.system_templates(work_area_type);