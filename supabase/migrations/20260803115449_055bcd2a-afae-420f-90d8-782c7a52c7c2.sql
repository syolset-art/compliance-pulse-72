CREATE TABLE public.terms_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content_md TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.terms_versions TO authenticated;
GRANT SELECT ON public.terms_versions TO anon;
GRANT ALL ON public.terms_versions TO service_role;

ALTER TABLE public.terms_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read terms versions"
  ON public.terms_versions FOR SELECT
  USING (true);

CREATE TRIGGER update_terms_versions_updated_at
  BEFORE UPDATE ON public.terms_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.terms_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  terms_version_id UUID NOT NULL REFERENCES public.terms_versions(id) ON DELETE CASCADE,
  context TEXT NOT NULL,
  context_ref TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_terms_acceptances_user ON public.terms_acceptances(user_id, accepted_at DESC);

GRANT SELECT, INSERT ON public.terms_acceptances TO authenticated;
GRANT ALL ON public.terms_acceptances TO service_role;

ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own acceptances"
  ON public.terms_acceptances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can record their own acceptances"
  ON public.terms_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

INSERT INTO public.terms_versions (version, effective_date, is_current, content_md) VALUES (
  '1.0',
  CURRENT_DATE,
  true,
  '# Vilkår og betingelser for Mynder

_Utkast – erstattes med endelig juridisk tekst._

## 1. Omfang
Disse vilkårene gjelder for alle Mynder-produkter og moduler, inkludert Mynder Core, leverandørmodulen, partnerløsninger og tilhørende tjenester. Ved å aktivere en modul eller kjøpe lisenser godtar du disse vilkårene i sin helhet.

## 2. Bruk av tjenesten
Kunden er ansvarlig for at bruken skjer i henhold til gjeldende lovgivning, og for at opplysninger som legges inn i plattformen er korrekte. Tilgang er personlig og skal ikke deles.

## 3. Abonnement og lisenser
Aktivering av moduler og kjøp av lisenser løper til de sies opp. Priser oppgis eksklusive merverdiavgift. Endringer i abonnementsnivå trer i kraft ved neste faktureringsperiode med mindre annet er avtalt.

## 4. Personvern og databehandling
Mynder behandler personopplysninger som databehandler på vegne av kunden. Behandlingen skjer innenfor EU/EØS og i henhold til personvernforordningen (GDPR). Egen databehandleravtale inngår som en del av disse vilkårene.

## 5. AI-genererte forslag
Plattformen benytter AI-agenter til å foreslå kartlegginger, vurderinger og dokumentasjon. Forslagene er beslutningsstøtte og erstatter ikke kundens egne faglige vurderinger. Kunden er ansvarlig for innholdet som godkjennes og publiseres.

## 6. Tilgjengelighet
Mynder tilstreber høy tilgjengelighet, men kan ikke garantere uavbrutt drift. Planlagt vedlikehold varsles i rimelig tid.

## 7. Ansvarsbegrensning
Mynders samlede ansvar er begrenset til vederlaget betalt de siste tolv månedene. Mynder er ikke ansvarlig for indirekte tap.

## 8. Endringer i vilkårene
Mynder kan oppdatere vilkårene. Ved vesentlige endringer publiseres en ny versjon, og brukeren må godta den nye versjonen ved neste aktivering eller kjøp.

## 9. Oppsigelse
Avtalen kan sies opp med én måneds skriftlig varsel. Kunden kan eksportere sine data ved opphør.

## 10. Lovvalg
Avtalen reguleres av norsk rett med Oslo tingrett som verneting.'
);