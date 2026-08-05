ALTER TABLE public.terms_versions
  ADD COLUMN IF NOT EXISTS doc_type text NOT NULL DEFAULT 'terms';

ALTER TABLE public.terms_versions
  DROP CONSTRAINT IF EXISTS terms_versions_version_key;

CREATE UNIQUE INDEX IF NOT EXISTS terms_versions_doc_type_version_key
  ON public.terms_versions (doc_type, version);

CREATE UNIQUE INDEX IF NOT EXISTS terms_versions_one_current_per_type
  ON public.terms_versions (doc_type) WHERE is_current;

INSERT INTO public.terms_versions (doc_type, version, effective_date, is_current, content_md)
VALUES
('privacy', '1.0', CURRENT_DATE, true, '# Personvernerklæring

_Denne erklæringen beskriver hvordan Mynder behandler personopplysninger i plattformen._

## Behandlingsansvarlig
Mynder AS er behandlingsansvarlig for personopplysninger om brukere av plattformen. For personopplysninger kunden selv legger inn i plattformen, er kunden behandlingsansvarlig og Mynder databehandler. Se databehandleravtalen.

## Hvilke opplysninger vi behandler
Kontaktopplysninger (navn, e-post, rolle og organisasjon), påloggings- og bruksdata (innlogginger, aktivitetslogg, IP-adresse), og innhold kunden laster opp eller registrerer i plattformen.

## Formål og grunnlag
Vi behandler opplysningene for å levere tjenesten, autentisere brukere, yte support, fakturere, og forbedre plattformens sikkerhet og funksjonalitet. Behandlingsgrunnlaget er avtalen med kunden og vår berettigede interesse i sikker og stabil drift.

## Lagring og sletting
Opplysningene lagres innenfor EU/EØS så lenge kundeforholdet varer. Ved avvikling av en modul eller av kundeforholdet kan data eksporteres eller overføres, og slettes deretter i tråd med avtalt frist.

## Underleverandører
Vi benytter underleverandører til drift, lagring og AI-funksjonalitet. Alle er bundet av databehandleravtale og behandler kun opplysninger etter instruks fra oss.

## AI-funksjonalitet
Innhold som sendes til AI-funksjoner i plattformen brukes til å produsere svar til deg. Innholdet brukes ikke til å trene generelle modeller.

## Dine rettigheter
Du kan be om innsyn, retting, sletting, begrensning og dataportabilitet, og protestere mot behandling. Du kan også klage til Datatilsynet.

## Kontakt
Henvendelser om personvern rettes til personvern@mynder.no.'),
('dpa', '1.0', CURRENT_DATE, true, '# Databehandleravtale

_Denne avtalen regulerer Mynders behandling av personopplysninger på vegne av kunden, jf. personvernforordningen artikkel 28._

## Partene og rollene
Kunden er behandlingsansvarlig. Mynder AS er databehandler og behandler personopplysninger kun etter dokumentert instruks fra kunden. Denne avtalen gjelder alle Mynder-produkter kunden har aktivert.

## Formål og varighet
Behandlingen skjer for å levere plattformens funksjonalitet for etterlevelse, leverandøroppfølging, systemoversikt, avvikshåndtering og behandlingsprotokoll. Avtalen gjelder så lenge kunden benytter tjenesten.

## Kategorier av registrerte og opplysninger
Ansatte, kontaktpersoner hos leverandører og andre personer kunden registrerer. Typisk navn, e-post, telefonnummer, rolle og innhold i dokumenter kunden laster opp.

## Sikkerhet
Mynder gjennomfører egnede tekniske og organisatoriske tiltak, herunder kryptering under overføring og lagring, tilgangsstyring med rollebasert kontroll, logging og jevnlig sikkerhetstesting.

## Underdatabehandlere
Kunden gir generell godkjenning til bruk av underdatabehandlere. Oversikt er tilgjengelig på forespørsel, og kunden varsles før nye tas i bruk.

## Overføring til tredjeland
Personopplysninger behandles innenfor EU/EØS. Eventuell overføring utenfor EØS skjer kun med gyldig overføringsgrunnlag.

## Bistand og avvik
Mynder bistår kunden med å svare på henvendelser fra registrerte og med sikkerhetsavvik. Avvik som berører kundens personopplysninger varsles uten ugrunnet opphold.

## Sletting og tilbakelevering
Ved opphør kan kunden eksportere sine data. Deretter slettes personopplysningene innen avtalt frist, med mindre lagring kreves etter lov.

## Revisjon
Kunden kan kreve dokumentasjon på etterlevelse av denne avtalen, normalt gjennom rapporter og attester Mynder gjør tilgjengelig.')
ON CONFLICT DO NOTHING;