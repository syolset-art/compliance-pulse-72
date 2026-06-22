## Mål
Kundetabellen i `src/pages/MSPDashboard.tsx` (Tabell-visning) skal fungere på alle skjermstørrelser uten horisontal scroll. I dag vises tabellen kun fra `lg` og oppover, mens mobil/brett får en enkel kompakt rad uten flere kolonner og uten filtrering. Vi vil i stedet vise selve tabellen på alle breakpoints, og kutte kolonner gradvis mens skjulte kolonner blir tilgjengelige via en kolonne-meny (popover) — slik at filtrering og lesbarhet beholdes.

## Synlighet per breakpoint
Nye visningsregler for kolonnene (gjelder kun Tabell-visningen — Kort-visningen er uendret):

```text
Kolonne          Mobil (<640)  Liten brett (sm 640+)  Brett (md 768+)  Desktop (lg 1024+)  Stor (xl 1280+)
Kunde                 ✓              ✓                    ✓                ✓                 ✓
Modenhet              ✓              ✓                    ✓                ✓                 ✓
TP-status             —              ✓                    ✓                ✓                 ✓
Kritikalitet          —              —                    ✓                ✓                 ✓
Lara anbefaler        —              —                    —                ✓                 ✓
Bransje               —              —                    —                ✓                 ✓
Land                  —              —                    —                —                 ✓
```

Kunde får `w-auto` / `min-w-0` med truncation; faste pikselbredder reduseres så tabellen får plass uten `min-w-[1080px]` og uten horisontal scroll på md/lg.

## Kolonne-meny (felles for alle breakpoints)
Over tabellen, til høyre ved siden av «Kort | Tabell»-bryteren, legges en ny knapp `Kolonner` (lucide `Columns3`-ikon) som åpner en `Popover` med en sjekkliste over alle 7 kolonner. Brukeren kan slå kolonner av/på manuelt; defaults følger breakpoint-tabellen over, men en endring overstyrer defaulten for gjeldende enhet.

Tilstanden lagres i `localStorage` under `msp_dashboard_columns_v1` som `Record<ColumnKey, boolean>`. Initial state: hvis lagret verdi finnes, bruk den; ellers beregn fra nåværende `window.matchMedia` mot Tailwind-breakpoints (`sm`/`md`/`lg`/`xl`). Vi resetter ikke ved resize — brukerens valg vinner.

Filtre som i dag ligger som `ColumnFilter` i kolonneoverskriften (Land, Bransje, Kritikalitet, Lara anbefaler, TP-status) må fortsatt fungere når kolonnen er skjult. Løsning: når en kolonne med filter er skjult, vis et lite chip i en «Aktive filtre»-rad over tabellen (samme `ColumnFilter`-komponent rendres der i stedet). Sorteringsknapper (Kunde, TP-status, Modenhet) er bare relevante når kolonnen er synlig.

## Endringer i `src/pages/MSPDashboard.tsx`
1. Fjern `lg:hidden` kompakt-listen (linjene ~595–638) og `hidden lg:block`-wrapperen rundt tabellen — tabellen rendres alltid når `view === "table"`.
2. Fjern `table-fixed min-w-[1080px]`; behold `overflow-x-auto` som siste-utvei sikkerhetsnett.
3. Introduser `type ColumnKey = "customer" | "country" | "industry" | "criticality" | "services" | "tp_status" | "score"` og en `columns`-config med label + default-synlighet per breakpoint.
4. Ny hook `useColumnVisibility(columns)` som:
   - leser/lagrer `localStorage`
   - returnerer `{ visible: Record<ColumnKey, boolean>, toggle, isVisible }`
   - ved første render uten lagret verdi: bruk breakpoint-defaults
5. Wrap hver `TableHead` og `TableCell` med `{isVisible("key") && …}`.
6. Ny komponent `ColumnsMenu` (inline i samme fil eller `src/components/msp/ColumnsMenu.tsx`) med `Popover` + `Checkbox`-liste.
7. Ny rad «Aktive filtre» over tabellen som rendrer `ColumnFilter` for skjulte kolonner som har aktive valg eller alltid-tilgjengelige filtre (Land, Bransje, Kritikalitet, Lara, TP-status). Skjul raden hvis ingen filtre vises der.
8. Reduser faste bredder: Kunde `min-w-[160px] w-auto`, Land `w-[64px]`, Bransje `w-[140px]`, Kritikalitet `w-[120px]`, Lara `w-auto`, TP-status `w-[140px]`, Modenhet `w-[88px] text-right`.

Kort-visningen og alle øvrige UI-elementer på siden er uendret.

## Verifisering
- Bygget kompilerer (`tsc`).
- Playwright-snapper på 375px, 768px, 1024px, 1440px bekrefter at tabellen vises uten horisontal scroll og at riktige kolonner er synlige.
- Manuell sjekk: kolonne-menyen viser/skjuler kolonner og valget overlever reload; skjulte filtre dukker opp i «Aktive filtre»-raden og filtrerer fortsatt riktig.
