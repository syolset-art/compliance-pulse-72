
-- MSP tables: remove anon read policies (authenticated user policies already exist)
DROP POLICY IF EXISTS "Anon can read msp_customers" ON public.msp_customers;
DROP POLICY IF EXISTS "Anon can read msp_invoices" ON public.msp_invoices;
DROP POLICY IF EXISTS "Anon can read msp_licenses" ON public.msp_licenses;
DROP POLICY IF EXISTS "Anon can read msp_license_purchases" ON public.msp_license_purchases;
DROP POLICY IF EXISTS "Anon can read msp_customer_assessments" ON public.msp_customer_assessments;

-- Vendor documents: remove anon access
DROP POLICY IF EXISTS "Anon users can view vendor documents" ON public.vendor_documents;
DROP POLICY IF EXISTS "Anon users can insert vendor documents" ON public.vendor_documents;

-- Integration connections: restrict to authenticated
DROP POLICY IF EXISTS "Allow all access to integration_connections" ON public.integration_connections;
CREATE POLICY "Authenticated can manage integration_connections"
  ON public.integration_connections FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Integration performers: restrict to authenticated
DROP POLICY IF EXISTS "Allow all access to integration_performers" ON public.integration_performers;
CREATE POLICY "Authenticated can manage integration_performers"
  ON public.integration_performers FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Email sends: scope reads to creator
DROP POLICY IF EXISTS "Authenticated can read email sends" ON public.email_sends;
CREATE POLICY "Users can read own email sends"
  ON public.email_sends FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);

-- Tighten SECURITY DEFINER function exposure: revoke from anon
REVOKE EXECUTE ON FUNCTION public.get_primary_role(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated, service_role;
