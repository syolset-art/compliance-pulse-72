
-- Trust share links table
CREATE TABLE public.trust_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  personal_message TEXT,
  revoked_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trust_share_links_asset ON public.trust_share_links(asset_id);
CREATE INDEX idx_trust_share_links_token ON public.trust_share_links(token);
CREATE INDEX idx_trust_share_links_created_by ON public.trust_share_links(created_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trust_share_links TO authenticated;
GRANT ALL ON public.trust_share_links TO service_role;

ALTER TABLE public.trust_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own share links"
  ON public.trust_share_links FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Owners can create share links"
  ON public.trust_share_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their own share links"
  ON public.trust_share_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can delete their own share links"
  ON public.trust_share_links FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER update_trust_share_links_updated_at
  BEFORE UPDATE ON public.trust_share_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trust share link views (anonymized tracking)
CREATE TABLE public.trust_share_link_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.trust_share_links(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT
);

CREATE INDEX idx_trust_share_link_views_link ON public.trust_share_link_views(link_id);

GRANT SELECT ON public.trust_share_link_views TO authenticated;
GRANT ALL ON public.trust_share_link_views TO service_role;

ALTER TABLE public.trust_share_link_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view views for their own links"
  ON public.trust_share_link_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trust_share_links tsl
      WHERE tsl.id = trust_share_link_views.link_id
        AND tsl.created_by = auth.uid()
    )
  );
