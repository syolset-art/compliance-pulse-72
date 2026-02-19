
-- Configuration table for what content is shared with employees via Mynder Me
CREATE TABLE public.mynder_me_shared_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  display_title_no text NOT NULL,
  display_description_no text,
  filter_criteria jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mynder_me_shared_content ENABLE ROW LEVEL SECURITY;

-- Allow all access (matches existing pattern in this project)
CREATE POLICY "Allow all access to mynder_me_shared_content"
  ON public.mynder_me_shared_content
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed the 6 content categories
INSERT INTO public.mynder_me_shared_content (content_type, is_enabled, display_title_no, display_description_no) VALUES
  ('processing_records', false, 'Behandlingsprotokoller', 'Oversikt over hvordan virksomheten behandler dine personopplysninger, inkludert formål og rettslig grunnlag.'),
  ('ai_systems', false, 'AI-systemer', 'Informasjon om AI-systemer som brukes i virksomheten, inkludert risikovurdering og grad av menneskelig tilsyn.'),
  ('data_systems', false, 'Systemer og datalokasjoner', 'Oversikt over systemer som behandler ansattdata og hvor dataene lagres geografisk.'),
  ('vendors', false, 'Underleverandører', 'Informasjon om databehandlere og underleverandører som mottar personopplysninger, og om de er innenfor EU/EØS.'),
  ('incidents', false, 'Hendelser og avvik', 'Varsler om sikkerhetshendelser og avvik som kan påvirke deg som ansatt.'),
  ('frameworks', false, 'Sertifiseringer og rammeverk', 'Oversikt over aktive rammeverk og sertifiseringer virksomheten følger for personvern og sikkerhet.');

-- Trigger for updated_at
CREATE TRIGGER update_mynder_me_shared_content_updated_at
  BEFORE UPDATE ON public.mynder_me_shared_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
