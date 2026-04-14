

# Plan: Slette-agent på dashbordet

## Konsept

En **Slette-agent** som overvåker lagringsfrister knyttet til behandlingsaktiviteter og systemer, og automatisk sletter/varsler når data skal fjernes. Kobles til behandlingsaktiviteter i arbeidsområder der lagringstid er definert.

**Hva agenten gjør (demo):**
- Overvåker lagringsfrister per behandlingsaktivitet og system
- Sender varsel når frist nærmer seg (f.eks. 30 dager før)
- Utfører automatisk sletting eller oppretter sletteoppgave
- Logger alle slettinger for revisjonsspor (GDPR Art. 17)

## Dashboard-widget

### Ikke aktivert — promoterings-kort
```text
┌──────────────────────────────────────────┐
│ 🗑️ Slette-agent                 490 kr/mnd│
│ Automatisk sletting ved utløpte frister  │
│ Overvåker lagringstid · Logger alt       │
│ [Aktiver]                                │
└──────────────────────────────────────────┘
```

### Aktivert — agent-kort med handlingslogg
```text
┌──────────────────────────────────────────┐
│ 🗑️ Slette-agent                  Aktiv ✓ │
│                                          │
│  3 planlagte  │  1 utført i dag          │
│                                          │
│  ▸ Kundedata HR — Visma       om 5 dager │
│    ↳ 342 poster klare for sletting       │
│  ▸ Søknadsdata — Recruitee    om 12 dager│
│    ↳ Venter godkjenning                  │
│  ▸ Kundelogg — Salesforce     utført ✓   │
│    ↳ 89 poster slettet 14. apr           │
│                                          │
│  [Se slettelogg →]                       │
└──────────────────────────────────────────┘
```

## Filer

| Fil | Endring |
|---|---|
| `src/components/dashboard/DeletionAgentPromoCard.tsx` | **Ny** — promotering + aktiveringsknapp med AlertDialog |
| `src/components/dashboard/DeletionAgentCard.tsx` | **Ny** — aktiv agent med demo-data (planlagte slettinger, utførte, ventende godkjenning) |
| `src/components/dashboard/DashboardCompact.tsx` | Legger til agent-widget under ControlAreasChart |

## Teknisk

- Aktivering via eksisterende `useActivatedServices` hook (nøkkel: `deletion-agent`)
- Demo-data: 3-4 hardkodede slette-oppgaver med statuser: `scheduled` (planlagt), `awaiting_approval` (venter godkjenning), `completed` (utført), `overdue` (over frist)
- Hver oppgave viser: system, behandlingsaktivitet, antall poster, frist, status
- Bekreftelses-dialog ved aktivering (AlertDialog)
- Ingen database-endringer

