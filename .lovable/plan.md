## Mål

Når en partner legger til et regelverk for en kunde i MSP-portalen, skal det utløses en formell bekreftelsesflyt — ikke en stille "aktiver"-knapp. Dette gjenspeiler at:

1. Kunden må ha godkjent at regelverket tas i bruk.
2. Partneren står juridisk ansvarlig overfor Mynder (jf. partneravtalen).
3. Aktivering utløser fakturering.

## Terminologi

Bytte ut "Aktiver" som er for lettvint. Forslag (i prioritert rekkefølge):

- **"Bestill"** — tydelig at det er en handling med kommersielle konsekvenser, kjent fra B2B.
- **"Sett i drift"** — mer formelt, signaliserer forpliktelse.
- **"Legg til (krever bekreftelse)"** — mer beskrivende.

Anbefaling: **"Bestill"** på knappen, og **"Bekreft bestilling"** som tittel i dialogen. Etiketten "Aktivert hos kunden" beholdes som status (resultatet av en bestilling).

## Ny bekreftelsesdialog: `FrameworkOrderConfirmDialog`

Erstatter dagens direkte `handleActivate`. Når partner klikker **Bestill** på et regelverk:

### Innhold i dialogen

1. **Header** — Regelverkets navn, kategori-ikon, kort beskrivelse.
2. **Kunde-kontekst** — "Du er i ferd med å bestille [GDPR] for [Kundenavn]".
3. **Kommersiell varsling** (gul/warning-boks):
   - "Aktivering av regelverk utløser fakturering iht. partneravtalen."
   - Kort linje med estimert månedspris hvis tilgjengelig (kan være placeholder/TBD i første iterasjon).
4. **Kundens godkjenning — krav til dokumentasjon** (to alternativer, radio):
   - **A) Last opp bekreftelse fra kunde** — fildra-sone (PDF/bilde/e-post-eksport). Filnavn vises etter opplasting.
   - **B) Jeg bekrefter på vegne av kunden** — fritekstfelt (påkrevd): "Beskriv kort hvordan kunden har godkjent (møte, e-post, avtale)". Min. 20 tegn.
5. **Partneransvar-checkbox** (påkrevd):
   - "Jeg bekrefter at kunden har godkjent aktiveringen, at jeg er ansvarlig iht. partneravtalen, og at dette utløser fakturering."
6. **Knapper**:
   - **Avbryt** (ghost)
   - **Bestill regelverk** (primary, disabled til alle krav er oppfylt)

### Validering før knappen aktiveres

- Enten fil opplastet **eller** fritekstbekreftelse ≥ 20 tegn.
- Ansvars-checkbox huket av.

## Lagring (frontend-only, lokal demo)

Følger samme mønster som dagens `localStorage`-løsning (ingen backend-endring i denne iterasjonen, siden eksisterende flyt er localStorage-basert).

Nøkkel: `msp.customer.activatedFrameworks.${customerId}` utvides fra `string[]` til `Array<{ id, orderedAt, method: 'upload'|'declaration', evidenceName?: string, declarationText?: string, confirmedBy: string }>`.

Bakoverkompatibilitet: ved innlasting, oppgrader gammelt `string[]`-format til ny struktur (uten evidence — markert som "legacy").

Opplastet fil lagres som base64 i `localStorage` (lite volum, demo) — eller bare filnavn hvis vi vil holde det enkelt. Anbefaling: bare lagre filnavn + størrelse i demoen, og vise det som "vedlegg på fil" i etterkant. Reell fillagring kommer når vi flytter til backend.

## Endringer i `MSPCustomerRegulationsTab.tsx`

- Bytt knappetekst "Aktiver" → "Bestill" på inaktive rammeverk-kort.
- `handleActivate` → `handleRequestOrder(framework)` som åpner ny dialog i stedet for å oppdatere state direkte.
- Ny intern state: `pendingFramework: Framework | null`.
- Etter vellykket bekreftelse i dialogen: kall eksisterende save-logikk, vis suksess-toast med tekst tilpasset bestilling: "Bestilling registrert — [navn] er nå aktivt hos [kunde]".
- Vise et lite "Bestilt [dato] — Bekreftelse: [filnavn/erklæring]"-undertekst på aktive kort der vi har den info.

## Nye filer

- `src/components/msp/FrameworkOrderConfirmDialog.tsx` — dialogen beskrevet over.

## Endrede filer

- `src/components/msp/MSPCustomerRegulationsTab.tsx` — knappetekst, ny dialog-trigger, oppgradert datastruktur, visning av bestillingsmetadata på aktive kort.

## Ikke i scope nå (foreslås som oppfølging)

- Backend-tabell for `framework_orders` med faktisk filopplasting til storage.
- Faktureringskobling (kreditt-trekk eller fakturalinje).
- E-post til kunde med kopi av bekreftelsen.
- Revisjonslogg synlig for Mynder-admin.
