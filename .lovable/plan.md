## Mål
Fjerne de to store boksene («Meldinger fra kunder» og «Databehandleravtaler») fra Trust Center-dashbordet. Innholdet flyttes dit det hører hjemme:
- **Kundemeldinger** → knyttes til varslingsikonet (bell) i toppbaren
- **DPA-status** → bakes inn i «Neste handling» som anbefalte handlinger

## Endringer

### 1. Fjern widget-raden fra dashboard
`src/pages/TrustCenterDashboard.tsx`
- Fjern `<TrustCustomerRequestsWidget />` og `<CustomerDPAWidget />` inkl. `grid`-wrapperen (linje 85–88)
- Fjern tilhørende imports

### 2. Kundemeldinger → varslingsikon
`src/components/TopBar.tsx` (Bell-knappen, linje 111–121)
- Legg til en `useQuery` som teller åpne `customer_compliance_requests` (samme filter som widgeten: ikke `archived`/`responded`)
- Vis rød tellerbadge på bell-ikonet når `count > 0` (erstatter dagens demo-only prikk; behold pulse under demo)
- Tooltip oppdateres: «Meldinger (N)» / «Messages (N)»
- Klikk fortsetter å navigere til `/customer-requests` (uendret)
- Ingen dropdown/panel bygges nå — bare tellerbadge + navigasjon

### 3. DPA → anbefalte handlinger
`src/pages/TrustCenterDashboard.tsx`
- Legg til en `useQuery` som henter DPA-rader (`vendor_documents` where `document_type = 'dpa'`)
- Deriver opptil 2 syntetiske handlinger som legges inn i `actions`-listen før sortering:
  - Hvis ingen DPA finnes: én «critical»-handling «Last opp databehandleravtale» / «Upload Data Processing Agreement» → rute `/trust-center/edit?section=evidence`
  - For hver DPA som er utløpt eller utløper innen 60 dager: én «high»-handling «Forny DPA: {navn}» / «Renew DPA: {name}» → samme rute
- Handlingene får `category: "legal"` slik at eksisterende ikon/rute-mapping i `NextActionCards` virker; `_source: "dpa"`
- Ingen endringer i `NextActionCards.tsx` selv

## Ikke-endres
- `TrustCustomerRequestsWidget.tsx` og `CustomerDPAWidget.tsx` slettes ikke (kan brukes andre steder / i fremtidig varsler-panel)
- Ruter, oversettelser i andre sider, Supabase-skjema
- Øvrige dashbord-seksjoner (`TrustProfileHero`, `AggregatedMaturityWidget`, `NextActionCards`, `UpcomingTrustFeaturesCard`)

## Resultat
Dashbordet blir vesentlig mer luftig: hero → modenhet → én samlet «Neste handling»-liste (nå også med DPA-signaler) → kommende funksjoner. Kundemeldinger er ett klikk unna via bell-ikonet med telleren synlig.
