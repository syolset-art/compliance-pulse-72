
-- Add anonymous SELECT policies for MSP tables
CREATE POLICY "Anon can read msp_customers"
  ON public.msp_customers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read msp_licenses"
  ON public.msp_licenses FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read msp_license_purchases"
  ON public.msp_license_purchases FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read msp_invoices"
  ON public.msp_invoices FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read msp_customer_assessments"
  ON public.msp_customer_assessments FOR SELECT
  TO anon
  USING (true);

-- Allow demo user (anon) to INSERT/UPDATE/DELETE for seeding
CREATE POLICY "Anon demo insert msp_customers"
  ON public.msp_customers FOR INSERT
  TO anon
  WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo delete msp_customers"
  ON public.msp_customers FOR DELETE
  TO anon
  USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo insert msp_licenses"
  ON public.msp_licenses FOR INSERT
  TO anon
  WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo update msp_licenses"
  ON public.msp_licenses FOR UPDATE
  TO anon
  USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo delete msp_licenses"
  ON public.msp_licenses FOR DELETE
  TO anon
  USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo insert msp_license_purchases"
  ON public.msp_license_purchases FOR INSERT
  TO anon
  WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo delete msp_license_purchases"
  ON public.msp_license_purchases FOR DELETE
  TO anon
  USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo insert msp_invoices"
  ON public.msp_invoices FOR INSERT
  TO anon
  WITH CHECK (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo delete msp_invoices"
  ON public.msp_invoices FOR DELETE
  TO anon
  USING (msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Anon demo insert msp_customer_assessments"
  ON public.msp_customer_assessments FOR INSERT
  TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM msp_customers mc
    WHERE mc.id = msp_customer_assessments.msp_customer_id
      AND mc.msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ));

CREATE POLICY "Anon demo delete msp_customer_assessments"
  ON public.msp_customer_assessments FOR DELETE
  TO anon
  USING (EXISTS (
    SELECT 1 FROM msp_customers mc
    WHERE mc.id = msp_customer_assessments.msp_customer_id
      AND mc.msp_user_id = '00000000-0000-0000-0000-000000000000'::uuid
  ));
