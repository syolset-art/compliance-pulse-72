

# Plan: Design-forenkling + navigasjonsendringer

## Tre endringer

### 1. Årshjul som eget menypunkt i sidebaren
Legger til "Årshjul" som eget menypunkt i `Sidebar.tsx` (med `CalendarDays`-ikon), som peker til en ny rute `/compliance-calendar`. Oppretter en enkel `ComplianceCalendar.tsx`-side som viser `ComplianceCalendarSection`-komponenten. Fjerner årshjulet fra dashbordet (`Index.tsx`) og fra `PostOnboardingRoadmapWidget`.

### 2. Behandlingsprotokoll (ROPA) flyttes under Rapporter
Fjerner "ROPA" (`/protocols`) fra hovednavigasjonen i `Sidebar.tsx`. Ruten beholdes, men navigasjonen til den skjer via Rapporter-siden. Legger til en klikk-handler på ROPA-rapportkortet i `Reports.tsx` som navigerer til `/protocols`.

### 3. Design-forenkling: Mindre blått, renere uttrykk

**`src/index.css`** — Justerer fargepaletten:
- `--primary` endres fra ren blå (211 100% 50%) til en dempet, mørkere nyanse (220 16% 22%) i lys modus — nær grafitt/mørk nøytral
- `--accent` endres fra blå-tint til en subtil varm grå
- `--ring` dempes tilsvarende
- Resultatet: Knapper, badges og aktive states blir nøytrale/mørke i stedet for knallblått

**`src/components/Sidebar.tsx`** — Fjerner den blå pulserende prikken (`animate-ping bg-primary`) på "highlight"-elementer. Erstatter med en diskret "Ny"-badge i nøytral farge.

**Widgets** — Ingen strukturelle endringer, men fargene vil automatisk følge den nye `--primary`-verdien.

## Filer som endres

| Fil | Endring |
|---|---|
| `src/index.css` | Ny fargepalett: dempet primary, accent, ring |
| `src/components/Sidebar.tsx` | +Årshjul-lenke, -ROPA fra nav, -blå pulsering |
| `src/pages/Index.tsx` | Fjern `ComplianceCalendarSection` fra dashbordet |
| `src/pages/ComplianceCalendar.tsx` | Ny side for årshjulet |
| `src/pages/Reports.tsx` | ROPA-kort navigerer til `/protocols` |
| `src/App.tsx` | Ny rute `/compliance-calendar` |

## Visuelt resultat

Dashbordet blir renere og kortere (årshjulet er borte). Sidebaren får et nytt "Årshjul"-punkt. Farger går fra "blått overalt" til en profesjonell, nøytral palett der kun statusfarger (grønn, gul, rød) gir farge. Helhetsinntrykket: Apple-aktig, rolig, "less is more".

