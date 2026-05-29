## Mål

Gjør det åpenbart når brukeren står i "Partner"-kontekst og gi en tydelig, ett-klikks måte å bytte mellom **Min virksomhet** (compliance-arbeid) og **Partner** (kundeportefølje). Rene partnere skal lande direkte i Partner-modus uten å lete; hybridbrukere skal kunne hoppe mellom de to uten å rote.

## Konsept

To likestilte "workspaces" i samme app:

```text
┌──────────────────────────────┐
│ [🛡 Min virksomhet  ▾]       │  ← Workspace-bryter (øverst i sidebar)
│   • Compliance                │
│   • Min virksomhet (aktiv)    │
│   ─────────────              │
│   • Partner: Mynder AS        │  ← byttet til partner = hele UI endres
└──────────────────────────────┘
```

Når Partner-modus er valgt:
- Sidebaren bytter til partner-meny (Dashbord, Kunder, Tjenester, Faktura, Meldinger, ROI, Innstillinger)
- Compliance-modulene (Leverandører, Systemer, Aktiva, Trust Center …) skjules
- Topbar får en tydelig "Partner"-ribbon/badge med partnernavn
- `/` ruter til `/msp-partner` istedenfor compliance-dashbordet

## Hovedendringer

### 1. Ny `WorkspaceModeContext`
Ny kontekst `src/contexts/WorkspaceModeContext.tsx` med `mode: 'compliance' | 'partner'`, persistert i `localStorage` (`workspaceMode`). Default bestemmes av brukerens roller:
- Har kun `partner`-relaterte roller → `partner`
- Har compliance-roller → `compliance`
- Har begge → siste valgte, eller `compliance` ved første gangs bruk

### 2. Auto-redirect ved innlogging
I `Index.tsx` (`/`): hvis `mode === 'partner'` → `<Navigate to="/msp-partner" />`. Hvis brukeren KUN er partner og lander på en compliance-rute → redirect til partner-dashbord.

### 3. Workspace-bryter øverst i sidebar
Erstatt dagens `OrganizationSwitcher`-knapp med en større "Workspace card" som viser:
- Aktiv modus-ikon + label ("Min virksomhet" / "Partner")
- Organisasjon (eller partnernavn)
- Liten chevron som åpner en meny med begge modus + virksomhetsbytte

Visuelt skille: compliance-modus bruker primary-purple, partner-modus bruker en distinkt accent (f.eks. `--accent` / teal) slik at det er umiddelbart synlig at man er i Partner.

### 4. Sidebaren rendrer ulikt per modus
Refaktor `Sidebar.tsx`:
- `mode === 'compliance'` → dagens compliance-meny (Partner-undermeny fjernes herfra)
- `mode === 'partner'` → partner-meny som førsteklasses seksjoner (Dashbord, Kunder, Tjenester, Faktura, Meldinger, ROI, Salgsguide, Innstillinger)
- Innstillinger-blokken beholdes nederst i begge modus, men Partner-undermenyen fjernes derfra (den er ikke lenger gjemt)

### 5. Topbar partner-indikator
I `TopBar.tsx`: når `mode === 'partner'`, vis en liten pill/ribbon "Partner-modus · {partnerNavn}" + en "Bytt til Min virksomhet"-knapp for hybridbrukere. For kun-partnere skjules bryteren (de har ingen compliance-kontekst).

### 6. Hybrid- vs kun-partner-logikk
Helper `src/lib/workspaceMode.ts`:
- `getAvailableModes(roles)` → returnerer `['compliance', 'partner']` eller subset
- Bryteren i sidebar viser kun valg som er tilgjengelige
- Hvis kun ett valg → vis statisk badge istedenfor dropdown

### 7. Onboarding-hint (engangs)
Første gang en bruker som har begge moduser logger inn, vis en lett tooltip på workspace-bryteren ("Du kan bytte mellom Min virksomhet og Partner her") — lagres i `localStorage`.

## Filer som endres / opprettes

**Nye:**
- `src/contexts/WorkspaceModeContext.tsx`
- `src/lib/workspaceMode.ts`
- `src/components/sidebar/WorkspaceSwitcher.tsx` (erstatter OrganizationSwitcher-toppen)

**Endres:**
- `src/App.tsx` — wrap med `WorkspaceModeProvider`
- `src/pages/Index.tsx` — redirect basert på mode
- `src/components/Sidebar.tsx` — to ulike menyer basert på mode, fjern Partner fra Innstillinger
- `src/components/TopBar.tsx` — partner-ribbon + modus-bytteknapp
- `src/components/sidebar/OrganizationSwitcher.tsx` — kombineres med WorkspaceSwitcher eller flyttes inn under modus-valget
- `src/locales/en.json` + `nb.json` — nye nøkler for modus-bryter, partner-ribbon, tooltip

## Edge cases

- Bruker bytter til Partner mens hun er på `/leverandorer` → naviger til `/msp-partner`
- Bruker mister partner-rolle → fallback til `compliance` automatisk
- Ingen partnerinfo konfigurert men har `partner`-rolle → vis tom-tilstand på partner-dashbord i stedet for å skjule modus
- i18n: alle nye strenger lokalisert EN/NB iht. prosjektets standard

## Out of scope

- Endringer i selve `/msp-partner`-dashbordets innhold
- Endringer i RLS / databaseskjema (modus er ren UI-state)
- Nye roller i `app_role`-enum (vi bruker eksisterende partner-relaterte signaler)
