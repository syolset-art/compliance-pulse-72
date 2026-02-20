

# Dashboard 2.0 -- Compliance som spill

## Konsept

Et helt nytt dashbord som en separat side (`/dashboard-v2`) der compliance presenteres som et spill. Brukeren ser umiddelbart:
1. **Er jeg trygg?** (ett stort "shield score" med farge)
2. **Hva ma jeg gjore na?** (neste handling, ikke 15 widgets)
3. **Mestringsfølelse** (XP, streak, niva)

Dagens dashbord har 12+ widgets som krever scrolling og tolkning. Dashboard 2.0 har 3 soner som alle er synlige uten scroll.

## Design: Tre soner

```text
+---------------------------------------------------------------+
|  SONE 1: COMPLIANCE SHIELD                                    |
|  +-----------+  +------------------------------------------+  |
|  |           |  |  "Du har kontroll"  /  "Trenger oppfolging" |
|  |  SHIELD   |  |  Score: 67/100                             |
|  |   67      |  |  Niva: Implementerer  (XP: 1240)           |
|  |           |  |  Streak: 5 uker aktiv                      |
|  +-----------+  +------------------------------------------+  |
|                                                               |
|  [Personvern: 72%] [Sikkerhet: 58%] [AI: 71%]  <- 3 piller   |
+---------------------------------------------------------------+
|  SONE 2: NESTE HANDLING (maks 3 kort)                         |
|  +-------------------+ +-------------------+ +-----------+    |
|  | ! Godkjenn risiko  | | Mangler 2 DPA-er | | Kurs X    |    |
|  |   vurdering        | |                   | |           |    |
|  |   +50 XP           | |   +30 XP          | | +20 XP    |    |
|  |   [Gjor det ->]    | |   [Gjor det ->]   | | [Start]   |    |
|  +-------------------+ +-------------------+ +-----------+    |
+---------------------------------------------------------------+
|  SONE 3: RISIKOBILDE + ARSHJUL (side-by-side)                 |
|  +---------------------------+ +---------------------------+  |
|  | Risikoradar               | | Arshjul                   |  |
|  | [K:3] [H:5] [M:13] [L:15]| | Q1: ok  Q2: aktiv        |  |
|  |                           | | Q3: --  Q4: --            |  |
|  +---------------------------+ +---------------------------+  |
+---------------------------------------------------------------+
```

## Gamification-elementer

| Element | Hva det gjor | Data-kilde |
|---------|-------------|------------|
| **Compliance Shield Score** | Ett tall 0-100 basert pa vektet compliance-prosent per domene | `useComplianceRequirements` |
| **Niva** | Maturity-level vist som spillniva (Initial -> Definert -> Implementert -> Malt -> Optimalisert) | `MATURITY_LEVELS` |
| **XP** | Poeng basert pa fullforte krav (critical=50, high=30, medium=20, low=10) | Beregnet fra `requirement_status` |
| **Streak** | Antall uker pa rad med minst 1 fullfort handling | Beregnet fra `completed_at` timestamps |
| **Neste handling** | De 3 viktigste tingene a gjore akkurat na, med XP-belonning | Dynamisk fra `grouped.incompleteManual` |

## Mestringssprak

I stedet for teknisk compliance-sprak bruker vi:

| Score | Melding | Farge |
|-------|---------|-------|
| 80-100 | "Du har kontroll" | Gronn shield |
| 60-79 | "Pa god vei" | Bla shield |
| 40-59 | "Trenger oppfolging" | Gul shield |
| 0-39 | "Viktige mangler" | Rod shield |

## Teknisk plan

### Ny fil: `src/pages/DashboardV2.tsx`
- Hovedside med sidebar (gjenbruker `Sidebar`)
- Tre soner i en enkel flex-layout uten scroll
- Bruker `useComplianceRequirements` for all data
- Beregner XP, streak, niva lokalt

### Ny fil: `src/components/dashboard-v2/ComplianceShield.tsx`
- Stor animert shield-ikon med score i midten
- SVG-basert sirkelprogress (ligner CriticalTasksWidget sin donut, men storre)
- Fargeskala basert pa score
- Viser niva-badge og XP-teller
- Tre domene-piller under (personvern, sikkerhet, AI) med mini-progress

### Ny fil: `src/components/dashboard-v2/NextActionCards.tsx`
- Maks 3 handlingskort, sortert etter prioritet og XP-verdi
- Hvert kort har: ikon, tittel, kort beskrivelse, XP-belonning, handlingsknapp
- Handlingsknappen navigerer til riktig side
- Prioriteringslogikk fra PostOnboardingRoadmapWidget, men forenklet

### Ny fil: `src/components/dashboard-v2/RiskAndCalendarSection.tsx`
- To kolonner side-by-side
- Venstre: Forenklet risikoradar (3 domener med fargekodede risikotall)
- Hoyre: Kompakt arshjul (4 kvartaler, markerer aktivt kvartal)

### Endring: `src/App.tsx`
- Legg til route: `/dashboard-v2`

### Endring: `src/components/Sidebar.tsx`
- Legg til navigasjonslenke "Dashboard 2.0" under hovednavigasjon (midlertidig, for sammenligning)

## XP-beregning

```text
xp = sum av fullforte krav * poeng per prioritet
  critical = 50 XP
  high     = 30 XP
  medium   = 20 XP
  low      = 10 XP
```

Beregnes fra `requirements.filter(r => r.status === 'completed')` som allerede finnes i `useComplianceRequirements`.

## Streak-beregning

```text
Grupper completed_at etter uke (ISO week)
Tell antall sammenhengende uker bakover fra na
```

Bruker `date-fns` (allerede installert) for ukeberegning.

## Hvorfor dette fungerer

- **Ett tall** (shield score) gir umiddelbar forstaelse av status
- **Mestringssprak** ("Du har kontroll") i stedet for teknisk sjargong
- **Maks 3 handlinger** fjerner beslutningsvegring
- **XP og streak** gir motivasjon til a komme tilbake
- **Alt synlig uten scroll** -- ingen informasjonsoverbelastning
- **Separat side** betyr ingen risiko for eksisterende dashboard

