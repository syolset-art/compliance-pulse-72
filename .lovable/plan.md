

## Plan: Koble TPRM-mangler til oppgavemodulen

### Konsept

Når den forenklede TPRM-statusen viser mangler (manglende DPA, SLA, risikovurdering, revisjon), skal disse kobles direkte til oppgaver i `tasks`-tabellen. Mangler-listen i TPRM-kortet blir klikkbar og scroller ned til den aktuelle oppgaven. Oppgavemodulen viser hvilke oppgaver som stammer fra TPRM-mangler.

### Hvordan det fungerer

**1. TPRM-mangler genererer oppgave-referanser**

Hver mangel i TPRM-kortet sjekker om det finnes en matchende åpen oppgave for denne eiendelen (via `tasks.relevant_for` som inneholder asset-ID). Matching skjer på `task.type` eller `task.title` som inneholder nøkkelord ("DPA", "SLA", "risikovurdering", "revisjon").

- Hvis oppgave finnes → vis som klikkbar lenke med status-indikator
- Hvis oppgave ikke finnes → vis "Be om..." aksjonsknapp som før

**2. Klikk på mangel → scroll til oppgave**

Når brukeren klikker en mangel som har en tilknyttet oppgave, utvides oppgavemodulen automatisk og scroller til riktig oppgave (highlight kort).

**3. Oppgavemodulen viser TPRM-kobling**

Oppgaver som matcher TPRM-mangler får et lite TPRM-ikon/badge slik at brukeren ser sammenhengen.

### UI-flyt i TPRM-kortet

```text
┌──────────────────────────────────────────┐
│ 🛡 Oppfølgingsstatus        🟡 Under    │
│                              oppfølging  │
├──────────────────────────────────────────┤
│  Risiko: Middels    Kontroll: 2/4        │
│                                          │
│  Mangler:                                │
│  ○ SLA          🔗 Se oppgave ↓          │
│  ○ Risikovurd.        [Be om vurdering]  │
└──────────────────────────────────────────┘
```

Mangler med eksisterende oppgave → "Se oppgave ↓" (scroller ned)
Mangler uten oppgave → aksjonsknapp (Be om DPA, etc.)

### Endringer

**`src/components/trust-controls/VendorTPRMStatus.tsx`** (hovedendring i den forenklede versjonen):
- Hent `tasks` for denne eiendelen (samme query som VendorOverviewTab bruker, via prop eller egen query)
- Match hver mangel mot åpne oppgaver basert på nøkkelord i tittel/type
- Vis "Se oppgave ↓" lenke som dispatcher `scroll-to-tasks` event + en task-highlight event
- Beholde "Be om..." knapper for mangler uten oppgave

**`src/components/asset-profile/tabs/VendorOverviewTab.tsx`**:
- Sende `tasks` som prop til VendorTPRMStatus for å unngå duplisert query
- Legge til highlight-logikk: lytte på en `highlight-task` event som markerer en spesifikk oppgave med en kort animasjon
- Oppgaver med TPRM-kobling får et lite shield-ikon

### Ingen databaseendringer

Koblingen bruker eksisterende `tasks.relevant_for` (array med asset-IDer) og matcher på tittel/type. Ingen nye kolonner trengs.

### Filer som endres
1. `src/components/trust-controls/VendorTPRMStatus.tsx` — Legge til oppgave-matching og scroll-lenker
2. `src/components/asset-profile/tabs/VendorOverviewTab.tsx` — Sende tasks-prop, highlight-logikk

