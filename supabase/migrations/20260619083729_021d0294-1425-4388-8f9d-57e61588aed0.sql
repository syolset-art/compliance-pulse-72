GRANT SELECT, INSERT, UPDATE, DELETE ON public.msp_customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msp_licenses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msp_license_purchases TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msp_invoices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msp_customer_assessments TO anon, authenticated;

GRANT ALL ON public.msp_customers TO service_role;
GRANT ALL ON public.msp_licenses TO service_role;
GRANT ALL ON public.msp_license_purchases TO service_role;
GRANT ALL ON public.msp_invoices TO service_role;
GRANT ALL ON public.msp_customer_assessments TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_customers' AND policyname = 'Demo can view msp_customers'
  ) THEN
    CREATE POLICY "Demo can view msp_customers"
    ON public.msp_customers
    FOR SELECT
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_customers' AND policyname = 'Demo can insert msp_customers'
  ) THEN
    CREATE POLICY "Demo can insert msp_customers"
    ON public.msp_customers
    FOR INSERT
    TO public
    WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_customers' AND policyname = 'Demo can update msp_customers'
  ) THEN
    CREATE POLICY "Demo can update msp_customers"
    ON public.msp_customers
    FOR UPDATE
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_customers' AND policyname = 'Demo can delete msp_customers'
  ) THEN
    CREATE POLICY "Demo can delete msp_customers"
    ON public.msp_customers
    FOR DELETE
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_license_purchases' AND policyname = 'Demo can view msp_license_purchases'
  ) THEN
    CREATE POLICY "Demo can view msp_license_purchases"
    ON public.msp_license_purchases
    FOR SELECT
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_license_purchases' AND policyname = 'Demo can insert msp_license_purchases'
  ) THEN
    CREATE POLICY "Demo can insert msp_license_purchases"
    ON public.msp_license_purchases
    FOR INSERT
    TO public
    WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_license_purchases' AND policyname = 'Demo can update msp_license_purchases'
  ) THEN
    CREATE POLICY "Demo can update msp_license_purchases"
    ON public.msp_license_purchases
    FOR UPDATE
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_license_purchases' AND policyname = 'Demo can delete msp_license_purchases'
  ) THEN
    CREATE POLICY "Demo can delete msp_license_purchases"
    ON public.msp_license_purchases
    FOR DELETE
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_licenses' AND policyname = 'Demo can view msp_licenses'
  ) THEN
    CREATE POLICY "Demo can view msp_licenses"
    ON public.msp_licenses
    FOR SELECT
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_licenses' AND policyname = 'Demo can insert msp_licenses'
  ) THEN
    CREATE POLICY "Demo can insert msp_licenses"
    ON public.msp_licenses
    FOR INSERT
    TO public
    WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_licenses' AND policyname = 'Demo can update msp_licenses'
  ) THEN
    CREATE POLICY "Demo can update msp_licenses"
    ON public.msp_licenses
    FOR UPDATE
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_licenses' AND policyname = 'Demo can delete msp_licenses'
  ) THEN
    CREATE POLICY "Demo can delete msp_licenses"
    ON public.msp_licenses
    FOR DELETE
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_invoices' AND policyname = 'Demo can view msp_invoices'
  ) THEN
    CREATE POLICY "Demo can view msp_invoices"
    ON public.msp_invoices
    FOR SELECT
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_invoices' AND policyname = 'Demo can insert msp_invoices'
  ) THEN
    CREATE POLICY "Demo can insert msp_invoices"
    ON public.msp_invoices
    FOR INSERT
    TO public
    WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_invoices' AND policyname = 'Demo can delete msp_invoices'
  ) THEN
    CREATE POLICY "Demo can delete msp_invoices"
    ON public.msp_invoices
    FOR DELETE
    TO public
    USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_customer_assessments' AND policyname = 'Demo can view msp_customer_assessments'
  ) THEN
    CREATE POLICY "Demo can view msp_customer_assessments"
    ON public.msp_customer_assessments
    FOR SELECT
    TO public
    USING (
      EXISTS (
        SELECT 1
        FROM public.msp_customers mc
        WHERE mc.id = msp_customer_assessments.msp_customer_id
          AND mc.msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_customer_assessments' AND policyname = 'Demo can insert msp_customer_assessments'
  ) THEN
    CREATE POLICY "Demo can insert msp_customer_assessments"
    ON public.msp_customer_assessments
    FOR INSERT
    TO public
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.msp_customers mc
        WHERE mc.id = msp_customer_assessments.msp_customer_id
          AND mc.msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'msp_customer_assessments' AND policyname = 'Demo can delete msp_customer_assessments'
  ) THEN
    CREATE POLICY "Demo can delete msp_customer_assessments"
    ON public.msp_customer_assessments
    FOR DELETE
    TO public
    USING (
      EXISTS (
        SELECT 1
        FROM public.msp_customers mc
        WHERE mc.id = msp_customer_assessments.msp_customer_id
          AND mc.msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid
      )
    );
  END IF;
END $$;