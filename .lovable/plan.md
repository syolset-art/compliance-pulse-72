# Plan: Trust Center Dashboard

Lage et eget, forenklet dashbord for selskaper som kun har Trust Center aktivert (uten Mynder Core / Systemer / Leverandører-moduler). Dagens `Index.tsx`/`DashboardV2.tsx` beholdes for Core-kunder.

## Hvordan vi identifiserer "Trust Center-only"

Bruke eksisterende signaler i `useSubscription()`:
- `hasCoreAccess === false` og `hasRegistriesAccess === false`
- og minst én publisert/aktiv Trust Profile (`assets.publish_mode in ('ecosystem','public')` eller en aktivert trust-tjeneste)

Legger en helper `useDashboardVariant()` som returnerer `"core" | "trust-only" | "partner"`. `Index.tsx` ruter:
- `partner` → `/msp-partner` (allerede slik)
- `trust-only` → render `<TrustCenterDashboard />`
- `core` → eksisterende dashbord (uendret)

## Ny side: `src/pages/TrustCenterDashboard.tsx`

Layout følger samme container/spacing som `DashboardV2` (Sidebar + `max-w-5xl`), Apple-minimal, deep purple primær.

### Soner (top → bunn)

1. **Header**
   - Hilsen + dato (gjenbruk `getGreeting` mønster)
   - Knapp "Åpne Trust Profile" (lenker til publisert profil) og "Rediger profil" (`/trust-center/edit`)

2. **Trust Profile-status (hero)**
   - Lite kort som speiler `ComplianceShield`, men scoper score til Trust Profile-modenhet
   - Viser: publisert URL (`trust.mynder.no/...`), siste oppdatering, antall visninger (hvis tilgjengelig — ellers utelat)
   - CTA: "Del profil" (kopier lenke)

3. **Samlet modenhet pr kontrollområde**
   - Gjenbruker `AggregatedMaturityWidget` (allerede dynamisk på `controlAreas.ts`)
   - Klikk på et område → `/trust-center/profile?area=...` for å svare på kontroller / laste opp bevis

4. **Aktiviteter / oppgaver**
   - Gjenbruker logikken fra `DashboardV2.mergedActions` men filtrerer til oppgaver relatert til Trust Center: åpne kontrollspørsmål, manglende bevis, dokumenter som utløper (`document_expiry_notifications`)
   - Sorter etter prioritet (0–3 jf. Activity-konvensjon)

5. **Meldinger fra kunder** (Customer Requests)
   - Ny widget `TrustCustomerRequestsWidget` som leser `customer_compliance_requests` (åpne + deadline < 14 dager)
   - Lenker til `/customer-requests` (eksisterer)
   - Tom-tilstand: "Ingen åpne forespørsler"

6. **Databehandleravtaler – kunder** (NY oversikt, lett versjon)
   - Tabell-widget `CustomerDPAWidget` som lister DPA-er kunder har bedt om / fått fra denne virksomheten
   - Datakilde: `vendor_documents` der `document_type = 'dpa'` filtrert på de som er delt via `trust_document_grants` (mottaker = kunde)
   - Kolonner: Kunde, Versjon, Gyldig fra, Utløper, Status
   - Lenke "Se alle" → ny rute `/trust-center/customer-dpas` (kun list-visning i denne iterasjonen — full forvaltning kommer senere)

7. **Coming soon-kort** (statisk, ikke-klikkbart, lav visuell vekt)
   - "Avvikshendelser fra dine leverandører" — kort tekst som forklarer at man får varsler på leverandører registrert i egen Trust Profile. Ingen funksjonalitet ennå.

### Hva som IKKE skal vises (vs. Core-dashbord)
- KPIRow (systemer/leverandører-tall)
- VendorInsightsWidget
- SecurityBreachWidget
- RiskAndCalendarSection
- NextActionCards bundet til Core-rammeverk utenfor Trust-scope

## Endringer i kodebasen

- **Ny fil:** `src/pages/TrustCenterDashboard.tsx`
- **Ny hook:** `src/hooks/useDashboardVariant.ts`
- **Nye widgets:**
  - `src/components/dashboard-trust/TrustProfileHero.tsx`
  - `src/components/dashboard-trust/TrustCustomerRequestsWidget.tsx`
  - `src/components/dashboard-trust/CustomerDPAWidget.tsx`
  - `src/components/dashboard-trust/UpcomingTrustFeaturesCard.tsx` (coming soon)
- **Endre:** `src/pages/Index.tsx` — bruk `useDashboardVariant` for å velge variant
- **Rute (valgfri):** legge til `/trust-center/customer-dpas` i `App.tsx` med en enkel list-side

Ingen DB-migrasjoner i denne iterasjonen — alt baseres på eksisterende tabeller (`assets`, `customer_compliance_requests`, `vendor_documents`, `trust_document_grants`, `document_expiry_notifications`).

## Lokalisering
Alle strenger via `i18next` (NO/EN). "Aktivitet" brukes for tasks; "Meldinger" for customer requests; "Leverandøransvarlig" der relevant.

## Spørsmål før implementasjon
1. Skal **byttet være automatisk** basert på abonnement, eller vil du ha en manuell toggle i Workspace-switcher slik at en Core-kunde også kan "kikke" i Trust-dashbordet?
2. For DPA-widget: skal vi i denne iterasjonen vise **alle DPA-er som virksomheten har lastet opp** (uavhengig av kunde), eller kun **DPA-er delt med en spesifikk kunde via `trust_document_grants`**? Det første er raskere å levere; det andre er nærmere sluttbildet.
3. Skal "Coming soon"-kortet for avvikshendelser fra leverandører **vises som standard**, eller skjules bak en superuser-flag inntil funksjonen finnes?
