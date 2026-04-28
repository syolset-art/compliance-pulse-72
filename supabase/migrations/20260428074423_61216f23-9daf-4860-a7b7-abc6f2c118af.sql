
-- Mapping table: framework requirement -> control signal
CREATE TABLE IF NOT EXISTS public.framework_control_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id text NOT NULL,
  requirement_id text NOT NULL,
  signal_key text NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  evidence_doc_types text[] DEFAULT '{}',
  question text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (framework_id, requirement_id, signal_key)
);

ALTER TABLE public.framework_control_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read framework_control_mappings"
ON public.framework_control_mappings FOR SELECT TO public USING (true);

-- Stored gap analyses
CREATE TABLE IF NOT EXISTS public.vendor_gap_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  framework_id text NOT NULL,
  framework_name text,
  score integer NOT NULL DEFAULT 0,
  implemented_count integer NOT NULL DEFAULT 0,
  partial_count integer NOT NULL DEFAULT 0,
  missing_count integer NOT NULL DEFAULT 0,
  not_relevant_count integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_gap_analyses_asset_idx ON public.vendor_gap_analyses (asset_id, created_at DESC);

ALTER TABLE public.vendor_gap_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to vendor_gap_analyses"
ON public.vendor_gap_analyses FOR ALL TO public USING (true) WITH CHECK (true);

-- Seed mappings for Normen, NIS2, ISO 27001, GDPR
-- signal_key references control evaluation signals (vendor_*, generic, sub_processors_disclosed, etc.)
INSERT INTO public.framework_control_mappings (framework_id, requirement_id, signal_key, weight, evidence_doc_types, question) VALUES
-- Normen (helsesektoren)
('normen', 'normen-5.1', 'vendor_security_review', 2, ARRAY['security_review','iso27001'], 'Har leverandøren en gjennomført sikkerhetsledelse / ISMS?'),
('normen', 'normen-5.2', 'dpa_verified', 3, ARRAY['dpa'], 'Foreligger gyldig databehandleravtale (DPA) iht. Normen kap. 5?'),
('normen', 'normen-5.4', 'vendor_risk_assessment', 2, ARRAY['risk_assessment','soc2'], 'Er det utført oppdatert risikovurdering for leverandøren?'),
('normen', 'normen-5.7', 'vendor_followup', 2, ARRAY['audit_report'], 'Er det dokumentert oppfølging og revisjon av leverandøren?'),
('normen', 'normen-6.2', 'vendor_data_location', 2, ARRAY['dpa','data_processing'], 'Er datalokasjon dokumentert og innenfor EU/EØS?'),
('normen', 'normen-6.4', 'sub_processors_disclosed', 2, ARRAY['dpa','sub_processor_list'], 'Er underleverandører/sub-prosessorer fullstendig opplistet?'),
('normen', 'normen-7.1', 'vendor_data_retention', 2, ARRAY['dpa','retention_policy'], 'Er sletterutiner og oppbevaringstid spesifisert?'),
('normen', 'normen-7.3', 'vendor_gdpr_compliant', 3, ARRAY['gdpr_statement','dpa'], 'Bekrefter leverandøren GDPR-etterlevelse?'),
('normen', 'normen-8.1', 'vendor_privacy_policy', 1, ARRAY['privacy_policy'], 'Er personvernerklæring publisert og tilgjengelig?'),
('normen', 'normen-8.4', 'vendor_data_portability', 1, ARRAY['dpa'], 'Støttes dataportabilitet og uthenting ved opphør?'),

-- NIS2
('nis2', 'nis2-21-a', 'vendor_risk_assessment', 3, ARRAY['risk_assessment'], 'Er det utført risikoanalyse for tjenesten (NIS2 art. 21 a)?'),
('nis2', 'nis2-21-b', 'vendor_security_review', 2, ARRAY['iso27001','soc2'], 'Har leverandøren prosedyrer for hendelseshåndtering?'),
('nis2', 'nis2-21-c', 'vendor_data_retention', 1, ARRAY['continuity_plan'], 'Er kontinuitet og backup dokumentert?'),
('nis2', 'nis2-21-d', 'sub_processors_disclosed', 3, ARRAY['supply_chain_disclosure','dpa'], 'Er forsyningskjeden (sub-leverandører) sikret og dokumentert?'),
('nis2', 'nis2-21-e', 'vendor_security_review', 2, ARRAY['iso27001','pentest'], 'Sikkerhet i innkjøp, utvikling og vedlikehold?'),
('nis2', 'nis2-21-f', 'vendor_followup', 2, ARRAY['audit_report'], 'Effektivitetsmåling og oppfølging av sikkerhetstiltak?'),
('nis2', 'nis2-21-g', 'security_contact', 2, ARRAY['security_contact'], 'Finnes etablert sikkerhetskontakt og rapporteringskanal?'),
('nis2', 'nis2-21-h', 'vendor_data_location', 1, ARRAY['dpa'], 'Kryptografi og datalokasjon i bruk?'),

-- ISO 27001
('iso27001', 'iso27001-a5', 'vendor_security_review', 2, ARRAY['iso27001'], 'Sikkerhetspolicyer på plass (Annex A.5)?'),
('iso27001', 'iso27001-a8', 'vendor_data_location', 1, ARRAY['iso27001','soc2'], 'Asset management og datalokasjon (A.8)?'),
('iso27001', 'iso27001-a15', 'sub_processors_disclosed', 3, ARRAY['dpa','sub_processor_list'], 'Leverandørrelasjoner og kontroll over underleverandører (A.15)?'),
('iso27001', 'iso27001-a16', 'vendor_followup', 2, ARRAY['audit_report'], 'Hendelseshåndtering og oppfølging (A.16)?'),
('iso27001', 'iso27001-a18', 'vendor_gdpr_compliant', 2, ARRAY['gdpr_statement'], 'Etterlevelse av lover og regler (A.18)?'),

-- GDPR
('gdpr', 'gdpr-art-28', 'dpa_verified', 3, ARRAY['dpa'], 'Foreligger databehandleravtale iht. art. 28?'),
('gdpr', 'gdpr-art-30', 'vendor_data_retention', 2, ARRAY['dpa'], 'Er behandling dokumentert (art. 30)?'),
('gdpr', 'gdpr-art-32', 'vendor_security_review', 3, ARRAY['iso27001','soc2'], 'Er det innført passende sikkerhetstiltak (art. 32)?'),
('gdpr', 'gdpr-art-33', 'security_contact', 2, ARRAY['security_contact'], 'Er det rutine for varsling av brudd innen 72 timer (art. 33)?'),
('gdpr', 'gdpr-art-44', 'vendor_data_location', 3, ARRAY['dpa','transfer_assessment'], 'Er overføring utenfor EU/EØS lovlig sikret (art. 44–49)?'),
('gdpr', 'gdpr-art-28-4', 'sub_processors_disclosed', 2, ARRAY['sub_processor_list','dpa'], 'Er underleverandører godkjent og listet (art. 28.4)?'),
('gdpr', 'gdpr-art-13', 'vendor_privacy_policy', 1, ARRAY['privacy_policy'], 'Er informasjon til registrerte gitt (art. 13)?'),
('gdpr', 'gdpr-art-20', 'vendor_data_portability', 1, ARRAY['dpa'], 'Støttes dataportabilitet (art. 20)?')
ON CONFLICT DO NOTHING;
