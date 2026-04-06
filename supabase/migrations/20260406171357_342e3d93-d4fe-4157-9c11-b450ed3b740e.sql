
CREATE TABLE public.network_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by_user_id uuid NOT NULL,
  organization_name text NOT NULL,
  contact_person text,
  contact_email text NOT NULL,
  connection_type text NOT NULL DEFAULT 'customer',
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.network_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON public.network_connections FOR SELECT
  TO authenticated
  USING (invited_by_user_id = auth.uid());

CREATE POLICY "Users can insert own connections"
  ON public.network_connections FOR INSERT
  TO authenticated
  WITH CHECK (invited_by_user_id = auth.uid());

CREATE POLICY "Users can update own connections"
  ON public.network_connections FOR UPDATE
  TO authenticated
  USING (invited_by_user_id = auth.uid());

CREATE POLICY "Users can delete own connections"
  ON public.network_connections FOR DELETE
  TO authenticated
  USING (invited_by_user_id = auth.uid());

CREATE TRIGGER update_network_connections_updated_at
  BEFORE UPDATE ON public.network_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
