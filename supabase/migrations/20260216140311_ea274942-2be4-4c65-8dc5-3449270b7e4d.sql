
ALTER TABLE system_incidents 
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_incident_id text,
  ADD COLUMN IF NOT EXISTS source_severity text,
  ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;
