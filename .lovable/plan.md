

# Plan: Virksomhetsvelger i sidebaren

## Oversikt
Etter at brukeren legger til virksomheter (via `AddOrganizationDialog`), må disse vises i en liste slik at brukeren enkelt kan se og bytte mellom dem. Løsningen er en virksomhetsvelger integrert i den eksisterende "company section" nederst i sidebaren.

## Design
Når brukeren klikker på virksomhetsnavnet nederst i sidebaren, vises en liste over alle virksomheter brukeren har tilgang til — både egne selskaper (`company_profile`) og partnerkunder (`msp_customers`). Den aktive virksomheten markeres visuelt. Klikk på en annen virksomhet bytter kontekst.

```text
┌─────────────────────────────┐
│ 🏢 Framdrift AS          ▼  │  ← aktiv virksomhet
├─────────────────────────────┤
│  ● Framdrift AS    (Aktiv)  │  ← egen virksomhet
│    Helsereiser AS           │  ← partnerkunde
│    NordTech Solutions       │  ← partnerkunde
│  ─────────────────────────  │
│  + Legg til virksomhet      │
├─────────────────────────────┤
│  ⚙ Organisasjon             │
│  👥 Tilgangsstyring         │
│  🔔 Varsler                 │
│  💳 Abonnement              │
└─────────────────────────────┘
```

## Endringer

### 1. Ny komponent: `src/components/sidebar/OrganizationSwitcher.tsx`
- Henter alle `company_profile`-rader og `msp_customers`-rader
- Viser begge i en gruppert liste (med labels "Mine virksomheter" og "Partnerkunder")
- Markerer aktiv virksomhet med en farge-dot og bold tekst
- Inkluderer "Legg til virksomhet"-knappen nederst
- Lagrer valgt virksomhet-ID i en React context eller localStorage

### 2. Ny context: `src/contexts/ActiveOrganizationContext.tsx`
- Holder `activeOrgId` og `activeOrgName` i context
- Brukes av sidebaren og potensielt andre sider for å vite hvilken virksomhet som er aktiv
- Persisterer valg i `localStorage`

### 3. Oppdater `src/components/Sidebar.tsx`
- Erstatte den nåværende "company section" (linje 522-569) med `OrganizationSwitcher`
- Fjerne inline `fetchCompany` useEffect (linje 238-251) — dette håndteres nå av context
- Beholde `settingsMenu`, partner-submeny og logout under virksomhetsvelgeren

## Filer

| Fil | Endring |
|---|---|
| `src/contexts/ActiveOrganizationContext.tsx` | Ny: Context for aktiv virksomhet |
| `src/components/sidebar/OrganizationSwitcher.tsx` | Ny: Virksomhetsvelger-komponent |
| `src/components/Sidebar.tsx` | Erstatte company-seksjonen med OrganizationSwitcher |
| `src/App.tsx` | Wrappe app med ActiveOrganizationProvider |

