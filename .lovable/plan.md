## Endringer i Kundevisning (`/msp-customer-view`)

Oppdaterer de eksisterende visningene og legger til én ny fane, slik at de bedre reflekterer den faktiske kundeopplevelsen.

### 1. Ny fane: "Gi fullmakt" (Trust Profile + Lara-plan)

Ny tab "Gi fullmakt" i `MSPCustomerView.tsx`, plassert etter "Trust Profile (offentlig)".

Ny komponent: `src/components/msp/customer-view/GrantAuthorityView.tsx`
- Bruker `PreviewFrame` med browser-chrome.
- Øverst: et Lara-plan-banner (kort med Lara-ikon, lilla aksent, design som matcher andre Lara-bannere) med tittel "Gi din partner fullmakt" og forklaring: «Gi [Partnernavn] fullmakt til å utføre aktiviteter på din Trust Profile slik at modenheten øker raskere.» CTA-knapper: "Gi fullmakt" (primær) og "Les mer".
- Under banneret: en forenklet mock av kundens egen Trust Profile-side (header med DIPS Arena AS, modenhetsindikator, et par seksjoner som "Rammeverk", "Dokumenter", "Aktiviteter") — statisk, kun visuelt. Gjenbruker tokens og kortstil fra eksisterende Trust Profile-komponenter, men uten å koble til ekte data.
- Implementeringsnotat peker til: hvor Lara-banneret skal trigges (kundens Trust Profile når en MSP-partner er koblet på), komponent som skal lages (`<GrantPartnerAuthorityBanner partnerName=... />`), og at fullmakt lagres som en relasjon mellom partner og kunde-profil.

### 2. Forenkle "Tilbud (e-post)"

Erstatter dagens `EmailOfferView` innhold (som rendrer hele `CustomerCatalogPreview`) med en enkel e-postmock:
- Emne: "Vedlagt tilbud fra din partner Nordlys Sikkerhet AS"
- Avsender: partnerrådgiver
- Brødtekst: kort hilsen, "Vedlagt finner du tilbudet vi har satt sammen for DIPS Arena AS. Åpne PDF for detaljer. Svar `OK` på denne e-posten for å godkjenne tilbudet."
- Vedlegg-pille: `Tilbud-DIPS-Arena.pdf` med last-ned-ikon (statisk, åpner ikke noe reelt).
- Knapp/lenke: "Svar med OK for å godkjenne" (visuell).
- Implementeringsnotat oppdateres: trigger = partner klikker "Send tilbud", e-posten sendes som transaksjonell e-post med PDF-vedlegg, godkjenning skjer ved svar-e-post som parses og markerer tilbudet som godkjent.

### 3. "Trust Profile (offentlig)"

Ingen endringer — beholdes som i dag.

### 4. Omskriv "Overlevering (e-post)"

Endrer `HandoverEmailView` slik at innholdet handler om at partneren har opprettet en Trust Profile på vegne av kunden:
- Emne: "Din Trust Profile er klar – gi [Partner] fullmakt til å jobbe i profilen"
- Brødtekst: "Hei, [Partner] har opprettet en Trust Profile for DIPS Arena AS i Mynder. Logg inn for å se profilen og gi partneren fullmakt til å utføre aktiviteter, oppdatere dokumentasjon og øke modenheten på dine vegne."
- CTA-knapp: "Åpne Trust Profile og gi fullmakt" → lenker (visuelt) til kundens innloggede visning.
- Kort seksjon under: "Hva betyr fullmakt?" med 3 punktstreker (utføre aktiviteter, laste opp dokumenter, svare på henvendelser).
- Implementeringsnotat: trigger = partner fullfører aktiveringsveiviseren, kunden får e-post med engangs-innloggingslenke / magic link til sin Trust Profile-modul.

### Filer

Endres:
- `src/pages/MSPCustomerView.tsx` — legg til ny tab "Gi fullmakt"
- `src/components/msp/customer-view/EmailOfferView.tsx` — bytt fra `CustomerCatalogPreview` til enkel e-postmock med PDF-vedlegg
- `src/components/msp/customer-view/HandoverEmailView.tsx` — nytt innhold om fullmakt

Opprettes:
- `src/components/msp/customer-view/GrantAuthorityView.tsx`

Ingen endringer i ruter, sidebar, database eller edge functions. Kun frontend/presentasjon.
