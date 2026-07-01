
DROP POLICY IF EXISTS "Users upload own vendor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users read own vendor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users update own vendor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own vendor documents" ON storage.objects;

CREATE POLICY "Authenticated can upload vendor documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-documents');

CREATE POLICY "Authenticated can read vendor documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vendor-documents');

CREATE POLICY "Authenticated can update vendor documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vendor-documents');

CREATE POLICY "Authenticated can delete vendor documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vendor-documents');
