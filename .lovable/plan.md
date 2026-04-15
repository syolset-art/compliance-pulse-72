

# Plan: Credits-first abonnementsmodell

## Konsept
Fjerne alle referanser til "ubegrenset systemer/leverandører" og systemtall fra planene. Hele narrativet dreies til **credits = valuta**. Modulene (Mynder Core og Leverandørstyring) er valgfrie komponenter som trekker credits — ikke noe man "låser opp" med en plan. Små bedrifter bruker lite, store bruker mer. Alle sparer penger og får full kontroll med Mynders agenter.

## Endringer

### 1. `src/lib/planConstants.ts`
- Fjerne "Ubegrenset systemer" og "Ubegrenset leverandører" fra `MODULES.systems.features` og `MODULES.vendors.features`
- Erstatte med credits-orienterte fordeler (f.eks. "Systemanalyse og risikovurdering via AI", "Bruker credits basert på omfang")
- Oppdatere module descriptions til credits-narrativet

### 2. `src/pages/Subscriptions.tsx`
- **PLAN_FEATURES**: Fjerne alle "Inntil X systemer/leverandører" og "Ubegrenset" linjer fra alle tiers
- Erstatte med credits-fokuserte fordeler:
  - **Free**: "Trust Center", "GDPR + ISO 27001", "10 credits/mnd", "Synlig i Mynder Trust Engine"
  - **Basis**: "Alt i Gratis +", "100 credits/mnd", "Arbeidsområder og oppgaver", "Prioritert onboarding"
  - **Premium**: "Alt i Basis +", "300 credits/mnd", "Prioritert support", "Avansert rapportering"
- Legge til en ny seksjon **"Komponenter"** mellom planvalg og credits — viser Mynder Core og Leverandørstyring som valgfrie tillegg med tekst som forklarer at de trekker credits basert på bruk
- Enterprise-teksten: Fjerne "Ubegrenset alt" → "Skreddersydd volum, dedikert kontaktperson, integrasjoner og SLA"

### 3. `src/components/systems/SystemActivateDialog.tsx`
- Oppdatere toast-melding fra "ubegrenset systemer" til credits-basert formulering

### 4. `src/components/vendor-dashboard/VendorActivateDialog.tsx`
- Oppdatere toast-melding fra "ubegrenset leverandører" til credits-basert formulering

## Ny "Komponenter"-seksjon (Subscriptions.tsx)
Visuelt design — to kort side om side:

```text
┌─ Mynder Core ──────────────┐  ┌─ Leverandørstyring ────────┐
│ Systemer, arbeidsområder,  │  │ DPA-sporing, risiko,       │
│ oppgaver og risikovurdering│  │ compliance-scoring, varsler │
│                            │  │                            │
│ Trekker credits basert på  │  │ Trekker credits basert på  │
│ antall systemer og omfang  │  │ antall leverandører         │
│                            │  │                            │
│ [Aktiver / Aktivert ✓]     │  │ [Aktiver / Aktivert ✓]     │
└────────────────────────────┘  └────────────────────────────┘

"Liten bedrift? Færre credits. Stor virksomhet? Mynders 
agenter skalerer med deg — du betaler kun for det du bruker."
```

## Filer

| Fil | Endring |
|---|---|
| `src/lib/planConstants.ts` | Fjerne ubegrenset-referanser fra module features |
| `src/pages/Subscriptions.tsx` | Ny credits-first planstruktur + Komponenter-seksjon |
| `src/components/systems/SystemActivateDialog.tsx` | Oppdatere toast-melding |
| `src/components/vendor-dashboard/VendorActivateDialog.tsx` | Oppdatere toast-melding |

