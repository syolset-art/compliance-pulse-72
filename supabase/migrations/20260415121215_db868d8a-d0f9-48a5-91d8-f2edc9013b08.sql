-- Add anon SELECT policy for evidence_checks (needed for demo seeding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'evidence_checks' AND policyname = 'Allow anon select evidence_checks'
  ) THEN
    CREATE POLICY "Allow anon select evidence_checks"
      ON public.evidence_checks
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Also add anon UPDATE policy for evidence_checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'evidence_checks' AND policyname = 'Allow anon update evidence_checks'
  ) THEN
    CREATE POLICY "Allow anon update evidence_checks"
      ON public.evidence_checks
      FOR UPDATE
      TO anon
      USING (true);
  END IF;
END $$;