
-- Document expiry notifications tracking
CREATE TABLE public.document_expiry_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  user_id uuid NOT NULL,
  notification_type text NOT NULL, -- '30_days', '7_days'
  sent_via text NOT NULL DEFAULT 'app', -- 'app', 'email'
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_expiry_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expiry notifications"
  ON public.document_expiry_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own expiry notifications"
  ON public.document_expiry_notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expiry notifications"
  ON public.document_expiry_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access to expiry notifications"
  ON public.document_expiry_notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Notification preferences per user
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL, -- 'document_expiry', 'vendor_request', etc.
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient expiry checks
CREATE INDEX idx_vendor_documents_valid_to ON public.vendor_documents (valid_to) WHERE valid_to IS NOT NULL;
CREATE INDEX idx_doc_expiry_notifications_document ON public.document_expiry_notifications (document_id, notification_type);
