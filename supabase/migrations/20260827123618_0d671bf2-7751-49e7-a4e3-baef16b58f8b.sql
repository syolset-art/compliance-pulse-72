CREATE TABLE public.partner_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_key text NOT NULL UNIQUE,
  partner_name text NOT NULL,
  partner_user_id uuid,
  share_pct numeric NOT NULL DEFAULT 30,
  valid_from date,
  valid_to date,
  agreement_url text,
  agent_verified boolean NOT NULL DEFAULT false,
  agent_verified_at timestamptz,
  agent_verified_by text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_agreements TO authenticated;
GRANT ALL ON public.partner_agreements TO service_role;
ALTER TABLE public.partner_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mynder admins manage partner agreements" ON public.partner_agreements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'daglig_leder'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'daglig_leder'));
CREATE TRIGGER update_partner_agreements_updated_at BEFORE UPDATE ON public.partner_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.partner_agreement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.partner_agreements(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'share_change',
  old_share_pct numeric,
  new_share_pct numeric,
  effective_from date,
  note text,
  changed_by uuid,
  changed_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_agreement_events TO authenticated;
GRANT ALL ON public.partner_agreement_events TO service_role;
ALTER TABLE public.partner_agreement_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mynder admins manage agreement events" ON public.partner_agreement_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'daglig_leder'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'daglig_leder'));

CREATE TABLE public.mynder_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  project_name text NOT NULL,
  partner_key text,
  agreement_ref text,
  start_date date,
  end_date date,
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  owner_name text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mynder_projects TO authenticated;
GRANT ALL ON public.mynder_projects TO service_role;
ALTER TABLE public.mynder_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mynder admins manage projects" ON public.mynder_projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'daglig_leder'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'daglig_leder'));
CREATE TRIGGER update_mynder_projects_updated_at BEFORE UPDATE ON public.mynder_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();