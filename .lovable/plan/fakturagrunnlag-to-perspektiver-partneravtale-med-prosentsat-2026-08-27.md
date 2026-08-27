# Fakturagrunnlag: to perspektiver + partneravtale med prosentsats

Mynder er ikke et faktureringssystem. Vi vet ikke om partneren faktisk har fakturert kunden sin. Det vi vet er hvilke produkter og regelverk som er aktivert per kunde, og hvordan dette endrer seg måned for måned. Fakturagrunnlaget skal derfor vise to ting side om side:

1. **Til dine kunder** — hva partneren kan fakturere sine kunder for aktiverte produkter (dagens tall).
2. **Fra Mynder til deg** — hva Mynder kommer til å fakturere partneren: abonnementssum minus partnerens andel etter satsen i partneravtalen (standard 30 %).

## Partneravtale (Innstillinger)

Ny seksjon «Partneravtale» på /msp-billing, over eller under fakturaopplysningene:

- Partnerandel i prosent (standard 30 %) — hvor stor del av abonnementsinntekten partneren beholder.
- Gjelder fra-dato og valgfritt avtalereferanse/notat.
- Kort forklaring: «Andelen brukes til å beregne hva Mynder fakturerer deg. Endringer avtales med Mynder.»
- Feltet lagres på partneren, ikke per kunde.

## Fakturagrunnlag (/msp-invoices)

**Toppsammendrag** får en ekstra visning: abonnement per mnd/år (til kundene), partnerandel i kroner, og «Mynder fakturerer deg» = abonnement − partnerandel. Andelen vises som «30 % partnerandel» med lenke til Partneravtale.

**Perspektivbytte** øverst i tabellen (segmentert kontroll):

- *Til dine kunder* — tabellen som i dag.
- *Fra Mynder* — samme kunderader, men kolonnene blir: Kunde, Aktivert, Abonnement, Din andel (30 %), Mynder fakturerer. Engangs-/fastprisleveranser partneren selv leverer er ikke med her, siden Mynder ikke fakturerer dem.

**Historikk** rammes tydelig inn som endringshistorikk: hva som ble aktivert/avsluttet per måned, ikke fakturastatus. Tekster som antyder utsendt faktura fjernes; forhåndsvisningen beholdes, men beskrives som «slik ser linjene ut for kunden».

Eksport får med begge perspektiver: kundelinjene og en oppsummering av Mynder-grunnlaget.

## Teknisk

- Migrasjon: legg til `partner_share_pct numeric default 30`, `agreement_start date`, `agreement_note text` på `public.msp_billing_settings` (eksisterende RLS/grants gjelder).
- `src/pages/MSPBillingSettings.tsx`: nytt «Partneravtale»-kort som leser/skriver feltene i samme lagre-flyt som resten av skjemaet.
- Ny hook-utvidelse i `src/hooks/useMSPInvoiceBasis.ts`: hent `partner_share_pct` og eksponer `partnerShare`, `mynderTotal` per rad og totalt (kun basert på `monthly`, ikke engangsbeløp).
- `src/pages/MSPInvoices.tsx`: perspektiv-state, ekstra kolonner i «Fra Mynder»-visning, oppdaterte topptall og tekster.
- `src/components/msp/ExportInvoiceBasisDialog.tsx`: legg partnerandel og Mynder-grunnlag til i PDF/CSV.
- `CustomerInvoiceHistorySheet.tsx` / `MSPInvoiceReports.tsx`: språkjustering til endringshistorikk.
