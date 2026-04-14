

## Plan: Penere sammendrag i FrameworkDetailCard

### Problem
Sammendrag-seksjonen (samlet samsvar + krav oppfylt) vises som flat tekst uten visuell separasjon. Tallene drukner i resten av kortet.

### Endringer i `src/components/regulations/FrameworkDetailCard.tsx`

**Nytt sammendragsfelt mellom progress og status-raden:**
- En visuelt distinkt boks med avrundede hjørner og subtil bakgrunn (`bg-muted/40 rounded-xl p-4`)
- Overskrift: «Sammendrag»
- To tall-kort side om side i et grid:
  - **Samlet samsvar** — stor prosenttall med fargekoding (grønn ≥67%, amber ≥34%, rød <34%)
  - **Krav oppfylt** — `met / total` i stor font
- Fjerner den eksisterende inline progress-teksten og erstatter med dette feltet
- Beholder progress-baren under sammendragsfeltet

**Visuell struktur:**
```text
┌─ Sammendrag ──────────────────────────┐
│  ┌──────────┐  ┌──────────────────┐   │
│  │ Samlet    │  │ Krav oppfylt    │   │
│  │ samsvar   │  │                 │   │
│  │   42%     │  │    6 / 15       │   │
│  └──────────┘  └──────────────────┘   │
│  ████████░░░░░░░░░░░░  42%           │
└───────────────────────────────────────┘
```

### Tekniske detaljer
- Kun endringer i `FrameworkDetailCard.tsx`
- Bruker eksisterende `counts` data — ingen ny logikk
- Tailwind-klasser for styling, ingen nye avhengigheter

