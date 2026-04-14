

## Plan: Koble regelverk-seksjonen på abonnementssiden til onboarding-data og regelverk-velger

### Problemet i dag
Steg 2 på abonnementssiden viser en statisk liste med betalte regelverk-tillegg (NIS2, DORA, etc.) uten kontekst om hva som er obligatorisk, anbefalt eller valgfritt for akkurat denne virksomheten. Ingen kobling til `selected_frameworks`-tabellen der vi allerede vet hvilke regelverk som gjelder.

### Ny design for Steg 2: «Regelverk»

Seksjonen deles i tre grupper basert på onboarding-data:

```text
┌─────────────────────────────────────────────────┐
│ 2  Dine regelverk                               │
│                                                 │
│ ── Obligatoriske (inkludert) ──────────────────  │
│ ✅ GDPR          ✅ Personopplysningsloven       │
│ ✅ Internkontroll ✅ Arbeidsmiljøloven           │
│ ✅ HMS            ✅ Bokføringsloven             │
│    (grønne, ikke deaktiverbare)                 │
│                                                 │
│ ── Anbefalt for din virksomhet ────────────────  │
│ 🔵 ISO 27001   Inkludert  ✅ Aktiv              │
│ 🔵 NIS2        500 kr/mnd  [Aktiver]            │
│ 🔵 DORA        500 kr/mnd  ✅ Aktiv             │
│    (basert på bransje/størrelse/gap-analyse)     │
│                                                 │
│ ── Valgfrie tillegg ──────────────────────────── │
│ ○ EU AI Act    500 kr/mnd  [Legg til]           │
│ ○ CRA          500 kr/mnd  [Legg til]           │
│ ○ Åpenhetsloven 500 kr/mnd [Legg til]           │
│                                                 │
│ [⚙️ Administrer alle regelverk]                  │
│    → Åpner EditActiveFrameworksDialog            │
└─────────────────────────────────────────────────┘
```

### Tekniske endringer

**1. `src/pages/Subscriptions.tsx`**
- Hent `selected_frameworks` fra databasen (samme query som Regulations-siden)
- Hent `company_profile` for bransje/størrelse-data (allerede tilgjengelig via `useSubscription`)
- Del regelverk-listen i tre grupper:
  - **Obligatoriske**: `framework.isMandatory === true` — alltid inkludert, vist som grønne chips
  - **Anbefalte**: Rammeverk som er `is_recommended` eller allerede valgt i onboarding/gap-analyse — vis med switch og pris
  - **Valgfrie**: Resterende betalte tillegg — vis som cards med «Legg til»-knapp
- Vis aktiv-status fra `selected_frameworks`-tabellen (synkronisert med regelverk-siden)
- Legg til «Administrer alle regelverk»-knapp som åpner `EditActiveFrameworksDialog`
- Integrer `FrameworkActivationDialog` for bekreftelse ved aktivering
- Vis antall aktive vs totalt i seksjonens header-badge

**2. Kobling til `domain_addons`**
- Når bruker aktiverer et betalt regelverk fra abonnementssiden, skriv til både `selected_frameworks` (for compliance-tracking) og `domain_addons` (for fakturering)
- Vis pris kun for ikke-gratis rammeverk (bruk `FRAMEWORK_ADDONS` og `FREE_FRAMEWORKS`)

**3. Interaktivitet**
- Switch-toggles for anbefalte regelverk med inline-pris
- Accordion/expandable info med trigger-spørsmål fra `frameworkDefinitions` (f.eks. «Er virksomheten innen kritisk infrastruktur?»)
- Badge som viser «Anbefalt basert på din bransje» for relevante rammeverk
- Oppsummeringsseksjonen oppdateres automatisk med regelverk-kostnader

### Ingen databaseendringer
Alt bruker eksisterende tabeller: `selected_frameworks`, `domain_addons`, `company_profile`.

### Resultat
Abonnementssiden blir kontekstuell og personalisert — brukeren ser hva som er obligatorisk, hva som anbefales basert på gap-analysen, og kan aktivere tillegg direkte med priser synlige inline. Alt synkronisert med regelverk-siden.

