

## Problem: Statusendring ser ut til å påvirke alle systemer

### Sannsynlig årsak
Når du endrer status på et system (f.eks. fra «I bruk» til «Under evaluering»), forsvinner systemet fra listen fordi statusfilteret fortsatt viser «I bruk». Det ser da ut som om alle kort har samme status — fordi de som vises, faktisk alle *er* «I bruk». Det endrede systemet er skjult av filteret.

### Løsning
1. **Vis melding med lenke ved statusendring** — Når et system endrer status og forsvinner fra gjeldende filter, vis en toast med systemnavnet og en knapp for å bytte filter til den nye statusen.
2. **Oppdater toast til å inkludere systemnavn og ny status** — Gjør det tydelig *hva* som ble endret og *til hva*.

### Endringer

#### `Systems.tsx`
- Oppdater `changeStatus`-mutasjonen til å inkludere systemnavn i toasten
- Legg til handlingsknapp i toasten: «Vis i [ny status]» som setter `statusFilter` til den nye verdien
- Hent systemnavn fra `systems`-listen basert på `id` i `onSuccess`

```text
Eksempel toast:
┌───────────────────────────────────────┐
│ ✓ "Slack" endret til «Karantene»     │
│   [Vis i Karantene]                   │
└───────────────────────────────────────┘
```

### Teknisk detalj
- `changeStatus` mutasjonen bruker `onSuccess` med `variables` for å hente `id` og `status`
- Slå opp systemnavn fra `systems`-arrayet i `onSuccess`
- Kall `toast.success()` med `action`-parameter som setter `setStatusFilter(newStatus)`

