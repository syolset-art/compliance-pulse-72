

## Plan: Statusoppfølging på leverandøraktiviteter

I dag har hver aktivitet et skjult `outcomeStatus`-felt med kun tre verdier (Pågår / Fullført / Krever oppfølging) som vises som tekst, men brukeren kan ikke endre det. For en realistisk leverandøroppfølging trenger vi flere statuser og en tydelig statusveksler både i listen og i detaljpanelet.

### 1. Utvid statusmodellen (`src/utils/vendorActivityData.ts`)

Erstatt `OutcomeStatus` med en bredere `ActivityStatus`-type som er naturlig for leverandøroppfølging:

| Nøkkel | Norsk | Engelsk | Farge | Når brukes |
|---|---|---|---|---|
| `open` | Åpen | Open | grå | Nettopp opprettet, ikke startet |
| `in_progress` | Under oppfølging | In progress | blå | Aktivt arbeid pågår |
| `awaiting_vendor` | Venter på leverandør | Awaiting vendor | gul/amber | Sendt forespørsel, venter på svar |
| `awaiting_internal` | Venter på intern part | Awaiting internal | lilla | Venter på godkjenning/info internt |
| `blocked` | Blokkert | Blocked | rød | Hindring/eskalering |
| `completed` | Fullført | Completed | grønn | Ferdig, intet mer å gjøre |
| `cancelled` | Avbrutt | Cancelled | grå/gjennomstreket | Aktivitet ikke aktuell lenger |

Behold `outcomeStatus`-feltet som alias for bakoverkompatibilitet (`needs_followup` mappes til `awaiting_vendor`). Eksporter `ACTIVITY_STATUS_CONFIG` med full styling/lokalisering og hjelpefunksjon `getStatusGroup(status)` → `"open" | "active" | "waiting" | "done"` for filter-grupperinger.

### 2. Statusveksler i `ActivityDetailPanel.tsx`

Legg til en "Status"-seksjon over "Nivå"-velgeren med samme mønster som level-radiogruppen:
- Liten label med `Activity`-ikon: "Status"
- Knapper for hver av de 7 statusene med farget prikk + label
- Klikk kaller `onUpdate({ outcomeStatus, outcomeNb, outcomeEn })`
- Aktiv knapp får `border-primary bg-primary/10` (samme stil som level-velger)
- Knappene wrap'er på små skjermer

### 3. Status-pille i listen (`VendorActivityTab.tsx`)

I aktivitetsraden:
- Erstatt dagens `OutcomeIcon` + tekst (linje 266–269) med en kompakt **status-pille** (Badge med farget prikk + status-tekst) som tydelig viser om aktiviteten er åpen, venter eller fullført.
- Pillen bruker `ACTIVITY_STATUS_CONFIG[status].color` for bakgrunn/border.
- Endring skjer i detaljpanelet (klikk på raden for å utvide).

### 4. Statusfilter i toolbar (`VendorActivityTab.tsx`)

Legg til en andre rad med statusfiltre under fase-filtrene:
- "Alle / Åpne / Aktive / Venter / Fullført" (grupper, ikke alle 7 — for å holde det rent)
- Bruker `getStatusGroup()` for å mappe.
- Lagrer filter i ny `statusFilter`-state, AND-kombineres med `phaseFilter`.

### 5. Standardstatus i `RegisterActivityDialog.tsx`

Når brukeren oppretter en ny aktivitet manuelt:
- Default `outcomeStatus` settes til `open`.
- Legg til en enkel status-velger i dialogen (samme stil som level-velgeren) slik at brukeren kan starte aktiviteten i riktig tilstand. Gjelder også når den prefilles fra et Mynder-forslag.

### 6. Demo-data (`generateDemoActivities`)

Oppdater seedet for å gi realistisk fordeling så demoen viser hele spekteret:
- ~30% `completed`, ~25% `in_progress`, ~15% `awaiting_vendor`, ~10% `awaiting_internal`, ~10% `open`, ~5% `blocked`, ~5% `cancelled`

### 7. Status-historikk (lett-versjon, in-memory)

Når status endres via `updateActivity`, legg til en post i `act.statusHistory: { from, to, changedAt, changedBy }[]` (nytt valgfritt felt). I detaljpanelet vises nederst en kompakt liste "Statusendringer" når den finnes (maks 3 synlige, "Vis alle …" hvis flere). Gir sporbarhet uten DB-endring.

### Filer som endres
- `src/utils/vendorActivityData.ts` — ny statusmodell + config + demo-fordeling
- `src/components/asset-profile/ActivityDetailPanel.tsx` — statusveksler + historikk
- `src/components/asset-profile/tabs/VendorActivityTab.tsx` — status-pille + filter
- `src/components/asset-profile/RegisterActivityDialog.tsx` — status-velger + default
- `src/components/trust-controls/VendorTPRMStatus.tsx` — bruker `OUTCOME_COLORS`, justeres til ny config (kun visuelt)

### Ut av scope
- Persistering til database (alt holdes in-memory som resten av aktivitetslogikken i demoen)
- Notifikasjoner ved statusendringer
- Status-rapporter / eksport

