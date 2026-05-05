
-- ============ user_roles ============
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- ============ user_dashboard_preferences ============
DROP POLICY IF EXISTS "Users can manage their dashboard preferences" ON public.user_dashboard_preferences;

CREATE POLICY "Users view own dashboard preferences"
  ON public.user_dashboard_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own dashboard preferences"
  ON public.user_dashboard_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own dashboard preferences"
  ON public.user_dashboard_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own dashboard preferences"
  ON public.user_dashboard_preferences FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ storage ============
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view vendor documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vendor documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vendor documents" ON storage.objects;

CREATE POLICY "Users read own vendor documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own vendor documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own vendor documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own vendor documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
