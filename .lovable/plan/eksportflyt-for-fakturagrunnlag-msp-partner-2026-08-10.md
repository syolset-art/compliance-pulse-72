# Eksportflyt for fakturagrunnlag (MSP-partner)

I dag gjør «Eksporter»-knappen på fakturagrunnlaget bare en toast. Planen er å gjøre den til en ekte, profesjonell eksport med partnerens egen merking.

## Flyten

1. Klikk «Eksporter» → liten dialog «Eksporter fakturagrunnlag».
2. Dialogen viser:
   - Forhåndsvisning av brevhodet: partnerens logo (om lagt inn), navn, org.nr, webadresse.
   - Periode (inneværende måned) og antall kunder/linjer som eksporteres.
   - Valg av format: PDF (standard) eller CSV.
   - Hvis logo mangler: subtil lenke «Legg til logo i innstillinger».
3. Klikk «Eksporter» → filen lastes ned, dialogen lukkes, toast bekrefter filnavnet.

## Slik ser PDF-en ut

- **Topp venstre:** partnerlogo (skalert til fast høyde, hopper over hvis den mangler), under: partnernavn, org.nr, domene.
- **Topp høyre:** tittel «Fakturagrunnlag», periode og eksportdato.
- **Tabell:** samme kolonner som skjermbildet — Kunde, Aktiverte produkter og regelverk, Fastpris og etablering, Abonnement/mnd, Mva (partnerens sats), Total inkl. mva — med totalrad.
- **Bunn (subtilt):** eksisterende Mynder-footer (liten logo + org.nr/mynder.io i lysegrått) på hver side, pluss én linje «Fakturagrunnlag generert i Mynder».

Partneren er avsender og dominerer visuelt; Mynder nevnes kun diskret i bunnteksten.

## Teknisk

- Ny fil `src/components/msp/generateInvoiceBasisPdf.ts`: jsPDF, gjenbruker `addMynderFooter` fra `src/lib/pdfBranding.ts` og tar imot rader + `PartnerBranding` + `PartnerTaxSettings`. Logo tegnes med `doc.addImage` fra `branding.logoUrl` (data-URL eller lastet til data-URL først), med try/catch-fallback til kun tekst.
- Ny fil `src/components/msp/ExportInvoiceBasisDialog.tsx`: dialogen med forhåndsvisning og formatvalg; CSV-grenen bygger samme kolonner som semikolonseparert fil.
- `src/pages/MSPInvoices.tsx`: bytt toast-onClick mot åpning av dialogen og send inn allerede beregnede rader, totaler og `branding`.
- Ingen backend-endringer; alt bruker eksisterende `usePartnerBranding` og `computeTaxBreakdown`.
