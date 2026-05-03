## Plan: Tydeligere agentisk flyt for "Godta sammendrag" på Veiledning fra Mynder

### Problem
I dag er "Godta sammendrag"-knappen forvirrende — den viser en toast og forsvinner uten at brukeren ser hva som faktisk skjer. Brukeren skjønner ikke:
- Hva betyr egentlig "godta"?
- Hva er forskjellen på Operasjonelt / Taktisk / Strategisk?
- Hvor blir det av aktivitetene?
- Hvordan kommer man til neste steg (f.eks. faktisk sende e-post til leverandøren)?

### Foreslått 4-stegs agentisk flyt

```text
[1] Lara foreslår        → [2] Aktiviteter opprettet  → [3] Lara foreslår neste handling → [4] Brukeren bekrefter
    "3 gap funnet"           "3 aktiviteter klare,        "Send e-post til kontakt@…        "Send e-post" → sendt,
    [Opprett alle (3)]       ikke påbegynt"               for å be om DPA"                  aktivitet → Under oppfølging
    [Vis først] [Avvis]      Hver med nivå-tag            [Forhåndsvis e-post]
                             (Op / Tak / Strat)           [Endre forslag] [Hopp over]
```

### Endringer per steg

**Steg 1 — Sammendrags-boblen blir tydelig på handlingen**
- Endre primærknapp fra "Godta sammendrag" → **"Opprett 3 aktiviteter"** (dynamisk antall).
- Sekundærknapp "Vis først" scroller ned til kort-listen uten å opprette noe.
- "Avvis" beholdes.
- Mikro-tekst under: *"Aktivitetene blir opprettet, men ikke påbegynt — du bestemmer når noe skjer."*

**Steg 2 — Kvitterings-tilstand på sammendrags-boblen**
Etter klikk på "Opprett":
- Boblen bytter til grønn variant: **"✓ 3 aktiviteter opprettet — ikke påbegynt"**.
- Liste-overskriften endres til: **"Aktiviteter klare for handling (3)"**.
- Hvert kort får ny status-badge **"Opprettet"** (ikke `Open` lenger) og knappen "Godta og start aktivitet" erstattes av Steg-3-blokken.

**Steg 3 — Lara foreslår neste konkrete handling per aktivitet**
Innenfor hvert kort (når statusen er "Opprettet"), legg en ny Lara-sub-boble:
- For e-post-aktiviteter (DPA, SLA): *"Jeg kan sende e-post til kontakt@leverandør.no og be om signert DPA."* → **[Forhåndsvis e-post]** [Endre mottaker] [Hopp over]
- For møte-aktiviteter (risikovurdering): *"Jeg kan foreslå 3 møtetider og sende invitasjon."* → **[Forhåndsvis invitasjon]** [Endre] [Hopp over]
- For manuelle: *"Jeg har laget et utkast til oppgavebeskrivelsen."* → **[Forhåndsvis oppgave]** [Endre] [Hopp over]

**Steg 4 — Forhåndsvisning + bekreftelse**
Ny komponent `LaraEmailPreviewDialog` (gjenbruker eksisterende e-poststruktur fra `laraEmailSuggestions.ts`):
- Viser fra/til/emne/innhold (redigerbart).
- Footer: **[Send nå]** [Rediger og send senere] [Avbryt]
- Etter "Send": toast + aktivitet flyttes til status "Under oppfølging" + sub-boblen byttes til *"✓ Sendt 03.05.2026 — venter på svar"*.

### Tydeliggjøring av nivå (Operasjonelt / Taktisk / Strategisk)

Brukerne forstår ikke disse begrepene. To grep:

1. **Forklarende tooltip på hver chip**:
   - **Operasjonelt** (grønn): *"Daglig drift — løses raskt, lite analyse. F.eks. innhente et dokument."*
   - **Taktisk** (oransje): *"Krever oppfølging over uker — koordinering med leverandør og interne roller. F.eks. revidere DPA."*
   - **Strategisk** (lilla): *"Påvirker risikobildet i organisasjonen — krever ledelsesbeslutning. F.eks. skifte leverandør, gjøre risikovurdering."*

2. **Ikon + tekst i chip**: I dag er det bare en farget prikk. Legg til ikon (Wrench / Target / Compass) så det er gjenkjennbart uten å lese fargelegenden.

3. **Legend over listen** beholdes, men får hover-forklaring og en kort ledetekst: *"Lara prioriterer aktiviteter etter hvor mye de påvirker virksomheten."*

### Filer som berøres

- `src/components/asset-profile/MynderGuidanceTab.tsx` — orkestrere de 4 stegene; ny lokal state `acceptedSummary`, `perCardStep` (created → preview → sent).
- `src/components/asset-profile/LaraNextStepBubble.tsx` *(ny)* — Lara's sub-forslag per kort med [Forhåndsvis] / [Endre] / [Hopp over].
- `src/components/asset-profile/LaraActionPreviewDialog.tsx` *(ny)* — generisk preview-dialog (e-post / møte / oppgave). Bruker `Textarea` for redigering og kaller eksisterende `vendorActivityData`-API for å logge.
- `src/components/asset-profile/LevelChip.tsx` *(ny)* — gjenbrukbar nivå-pille med ikon + tooltip-forklaring.
- `src/utils/vendorGuidanceData.ts` — utvid `SuggestedActivity` med `nextActionNb/En` (fritekst) + `nextActionType: "email" | "meeting" | "task"` + `nextActionRecipient?`. Fyll inn for de tre TEMPLATES.
- `src/utils/laraEmailSuggestions.ts` — eksisterer; gjenbruk for e-post-utkast.

### Visuelle prinsipper (Mynder design system)
- Lara-bobler beholder `purple-100` bakgrunn, `purple-900` tekst, `rounded-2xl`.
- Kvitterings-bobler bruker `bg-success/10 text-success` med `CheckCircle2`-ikon, ikke lilla — *"Lara har gjort noe ferdig"* signaliseres som status, ikke som forslag.
- Knapper er `rounded-pill`. Primærhandling i `bg-primary`. Sekundære i `outline`.
- Ingen skjemaer — alt skjer inline eller i lett dialog. Brukeren skal aldri føle at hun "forlater" leverandørkortet.

### Out of scope
- Faktisk e-postutsendelse (forblir simulert toast i prototypen).
- Endring av selve aktivitetsmodellen / statusgraf.
- Bulk-handling på flere aktiviteter samtidig (kan tas i en senere runde — i dag står "Opprett alle" allerede som bulk).