
## Mål

Én rød tråd for partneren på kundeprofilen:
1. **Last opp dokument → få AI-forslag** på hvilke regelverk og krav det dekker (én knapp, samme flyt overalt).
2. **Fullfør leveranse → koble til regelverk → send rapport** som viser at gapet er redusert og modenheten økt.

## Del 1 — Universell "Last opp dokumentasjon"-flyt

Bygger på eksisterende `PartnerEvidenceUploadDialog` og `laraSuggestForDocType`, men gjør analysen automatisk og synlig.

**Ny komponent:** `UploadEvidenceWithAiSuggestions.tsx` (drop-in wrapper)
- Steg 1: dra-og-slipp fil + doc-type
- Steg 2: **Lara analyserer** (spinner 1–2 s) → viser forslag som en ryddig tabell:
  - Regelverk (chip) · Krav/artikkel · Konfidens (høy/middels/lav) · Checkbox
  - Alle forslag forhåndsvalgt; brukeren huker av det som ikke passer
- Steg 3: bekreftelse med berikelse per kontrollområde (+X %) og «Lagre bevis»

**Plassering (samme komponent, én knapp):**
- **Dokumentasjon-fanen** — primær «Last opp bevis»-knapp øverst (i dag går den til toast «kommer snart»)
- **Veiledning → Regelverk anbefalt** — allerede eksisterende «Last opp bevis» bruker samme komponent
- **Produkter/Moduler** — per aktivert regelverk-kort: «Legg til bevis»
- Per rad i dokumentasjons-checklisten (lovpålagte dokumenter): forhåndsvelg det spesifikke kravet

Alle steder havner bevis i samme `partnerEvidence`-store og oppdaterer `enrichmentByArea`.

## Del 2 — Fullfør leveranse og send kunderapport

I dag: `saveOffer` i `customerOffers.ts` lagrer bare tilbud. Ingen «levert»-status, ingen kobling til regelverk, ingen rapport.

**Utvidelse av `customerOffers.ts`:**
```ts
interface SavedOffer {
  ...eksisterende felt,
  status: 'draft' | 'sent' | 'delivered',
  deliveredAt?: string,
  frameworkIds: string[],        // regelverk tilbudet skal styrke
  evidenceIds: string[],         // bevis knyttet til leveransen
  maturityBefore?: Record<string, number>,
  maturityAfter?: Record<string, number>,
}
```
Nye funksjoner: `markOfferDelivered(id, { evidenceIds, frameworkIds })`, `getDeliveryImpact(offer)`.

**Ny fane på kundeprofilen: «Leveranser»** (mellom Produkter og Meldinger)
Enkelt kort per tilbud:
- Header: navn · status-pill (Utkast / Sendt / Levert) · kunde
- Regelverk-chips
- Bevis-teller: «3 av 5 bevis lastet opp»
- Én primærknapp avhengig av status:
  - `draft` → «Marker som sendt»
  - `sent` → **«Fullfør leveranse»** → åpner `CompleteDeliveryDialog`
  - `delivered` → «Se rapport» + «Send til kunde»

**Ny dialog: `CompleteDeliveryDialog.tsx`** (3 enkle steg)
1. **Velg regelverk** — checkboxes over kundens aktive regelverk (forhåndsvalgt fra tilbudets tjenester → controlIds → frameworks)
2. **Knytt bevis** — liste over partnerens opplastede bevis for kunden; velg de som er del av leveransen. Knapp «Last opp nytt» åpner Del 1-komponenten.
3. **Forhåndsvisning av effekt** — viser før/etter modenhet per kontrollområde (delta fra `enrichmentByArea` for valgte bevis), oppsummering av dekkede krav

Knapp «Fullfør og generer rapport» → status=`delivered`.

**Ny komponent: `DeliveryReport.tsx`** (kunderapport)
Kompakt PDF-lignende visning, kan sendes/lastes ned:
- Kundenavn, leveransenavn, dato
- **Regelverk dekket** (chips)
- **Modenhet før/etter** — én liten stolpe per kontrollområde, grønn delta
- **Krav dekket** — tabell: krav · bevis · dato
- **Vedlagt dokumentasjon** — liste med filnavn
- Signatur: partnernavn

Knapp «Send til kunde» → toast (mock e-post) + logg i offer.

**Kobling til Produkter/Moduler-fanen:**
På hvert aktivert regelverk-kort, en liten linje:
> «2 leveranser fullført · modenhet +18 %» → klikk → filtrert Leveranser-fane

## Tekniske detaljer

Filer å opprette:
- `src/components/msp/UploadEvidenceWithAiSuggestions.tsx`
- `src/components/msp/deliveries/CustomerDeliveriesTab.tsx`
- `src/components/msp/deliveries/CompleteDeliveryDialog.tsx`
- `src/components/msp/deliveries/DeliveryReport.tsx`
- `src/lib/deliveryImpact.ts` (beregner før/etter fra bevis)

Filer å endre:
- `src/lib/customerOffers.ts` — nye felt + status-funksjoner
- `src/components/msp/MSPCreateOfferDialog.tsx` — sett `status: 'draft'`, foreslå `frameworkIds` fra valgte tjenester
- `src/components/msp/CustomerDocumentationTab.tsx` — bytt «kommer snart»-toast med den nye opplastingskomponenten
- `src/components/msp/guidance/RegulationsStatusCard.tsx` — bruk samme komponent
- `src/components/msp/CustomerModulesTab.tsx` — link «Se leveranser» + «Legg til bevis» per regelverk
- `src/pages/MSPCustomerDetail.tsx` — ny «Leveranser»-fane

Alt lagres i localStorage (prototype), samme mønster som `partnerEvidence` og `customerOffers` i dag. Ingen DB-endringer nødvendig i dette steget.

## UX-prinsipp (én tydelig flyt)

> Last opp dokument → Lara foreslår krav → Godkjenn → Bevis lagret →
> Ved fullført leveranse: velg bevis → generer rapport → send til kunde.

Samme knapp, samme forslag-tabell, samme berikelses-visning overalt — brukeren trenger bare å lære det én gang.
