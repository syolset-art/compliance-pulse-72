

## Plan: Forbedre «Veiledning fra Mynder» som TPRM-løsning

### Problemanalyse

Fanen har alle byggeklossene for en TPRM-løsning, men informasjonen er fragmentert og krever at brukeren klikker seg gjennom flere utvidbare seksjoner for å forstå:
- Er denne leverandøren trygg å bruke?
- Hva gjenstår å gjøre?
- Hvor alvorlig er det?

Hovedutfordringene:
1. **Ingen umiddelbar konklusjon** — Brukeren må tolke Risiko + Kontroll + Status selv
2. **Oppgaver er gjemt** — Kollapset som standard, blandet med TPRM-mangler
3. **For mange klikk** — Modenhet, oppgaver, mangler er i separate kollapserbare seksjoner
4. **Ingen prioritering** — Hva er viktigst å gjøre FØRST?

### Hva endres

#### 1. Ny «Executive Summary»-banner øverst i Oppfølgingsstatus
Erstatt det nåværende 3-kolonne-griddet med en tydelig statuslinje som gir umiddelbar konklusjon:

```text
┌────────────────────────────────────────────────────────────┐
│ 🟡 Under oppfølging                           [Endre ▾]  │
│                                                            │
│ Risiko: ● Middels    Kontroll: 2/4    Modenhet: 72%       │
│                                                            │
│ ⚠ 3 oppgaver gjenstår for å nå «Godkjent»               │
│   • Mangler DPA  • Mangler risikovurdering  • Sett opp    │
│     revisjon                                               │
└────────────────────────────────────────────────────────────┘
```

- Status-emojien og bakgrunnsfarge gir umiddelbar visuell feedback (grønn/gul/rød)
- Statusvelgeren (dropdown) beholdes inline
- En kort oppsummeringslinje under sier «X oppgaver gjenstår» med lenke til oppgaveseksjonen

#### 2. Oppgaver vises ÅPNE som standard (ikke kollapset)
- `tasksExpanded` starter som `true` når det finnes åpne oppgaver
- TPRM-mangler og vanlige oppgaver vises integrert, men TPRM-mangler prioriteres øverst med tydelig visuell gruppering
- Hver oppgave får en prioritet-indikator og estimert handlingslenke

#### 3. Manglende TPRM-krav flyttes FRA oppgaveseksjonen og INN i Oppfølgingsstatus-kortet
- Oppfølgingsstatus-kortet viser de 4 kontrollene som en sjekkliste (✅ DPA, ❌ SLA, etc.)
- Hvert manglende krav har en direkte handlingsknapp
- Oppgaveseksjonen viser kun faktiske oppgaver (ikke dupliserte TPRM-mangler)

#### 4. Visuell forenkling av Modenhet-lenken
- Modenhet-baren inne i Oppfølgingsstatus erstattes med en kompakt linje i summary-raden
- Fjerner behovet for en separat klikkbar boks

### Filer som endres

1. **`src/components/trust-controls/VendorTPRMStatus.tsx`**
   - Redesign layouten: tydelig statusbanner med bakgrunnsfarge basert på level
   - Legg kontroll-sjekklisten (4 krav) tilbake som visuell sjekkliste med handlingsknapper
   - Behold dropdown for manuell statusendring
   - Legg til oppsummeringslinje: «X oppgaver gjenstår for å nå Godkjent»

2. **`src/components/asset-profile/tabs/VendorOverviewTab.tsx`**
   - Sett `tasksExpanded` default til `true` når `openTasks.length > 0`
   - Fjern TPRM-mangler fra oppgaveseksjonen (flyttes til Oppfølgingsstatus)
   - Forenkle oppgavekortet til kun å vise faktiske tasks

### Ingen databaseendringer

