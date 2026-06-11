
-- Spread maturity across ISO 27001 requirements so the framework score lands between yellow (~65%) and green (~80%).
-- Pattern (deterministic by row_number): roughly 20% at level 4, 55% at level 3, 25% at level 2.
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY requirement_id) AS rn,
         count(*) OVER () AS total
  FROM public.compliance_requirements
  WHERE framework_id = 'iso27001'
),
target AS (
  SELECT id,
         CASE
           WHEN rn % 5 = 0 THEN 4
           WHEN rn % 4 = 0 THEN 2
           ELSE 3
         END AS new_level
  FROM ordered
)
INSERT INTO public.requirement_status (requirement_id, status, progress_percent, maturity_level, is_ai_handling, evidence_notes)
SELECT t.id,
       CASE WHEN t.new_level >= 3 THEN 'completed' ELSE 'in_progress' END,
       CASE WHEN t.new_level >= 3 THEN 100 ELSE 60 END,
       t.new_level,
       false,
       'Demo seed — ISO 27001 maturity bump'
FROM target t
ON CONFLICT (requirement_id) DO UPDATE
SET maturity_level = EXCLUDED.maturity_level,
    status = EXCLUDED.status,
    progress_percent = EXCLUDED.progress_percent,
    evidence_notes = COALESCE(public.requirement_status.evidence_notes, EXCLUDED.evidence_notes);

-- Bump GDPR requirements: mix of level 3 and 4 so the framework lands solidly in green (~80%+) while still showing some yellow.
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY requirement_id) AS rn
  FROM public.compliance_requirements
  WHERE framework_id = 'gdpr'
),
target AS (
  SELECT id,
         CASE
           WHEN rn % 4 = 0 THEN 2
           WHEN rn % 3 = 0 THEN 4
           ELSE 3
         END AS new_level
  FROM ordered
)
INSERT INTO public.requirement_status (requirement_id, status, progress_percent, maturity_level, is_ai_handling, evidence_notes)
SELECT t.id,
       CASE WHEN t.new_level >= 3 THEN 'completed' ELSE 'in_progress' END,
       CASE WHEN t.new_level >= 3 THEN 100 ELSE 60 END,
       t.new_level,
       false,
       'Demo seed — GDPR maturity bump'
FROM target t
ON CONFLICT (requirement_id) DO UPDATE
SET maturity_level = EXCLUDED.maturity_level,
    status = EXCLUDED.status,
    progress_percent = EXCLUDED.progress_percent,
    evidence_notes = COALESCE(public.requirement_status.evidence_notes, EXCLUDED.evidence_notes);
