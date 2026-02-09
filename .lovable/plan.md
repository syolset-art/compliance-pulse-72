
# Plan: ISO Readiness-visning for Oppgaver

## Oversikt

Legger til en ny visningsmodus på oppgavesiden som viser "ISO Readiness" - en strukturert oversikt over samsvarsstatus per kontrollområde (Personvern, Informasjonssikkerhet, AI Governance). Brukeren kan bytte mellom vanlig oppgavevisning og ISO Readiness-visning.

---

## Brukeropplevelse

Når brukeren er på /tasks-siden vil de se en ny knapp øverst ved siden av filtreringskontrollene: **"ISO Readiness"**. Ved å klikke på denne skifter visningen fra oppgavelisten til en strukturert sjekkliste som viser:

- Tre hovedkort (ett per domene: Personvern, Informasjonssikkerhet, AI Governance)
- Hver viser totalt antall krav og fremgangsprosent
- Utvidbar liste med fullførte og gjenstående krav
- Klare visuelle indikatorer (grønn hake for fullført, oransje klokke for pågående, grå for ikke startet)

---

## Endringer

### 1. Ny komponent: `ISOReadinessView.tsx`

Oppretter en ny komponent som viser ISO Readiness-status:

```
src/components/tasks/ISOReadinessView.tsx
```

**Innhold:**
- Tre domenekort med Progress-indikatorer
- Collapsible seksjoner for hver standard (ISO 27001, GDPR, EU AI Act)
- Liste over krav gruppert etter status: Fullført / Pågår / Ikke startet
- Bruker eksisterende `useComplianceRequirements`-hook for data

### 2. Oppdater Tasks.tsx

Legger til view-modus toggle:

| Element | Endring |
|---------|---------|
| Ny state | `viewMode: "tasks" \| "readiness"` |
| Toggle-knapp | "Oppgaver" / "ISO Readiness" ved siden av filterkortene |
| Betinget rendering | Viser `ISOReadinessView` når `viewMode === "readiness"` |

### 3. Lokaliseringsnøkler

**src/locales/nb.json:**
```json
"tasks": {
  "viewModes": {
    "tasks": "Oppgaver",
    "readiness": "ISO Readiness"
  },
  "readiness": {
    "title": "ISO Readiness Status",
    "subtitle": "Oversikt over samsvarsstatus per kontrollområde",
    "completed": "Fullført",
    "inProgress": "Pågår", 
    "remaining": "Gjenstår",
    "requirements": "krav",
    "viewDetails": "Vis detaljer",
    "hideDetails": "Skjul detaljer",
    "domains": {
      "privacy": "Personvern",
      "security": "Informasjonssikkerhet",
      "ai": "AI Governance"
    }
  }
}
```

**src/locales/en.json:**
```json
"tasks": {
  "viewModes": {
    "tasks": "Tasks",
    "readiness": "ISO Readiness"
  },
  "readiness": {
    "title": "ISO Readiness Status",
    "subtitle": "Compliance status overview by control area",
    "completed": "Completed",
    "inProgress": "In Progress",
    "remaining": "Remaining",
    "requirements": "requirements",
    "viewDetails": "View details",
    "hideDetails": "Hide details",
    "domains": {
      "privacy": "Privacy",
      "security": "Information Security",
      "ai": "AI Governance"
    }
  }
}
```

---

## Visuelt design

```text
┌─────────────────────────────────────────────────────────────────┐
│  Oppgaver                                                       │
│  Følg med på og administrer oppgaver                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Oppgaver]  [ISO Readiness]                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ 🛡️ Personvern    │ │ 🔒 Info.sikkerhet│ │ 🤖 AI Governance │ │
│  │                  │ │                  │ │                  │ │
│  │ ████████░░ 72%   │ │ ██████░░░░ 45%   │ │ ███░░░░░░░ 28%   │ │
│  │ 18/25 krav       │ │ 42/93 krav       │ │ 2/8 krav         │ │
│  │                  │ │                  │ │                  │ │
│  │ [▼ Vis detaljer] │ │ [▼ Vis detaljer] │ │ [▼ Vis detaljer] │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🛡️ Personvern - GDPR                                       ││
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ││
│  │                                                             ││
│  │ ✅ Fullført (18)                                            ││
│  │   ○ GDPR-Art5 - Personvernprinsipper                        ││
│  │   ○ GDPR-Art6 - Lovlig behandlingsgrunnlag                  ││
│  │   ○ GDPR-Art7 - Samtykkevilkår                              ││
│  │                                                             ││
│  │ 🔄 Pågår (3)                                                ││
│  │   ○ GDPR-Art30 - Behandlingsprotokoll (65%)                 ││
│  │   ○ GDPR-Art32 - Sikkerhetstiltak (40%)                     ││
│  │                                                             ││
│  │ ⏳ Gjenstår (4)                                              ││
│  │   ○ GDPR-Art35 - DPIA                                       ││
│  │   ○ GDPR-Art37 - DPO utnevnelse                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Tekniske detaljer

### Dataflyt

1. `ISOReadinessView` bruker `useComplianceRequirements` for hvert domene
2. Grupperer krav etter `domain` (privacy, security, ai)
3. Henter status fra `requirement_status`-tabellen via hook
4. Beregner prosent basert på `completed / total * 100`

### Domenemapping

| Domene | Rammeverk | Ikon |
|--------|-----------|------|
| privacy | GDPR | Shield (blå) |
| security | ISO 27001, NIS2 | Lock (grønn) |
| ai | EU AI Act, ISO 42001 | Brain (lilla) |

### Filer som opprettes/endres

| Fil | Handling |
|-----|----------|
| `src/components/tasks/ISOReadinessView.tsx` | **NY** - Hovedkomponent for readiness-visning |
| `src/pages/Tasks.tsx` | Endres - Legger til view-toggle |
| `src/locales/nb.json` | Endres - Legger til oversettelser |
| `src/locales/en.json` | Endres - Legger til oversettelser |

---

## Avhengigheter

- Bruker eksisterende `useComplianceRequirements` hook
- Bruker eksisterende `complianceRequirementsData.ts` for kravdata
- Bruker eksisterende UI-komponenter (Card, Progress, Badge, Collapsible)
