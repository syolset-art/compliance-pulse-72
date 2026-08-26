# Faktureringsrapporter som egen underside

## Mål
Flytte analysedelen (Topp 3 produkter og Fordeling bransje) ut av Fakturagrunnlag og over til en egen rapportside der partneren kan hente ut rapporter knyttet til fakturering av kunder.

## Vurdering: egen side eller underside?
Anbefaling: **underside av Fakturagrunnlag**, på ruten `/msp-invoices/reports`. Grunnen er at innholdet bygger på samme datagrunnlag (aktiverte produkter, abonnement, kunder) og hører faglig sammen med fakturagrunnlaget. Den får derfor ikke eget punkt i hovedmenyen, men nås via en «Rapporter»-knapp øverst på Fakturagrunnlag, med tilbakelenke motsatt vei (samme mønster som Innstillinger-siden bruker i dag).

## Hva den nye siden inneholder
- Tittel «Faktureringsrapporter», undertittel som presiserer at alle tall er eks. mva.
- Nøkkeltall: kunder med abonnement og abonnementssum (måned/år-veksler) — beholdes øverst som kontekst for rapportene.
- Topp 3 produkter (flyttes hit).
- Fordeling bransje, topp 5 (flyttes hit).
- Eksport: samme eksportdialog for fakturagrunnlag som i dag, plassert som primærhandling på rapportsiden.
- Liste over kunder med snarvei til «Fakturahistorikk» (eksisterende sidepanel), slik at rapportuttak per kunde skjer her.

## Hva som endres på Fakturagrunnlag
- De to analysekortene fjernes; nøkkeltallkortene (kunder, abonnementssum) blir stående.
- Ny knapp «Rapporter» ved siden av Eksporter/Innstillinger.
- Tabellen med aktiverte produkter per kunde blir uendret.

## Teknisk
- Ny fil `src/pages/MSPInvoiceReports.tsx`, rute lagt til i `src/App.tsx` under `/msp-invoices/reports`.
- Beregningslogikken for rader, abonnementssum, produkt- og bransjetelling flyttes til en delt hook, f.eks. `src/hooks/useMSPInvoiceBasis.ts`, som både `MSPInvoices.tsx` og den nye siden bruker. Ingen duplisering av datauttrekk.
- Gjenbruker `ExportInvoiceBasisDialog` og `CustomerInvoiceHistorySheet` uendret.
- Ingen databaseendringer.
