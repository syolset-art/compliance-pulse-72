-- AI System Registry - hovedtabell for KI-systemregister
CREATE TABLE public.ai_system_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifikasjon
  name TEXT NOT NULL,
  provider TEXT,
  version TEXT,
  
  -- Klassifisering
  risk_category TEXT DEFAULT 'not_assessed',
  risk_justification TEXT,
  annex_iii_category TEXT,
  
  -- Bruksområder (aggregert fra prosesser)
  use_cases JSONB DEFAULT '[]'::jsonb,
  affected_persons JSONB DEFAULT '[]'::jsonb,
  
  -- Tiltak
  transparency_measures TEXT,
  human_oversight_level TEXT,
  logging_enabled BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active',
  compliance_status TEXT DEFAULT 'not_assessed',
  last_assessment_date DATE,
  next_assessment_date DATE,
  
  -- Kobling
  linked_asset_ids UUID[] DEFAULT '{}',
  linked_process_count INTEGER DEFAULT 0,
  
  -- Kvantitative målinger (utvidet)
  usage_frequency TEXT,
  estimated_daily_uses INTEGER DEFAULT 0,
  estimated_affected_persons INTEGER DEFAULT 0,
  decisions_per_month INTEGER DEFAULT 0,
  automation_level TEXT DEFAULT 'advisory',
  override_rate_percent INTEGER DEFAULT 0,
  accuracy_percent INTEGER,
  last_performance_review DATE,
  performance_notes TEXT,
  incidents_count INTEGER DEFAULT 0,
  complaints_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Historisk sporing av AI-metrikker
CREATE TABLE public.ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_system_id UUID REFERENCES public.ai_system_registry(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Kvantitative målinger
  total_uses INTEGER DEFAULT 0,
  total_decisions INTEGER DEFAULT 0,
  automated_decisions INTEGER DEFAULT 0,
  overridden_decisions INTEGER DEFAULT 0,
  affected_persons_count INTEGER DEFAULT 0,
  
  -- Kvalitet
  accuracy_score DECIMAL(5,2),
  false_positive_count INTEGER DEFAULT 0,
  false_negative_count INTEGER DEFAULT 0,
  
  -- Hendelser i perioden
  incidents INTEGER DEFAULT 0,
  complaints INTEGER DEFAULT 0,
  corrections INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Utvid process_ai_usage med kvantitative felt og kobling til register
ALTER TABLE public.process_ai_usage 
ADD COLUMN IF NOT EXISTS ai_system_id UUID REFERENCES public.ai_system_registry(id),
ADD COLUMN IF NOT EXISTS usage_frequency TEXT,
ADD COLUMN IF NOT EXISTS estimated_monthly_decisions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_affected_persons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS override_rate TEXT;

-- Utvid system_incidents med AI-kobling
ALTER TABLE public.system_incidents 
ADD COLUMN IF NOT EXISTS ai_system_id UUID REFERENCES public.ai_system_registry(id),
ADD COLUMN IF NOT EXISTS is_ai_related BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.ai_system_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to ai_system_registry" ON public.ai_system_registry
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to ai_usage_metrics" ON public.ai_usage_metrics
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_ai_system_registry_updated_at
  BEFORE UPDATE ON public.ai_system_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();