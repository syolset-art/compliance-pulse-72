-- Tabell for integrasjonsforbindelser
CREATE TABLE integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily',
  sync_status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Utvid assets-tabellen
ALTER TABLE assets ADD COLUMN IF NOT EXISTS external_source_id TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS external_source_provider TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT false;

-- RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to integration_connections" ON integration_connections
  FOR ALL USING (true) WITH CHECK (true);