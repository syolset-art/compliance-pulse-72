-- =====================================================
-- FASE 1: Opprette nye tabeller for Asset Management
-- =====================================================

-- 1.1 Opprette assets-tabell med felles metadata for alle asset-typer
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL, -- system, vendor, location, network, integration, hardware, data, contract
  name TEXT NOT NULL,
  description TEXT,
  
  -- Eierskap
  work_area_id UUID REFERENCES public.work_areas(id) ON DELETE SET NULL,
  asset_owner TEXT,
  asset_manager TEXT,
  
  -- Risiko og kritikalitet
  risk_level TEXT DEFAULT 'medium',
  criticality TEXT DEFAULT 'medium', -- low, medium, high, critical
  risk_score INTEGER DEFAULT 0,
  
  -- Livssyklus
  lifecycle_status TEXT DEFAULT 'active', -- planned, active, deprecated, archived
  
  -- Compliance
  compliance_score INTEGER DEFAULT 0,
  
  -- Metadata spesifikk for asset-type
  vendor TEXT,
  category TEXT,
  url TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps og review
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Opprette relasjonstabell for asset-koblinger
CREATE TABLE public.asset_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  target_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- uses, hosts, connects_to, integrates_with, governed_by
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Hindre duplikate relasjoner
  UNIQUE(source_asset_id, target_asset_id, relationship_type)
);

-- 1.3 Opprette asset_type_templates for Trust Profile-maler
CREATE TABLE public.asset_type_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  display_name_plural TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  -- Konfigurerer hvilke tabs som vises i Trust Profile
  enabled_tabs TEXT[] DEFAULT ARRAY['validation', 'usage', 'dataHandling', 'riskManagement', 'incidents', 'relations'],
  -- Konfigurerer hvilke compliance-standarder som er relevante
  applicable_standards TEXT[] DEFAULT ARRAY['ISO 27001'],
  -- JSON-skjema for ekstra felter per asset-type
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- FASE 2: Aktivere RLS og opprette policies
-- =====================================================

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_type_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to assets" ON public.assets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to asset_relationships" ON public.asset_relationships
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to asset_type_templates" ON public.asset_type_templates
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- FASE 3: Opprette indekser for ytelse
-- =====================================================

CREATE INDEX idx_assets_asset_type ON public.assets(asset_type);
CREATE INDEX idx_assets_work_area_id ON public.assets(work_area_id);
CREATE INDEX idx_assets_lifecycle_status ON public.assets(lifecycle_status);
CREATE INDEX idx_asset_relationships_source ON public.asset_relationships(source_asset_id);
CREATE INDEX idx_asset_relationships_target ON public.asset_relationships(target_asset_id);

-- =====================================================
-- FASE 4: Opprette trigger for updated_at
-- =====================================================

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_type_templates_updated_at
  BEFORE UPDATE ON public.asset_type_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FASE 5: Migrere eksisterende systems-data til assets
-- =====================================================

INSERT INTO public.assets (
  id,
  asset_type,
  name,
  description,
  work_area_id,
  asset_manager,
  risk_level,
  risk_score,
  compliance_score,
  vendor,
  category,
  url,
  lifecycle_status,
  next_review_date,
  created_at,
  updated_at
)
SELECT 
  id,
  'system',
  name,
  description,
  work_area_id,
  system_manager,
  COALESCE(risk_level, 'medium'),
  COALESCE(risk_score, 0),
  COALESCE(compliance_score, 0),
  vendor,
  category,
  url,
  CASE 
    WHEN status = 'active' THEN 'active'
    WHEN status = 'inactive' THEN 'deprecated'
    ELSE 'active'
  END,
  next_review_date,
  created_at,
  updated_at
FROM public.systems;

-- =====================================================
-- FASE 6: Sette inn standard asset-type templates
-- =====================================================

INSERT INTO public.asset_type_templates (asset_type, display_name, display_name_plural, icon, color, enabled_tabs, applicable_standards, custom_fields) VALUES
  ('system', 'System', 'Systemer', 'Server', 'blue', 
   ARRAY['validation', 'usage', 'dataHandling', 'riskManagement', 'incidents', 'relations'],
   ARRAY['ISO 27001', 'GDPR', 'NIS2', 'AI Act'],
   '{"fields": ["vendor", "category", "url"]}'::jsonb),
  
  ('vendor', 'Leverandør', 'Leverandører', 'Building2', 'purple',
   ARRAY['validation', 'dataHandling', 'riskManagement', 'incidents', 'relations'],
   ARRAY['ISO 27001', 'GDPR', 'SOC 2'],
   '{"fields": ["contact_person", "contract_expiry", "country"]}'::jsonb),
  
  ('location', 'Lokasjon', 'Lokasjoner', 'MapPin', 'green',
   ARRAY['validation', 'riskManagement', 'incidents', 'relations'],
   ARRAY['ISO 27001', 'GDPR'],
   '{"fields": ["address", "country", "facility_type"]}'::jsonb),
  
  ('network', 'Nettverk', 'Nettverk', 'Network', 'orange',
   ARRAY['validation', 'usage', 'riskManagement', 'incidents', 'relations'],
   ARRAY['ISO 27001', 'NIS2'],
   '{"fields": ["network_type", "ip_range", "security_zone"]}'::jsonb),
  
  ('integration', 'Integrasjon', 'Integrasjoner', 'Plug', 'cyan',
   ARRAY['validation', 'dataHandling', 'riskManagement', 'relations'],
   ARRAY['ISO 27001', 'GDPR'],
   '{"fields": ["integration_type", "api_endpoint", "data_flow"]}'::jsonb),
  
  ('hardware', 'Maskinvare', 'Maskinvare', 'HardDrive', 'gray',
   ARRAY['validation', 'riskManagement', 'incidents', 'relations'],
   ARRAY['ISO 27001'],
   '{"fields": ["serial_number", "model", "purchase_date"]}'::jsonb),
  
  ('data', 'Data', 'Data', 'Database', 'red',
   ARRAY['validation', 'dataHandling', 'riskManagement', 'relations'],
   ARRAY['ISO 27001', 'GDPR', 'AI Act'],
   '{"fields": ["data_classification", "retention_period", "personal_data"]}'::jsonb),
  
  ('contract', 'Kontrakt', 'Kontrakter', 'FileText', 'yellow',
   ARRAY['validation', 'riskManagement', 'relations'],
   ARRAY['GDPR', 'AI Act'],
   '{"fields": ["contract_type", "start_date", "end_date", "value"]}'::jsonb);