
# Styrerommet — fra operativ status til styringssnapshot

Styret skal ikke se hva som "krever handling" eller operative tiltakslister. De skal få et **snapshot** av virksomhetens styringsbilde, og en kort **beslutningsko** med saker som faktisk trenger styrets vedtak.

## Prinsipper

- Snapshot, ikke arbeidsliste. Ingen "krever handling"-språk, ingen oppgaver, ingen oppfølgingsknapper rettet mot styret.
- Alt skal kunne leses på 30 sekunder. Drill-down kun for kontekst, ikke for handling.
- Beslutninger er den eneste handlingen styret gjør herfra: godkjenn, utsett, deleger, ta til orientering.
- Tonen er nøytral og styringsfaglig — ikke alarm, ikke statusfarger som "rød = gjør noe".

## Ny seksjonsstruktur

```text
┌──────────────────────────────────────────────────────────┐
│ HERO — Styringssnapshot                                  │
│ Aggregert modenhet · Risikobilde · Periode               │
└──────────────────────────────────────────────────────────┘
┌──────────────┬──────────────┬──────────────┐
│ Etterlevelse │ Risikobilde  │ Kostnadsbase │
│ X/Y regelverk│ Eksponering  │ NOK/mnd      │
│ trend ▲▼     │ trend ▲▼     │ trend ▲▼     │
└──────────────┴──────────────┴──────────────┘
┌──────────────────────────────────────────────────────────┐
│ BESLUTNINGSKØ (0–5 saker)                                │
│ Saker som krever styrets vedtak, med kontekst og innstil-│
│ ling. Knapper: Godkjenn · Utsett · Deleger · Til oriente-│
│ ring. Tomt-tilstand: "Ingen saker venter på styret".     │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ REGELVERK — snapshot                                      │
│ Liste m/ nøytral modenhetsindikator + trend siste kvartal│
│ (ingen "krever handling"-merkelapper)                    │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ RISIKO & BEREDSKAP — snapshot                             │
│ Antall åpne hendelser (info), siste alvorlige hendelse,  │
│ beredskapsstatus. Drill-down viser kontekst, ikke tiltak.│
└──────────────────────────────────────────────────────────┘
```

## Endringer fra dagens dashbord

**Fjernes**
- Statusetiketten "Krever handling" / "Under utvikling" / "I kontroll" på regelverkslisten. Erstattes med nøytral modenhetsindikator (tall + diskret trend-pil).
- KPI-kortet "Åpne avvik" som hovedmetrikk på toppen — flyttes inn under Risiko & Beredskap som informasjon, ikke som rødt varsel.
- Footer-disclaimeren om compliance-ansvarlig (erstattes av kortere periode-/kildehenvisning i hero).

**Endres**
- Hero viser nå to tall side ved side: **Modenhet** og **Risikoeksponering** (lav/moderat/forhøyet — avledet, ikke et "rødt" badge). Periode vises eksplisitt ("Q2 2026").
- KPI-rad: Etterlevelse, Risikobilde, Kostnadsbase — alle med kvartalstrend (▲ ▼ →) i stedet for absolutte alarmtall.
- Regelverkslisten beholder fargedot, men teksten ved siden av blir nøytral ("Modenhet 62% · ▲ +4 siste kvartal"), ikke handlingsoppfordring.
- Drill-down drawers omformuleres: ingen "følg opp"-CTA, kun kontekst + lenke til "Se full rapport" (compliance-ansvarlig sitt domene).

**Nytt — Beslutningskø**
- Egen seksjon med saker styret må ta stilling til. Hver sak:
  - Tittel, kategori (Risikoaksept · Policygodkjenning · Investering · Regulatorisk vedtak)
  - Kort kontekst (2–3 linjer) + innstilling fra administrasjonen
  - Frist / hvilket styremøte saken hører til
  - Handlinger: **Godkjenn** · **Utsett** · **Deleger** · **Til orientering** (alle åpner en bekreftelsesdialog med fritekst for protokoll)
- Demo: 2–3 saker seedet i komponenten (risikoaksept leverandør, godkjenning av oppdatert informasjonssikkerhetspolicy, vedtak om DPIA-terskel).
- Tom tilstand: rolig melding "Ingen saker venter på styret. Neste styremøte: <dato>".

## Teknisk

- Endringene er rene presentasjonsendringer i `src/pages/BoardDashboard.tsx`.
- Beslutningskø implementeres som lokal demo-state (array i komponenten) + en `DecisionDialog` basert på eksisterende `Dialog`/`Textarea` shadcn-komponenter. Vedtak vises som toast + flyttes til "Behandlet i dag"-liste i samme økt (ingen persistens i denne iterasjonen).
- `statusFor()` deles i to: `maturityTone()` (nøytrale visuelle toner for snapshot) og beholder eksisterende fargelogikk kun i drill-down-kontekst.
- Trend-tall er demo-verdier i denne iterasjonen (samme mønster som `DEMO_VENDOR_COSTS`); markeres tydelig i drawer.
- Ingen endringer i database, hooks eller routing.

## Avgrensning

- Vi rører ikke `useComplianceRequirements`, sidemenyen eller andre dashbord.
- Vi legger ikke til persistens for vedtak nå — det kommer som egen sak når styreprotokoll-modellen er definert.
