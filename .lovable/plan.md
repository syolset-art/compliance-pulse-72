## Mål

I prototypen skal sidebar ha **to dashbord-menypunkter** øverst, slik at det blir tydelig at Mynder har to "innganger":

1. **Trust Center** – alltid synlig, alltid startpunktet på `/`
2. **Mynder Core** – kun synlig når brukeren har aktivert Core (arbeidsområder, systemer, avvik) eller et register (vendors, assets, agenter)

Dette gjør forskjellen mellom "kun Trust Center-kunder" og "Core-kunder" intuitiv: Trust Center er fundamentet, Core er en utvidelse som dukker opp som et eget dashbord når den er på.

## Endringer

### 1. Ruter (`src/App.tsx`)
- `/` rendrer fortsatt `Index`, men `Index` viser nå **alltid** `TrustCenterDashboard` (uavhengig av plan).
- Ny rute `/dashboard-core` → ny side-komponent `CoreDashboard` som inneholder dagens Core-dashbord-innhold (det som ligger i `DashboardV2` / `Index`-grenen i dag).
- `/dashboard-v2` beholdes som alias for bakoverkompatibilitet i prototypen.

### 2. `src/pages/Index.tsx`
- Fjern `useDashboardVariant`-grenen som velger mellom Trust- og Core-dashboard.
- `/` returnerer alltid `<TrustCenterDashboard />` (partner-modus beholder sin redirect til `/msp-partner`).
- Flytt eksisterende Core-dashbord JSX (`DashboardLaraRecommendation`, `DashboardOverallMaturity`, `DashboardMaturityOverTime`, `DashboardFrameworkStatus`, hilsen, dialoger, help panel) til ny `src/pages/CoreDashboard.tsx`.

### 3. Sidebar (`src/components/Sidebar.tsx`)
Erstatt dagens enkle `dashboardNav` med to oppføringer øverst, gruppert visuelt som "Dashboards":

```text
🛡  Trust Center-dashbord       →  /
⚙️  Mynder Core-dashbord        →  /dashboard-core    [kun hvis hasCoreOrRegistries]
🏛  Styrerom                    →  /board
```

- "Trust Center-dashbord" alltid synlig.
- "Mynder Core-dashbord" rendres betinget basert på `useSubscription().hasCoreAccess || hasRegistriesAccess` (samme signal som dagens `useDashboardVariant`).
- Aktiv-styling som dagens dashboard-link.
- i18n-nøkler: `nav.trustDashboard` ("Trust Center" / "Trust Center"), `nav.coreDashboard` ("Mynder Core" / "Mynder Core"). Legges til i `src/lib/i18n.ts`.

### 4. Liten visuell hint (prototype-vennlig)
Når Core ikke er aktivert, vis en subtil "Mynder Core" -rad i sidebaren som er disabled/tonet ned med en låsikon + tooltip "Aktiveres med Mynder Core". Dette gjør det synlig at det finnes et nivå til uten å rote menyen. (Valgfritt – kan droppes hvis det føles støyende.)

## Teknisk

- `useDashboardVariant` brukes ikke lenger i `Index.tsx`, men beholdes (kan bli relevant for andre steder/MSP).
- Ingen DB-endringer.
- Ingen endring i `TrustCenterDashboard.tsx` eller `DashboardV2.tsx`-innhold – kun flytting/wrapping.

## Filer som endres

- `src/App.tsx` – ny rute `/dashboard-core`
- `src/pages/Index.tsx` – forenkles til alltid Trust Center
- `src/pages/CoreDashboard.tsx` – ny, inneholder dagens Core-dashbord-innhold
- `src/components/Sidebar.tsx` – to dashbord-lenker øverst, betinget Core-lenke
- `src/lib/i18n.ts` – to nye nav-nøkler
