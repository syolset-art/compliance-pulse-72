
# Plan: Forbedret ISO Readiness-visning

## Oversikt

Forbedrer ISO Readiness-visningen med tre nøkkelforbedringer:

1. **Vise hvilke ISO-standarder som gjelder** for hvert kontrollområde (Privacy = GDPR, Security = ISO 27001, AI = EU AI Act)
2. **Default til Privacy** når ISO Readiness åpnes (fra URL-parameter)
3. **Interaktiv sjekkliste** med mulighet for å huke av krav og legge til kommentarer

---

## Endringer

### 1. Oppdater DomainCard med ISO-referanser

Hvert domenekort får en undertekst som viser relevante standarder:

| Domene | ISO/Standard-referanse |
|--------|------------------------|
| Personvern | GDPR (EU) 2016/679 |
| Informasjonssikkerhet | ISO/IEC 27001:2022 |
| AI Governance | EU AI Act (2024/1689) |

### 2. Utvid ISOReadinessView med domain-tabs

Endrer fra grid med tre kort til:
- **Tre domenekort** øverst (oppsummering)
- **Detaljvisning** under som viser utvidet liste for valgt domene
- Default: Privacy-domenet er valgt når siden åpnes

### 3. Interaktiv kravliste

For hvert krav i listen:
- **Checkbox** for å markere som fullført
- **Kommentarfelt** (ekspanderbart) for å legge til notater
- Lagring til databasen via `updateStatus`-mutasjon
- Visuell feedback når endringer lagres

### 4. URL-parameter støtte

- Leser `domain` fra URL (f.eks. `/tasks?domain=privacy`)
- Setter viewMode til "readiness" automatisk når domain-parameter er satt
- Default til "privacy" ved første åpning av readiness-visning

---

## Visuell mockup

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  ISO Readiness Status                                                   │
│  Oversikt over samsvarsstatus per kontrollområde                        │
│                                                                         │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐         │
│  │ 🛡️ Personvern    │ │ 🔒 Info.sikkerhet│ │ 🤖 AI Governance │         │
│  │ GDPR 2016/679    │ │ ISO 27001:2022   │ │ EU AI Act 2024   │         │
│  │                  │ │                  │ │                  │         │
│  │ ████████░░ 72%   │ │ ██████░░░░ 45%   │ │ ███░░░░░░░ 28%   │         │
│  │ 9/12 krav        │ │ 42/93 krav       │ │ 2/8 krav         │         │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘         │
│  [VALGT]                                                                │
│                                                                         │
│  ╔═════════════════════════════════════════════════════════════════════╗│
│  ║  Personvern – GDPR                                     9/12 krav   ║│
│  ╠═════════════════════════════════════════════════════════════════════╣│
│  ║                                                                     ║│
│  ║  ✅ Fullført (9)                                                    ║│
│  ║  ┌─────────────────────────────────────────────────────────────┐   ║│
│  ║  │ [✓] GDPR-Art30 • Protokoll over behandlingsaktiviteter      │   ║│
│  ║  │     "Fullført ved hjelp av Lara AI – Mai 2024"               │   ║│
│  ║  ├─────────────────────────────────────────────────────────────┤   ║│
│  ║  │ [✓] GDPR-Art6 • Dokumentasjon av behandlingsgrunnlag        │   ║│
│  ║  │     [+ Legg til kommentar]                                   │   ║│
│  ║  └─────────────────────────────────────────────────────────────┘   ║│
│  ║                                                                     ║│
│  ║  ⏳ Gjenstår (3)                                                    ║│
│  ║  ┌─────────────────────────────────────────────────────────────┐   ║│
│  ║  │ [ ] GDPR-Art35 • Personvernkonsekvensvurdering (DPIA)       │   ║│
│  ║  │     Kategori: Governance | Prioritet: Høy                    │   ║│
│  ║  │     [+ Legg til kommentar]                                   │   ║│
│  ║  ├─────────────────────────────────────────────────────────────┤   ║│
│  ║  │ [ ] GDPR-Art37 • Personvernombud                            │   ║│
│  ║  │     Kategori: Organisatorisk | Prioritet: Høy                │   ║│
│  ║  └─────────────────────────────────────────────────────────────┘   ║│
│  ╚═════════════════════════════════════════════════════════════════════╝│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tekniske detaljer

### Nye oversettelsesnøkler

**nb.json:**
```json
"readiness": {
  "standards": {
    "privacy": "GDPR (EU) 2016/679",
    "security": "ISO/IEC 27001:2022",
    "ai": "EU AI Act (2024/1689)"
  },
  "addComment": "Legg til kommentar",
  "saveComment": "Lagre",
  "markComplete": "Merk som fullført",
  "category": "Kategori",
  "priority": "Prioritet",
  "commentPlaceholder": "Legg til dokumentasjon eller notater...",
  "savedSuccess": "Endringer lagret",
  "savedSuccessDesc": "Status oppdatert"
}
```

**en.json:**
```json
"readiness": {
  "standards": {
    "privacy": "GDPR (EU) 2016/679",
    "security": "ISO/IEC 27001:2022",
    "ai": "EU AI Act (2024/1689)"
  },
  "addComment": "Add comment",
  "saveComment": "Save",
  "markComplete": "Mark as complete",
  "category": "Category",
  "priority": "Priority",
  "commentPlaceholder": "Add documentation or notes...",
  "savedSuccess": "Changes saved",
  "savedSuccessDesc": "Status updated"
}
```

### Dataflyten

1. `ISOReadinessView` mottar valgt domene fra prop/URL
2. Henter krav via `useComplianceRequirements({ domain })`
3. Bruker `updateStatus`-mutasjon for å lagre endringer
4. Toast-melding bekrefter lagring

### Filer som endres

| Fil | Handling |
|-----|----------|
| `src/components/tasks/ISOReadinessView.tsx` | Større refaktorering - legger til standard-referanser, domenevalg, interaktiv sjekkliste |
| `src/pages/Tasks.tsx` | Oppdaterer for å sette readiness som default når domain-param er satt |
| `src/locales/nb.json` | Legger til nye oversettelser |
| `src/locales/en.json` | Legger til nye oversettelser |

### Demo-data

For å illustrere funksjonaliteten vil Privacy-domenet vise:
- **9 fullførte** GDPR-krav med eksempelkommentarer
- **3 gjenstående** GDPR-krav som kan hukes av

Dette bruker eksisterende seed-data og `requirement_status`-tabellen.

