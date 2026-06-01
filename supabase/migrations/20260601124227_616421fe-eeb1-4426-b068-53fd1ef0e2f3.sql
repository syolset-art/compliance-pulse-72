CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  language text NOT NULL DEFAULT 'no',
  subject text NOT NULL,
  body text NOT NULL,
  cta_text text,
  cta_url text,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT SELECT ON public.email_templates TO anon;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read email templates" ON public.email_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert email templates" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update email templates" ON public.email_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete email templates" ON public.email_templates FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  recipient_name text,
  recipient_email text NOT NULL,
  subject text,
  language text NOT NULL DEFAULT 'no',
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  error text,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_sends TO authenticated;
GRANT ALL ON public.email_sends TO service_role;

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read email sends" ON public.email_sends FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert email sends" ON public.email_sends FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update email sends" ON public.email_sends FOR UPDATE TO authenticated USING (true);