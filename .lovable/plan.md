

## Agent-drevet "Be om oppdatering" — UI-konsept og plan

### Idé

Legge til en **"Automatiser med agent"**-toggle/CTA inne i `RequestUpdateDialog` og på knappen i headeren, slik at brukeren kan velge mellom manuell sending og å la en agent håndtere oppfølgingen automatisk.

### UI-design

**1. Knappen i headeren (AssetTrustProfile, SystemHeader, etc.)**
- Beholde nåværende "Be om oppdatering"-knapp som den er
- Legge til en liten `Sparkles`-ikon/badge ved siden av knappen som indikerer "Agent tilgjengelig" — en subtil lilla prikk eller sparkle

**2. Inne i RequestUpdateDialog — ny seksjon øverst**
- En ny "Agent mode"-banner/card øverst i dialogen:

```text
┌──────────────────────────────────────────────┐
│ ✨ La Lara håndtere dette automatisk         │
│                                              │
│ Agenten sender forespørselen, følger opp     │
│ ved fristbrudd, og varsler deg når svar       │
│ mottas. Du kan sette regler for oppfølging.  │
│                                              │
│  [Aktiver automatisk oppfølging]  ← toggle   │
└──────────────────────────────────────────────┘
```

- Når toggled **på**, vises ekstra felter:
  - **Purrefrekvens**: Velg mellom "Etter 7 dager" / "Etter 14 dager" / "Ukentlig"
  - **Maks purringer**: 1, 2, 3
  - **Eskaler til**: Dropdown med ansvarlig person
  - Knappen endres fra "Send forespørsel" → "Start automatisk oppfølging"

**3. "Kommer snart"-tilnærming (anbefalt for nå)**
- Siden dette er en funksjon som "skal komme", vis agent-banneret med en `Badge` som sier "Kommer snart" / "Coming soon"
- Toggle er disabled med tooltip som forklarer at det snart er tilgjengelig
- Gir brukeren en forsmak uten å kreve backend-endringer

### Teknisk plan

**Fil: `src/components/asset-profile/RequestUpdateDialog.tsx`**
- Legge til en ny seksjon rett under `DialogDescription` med agent-preview UI
- Inkluderer en disabled toggle med "Kommer snart"-badge
- Viser purreinnstillinger som grayed-out preview (disabled inputs)
- Bruker eksisterende Sparkles-ikon og primary-farger

**Fil: `src/pages/AssetTrustProfile.tsx`**
- Legge til en liten Sparkles-ikon på "Be om oppdatering"-knappen for å indikere agent-mulighet

**Fil: `src/components/system-profile/SystemHeader.tsx`**
- Samme Sparkles-indikator på knappen

### Designprinsipper
- Følger plattformens 3-nivå autonomiskala (Automatisk → Assistert → Manuell)
- Banneret bruker `bg-primary/5 border-primary/20` for gjenkjennelig agent-styling
- "Kommer snart"-badge i `secondary` variant
- Ingen database-endringer nødvendig — ren UI-preview

