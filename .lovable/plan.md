## Problem

På `/msp-dashboard` har brukeren en visningsvelger «Kort / Tabell». På mobil viser begge valgene akkurat det samme — kort. Årsaken er at tabellen er gjemt bak `hidden lg:block`, og fallback under `lg` rendrer `MSPCustomerCard` i begge moduser.

## Løsning

Lag en kompakt, mobiltilpasset tabellvisning som vises når brukeren har valgt «Tabell» på små skjermer, slik at valget faktisk gir en annen visning.

### Endringer i `src/pages/MSPDashboard.tsx`

1. Fjern `lg:hidden`-fallbacken som tvinger kortvisning under `lg` når `view === "table"`.
2. Behold dagens fulle tabell (`hidden lg:block`) for desktop.
3. Legg til ny `lg:hidden`-blokk med en **mobil-tabell** som rad-liste:
   - Hver rad er en klikkbar `<button>` (navigerer til kunden, samme som desktop-tabellraden).
   - Kompakt layout per rad:
     - Linje 1: Kundenavn (font-medium, truncate) + chevron til høyre.
     - Linje 2: Liten metadata-stripe — bransje · land · modenhets-badge (gjenbruk samme farge-logikk som tabellen: success/warning/destructive).
     - Linje 3 (valgfri, kompakt): siste aktivitet/varsler-teller hvis tilgjengelig i samme felter som tabellen bruker.
   - Tett radhøyde, `divide-y border-border`, `rounded-lg border bg-card` rundt hele listen.
   - Sorteringen styres fortsatt av eksisterende `toggleSort` — på mobil legges en liten sorteringsknapp-rad over listen (Kunde / Modenhet / Sist aktiv) som speiler de viktigste kolonnene.
4. Sortering og filtrering deler samme `filtered`-array, slik at mobil-tabellen og desktop-tabellen alltid viser samme data.

### Det vi ikke endrer

- Kortvisning (`view === "cards"`) er uendret på alle skjermstørrelser.
- Ingen endringer i datakilder, sortering, filter eller `MSPCustomerCard`.
- Ingen endringer i andre sider.

### Tekniske detaljer

- Bruk semantiske tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `bg-success/15 text-success` osv.) — ingen rå farger.
- Risiko/modenhetsfarger følger prosjektets standard: ≥75 success, 50–74 warning, <50 destructive.
- Rad-knappen får `focus-visible:ring-2 ring-primary/40` for tilgjengelighet.
- Ingen ny avhengighet; ikke ny komponent — alt inline i `MSPDashboard.tsx` under det eksisterende table-grenet.

### QA

- 390 px viewport: «Kort» viser kortrutenett, «Tabell» viser tett radliste — synlig forskjell.
- ≥ `lg`: «Tabell» viser dagens fulle tabell uendret.
- Sortering/filter virker likt i begge breddene.
