Oppgave: Endre layouten i `CustomerModulesTab.tsx` slik at modul-kortene vises to eller tre ved siden av hverandre i stedet for én full kolonne.

Nåværende tilstand:
- `CustomerModulesTab.tsx` rendrer 5 modul-kort i en enkelt `space-y-3`-kolonne (`<div className="space-y-3">{modules.map(...)}</div>`).
- Hvert kort tar full bredde og inneholder ikon, tittel, status, beskrivelse, ev. meta/usage-bars, pris og knapper.

Endringer:
1. **Rutenett-layout**
   - Erstatt den ytre `space-y-3`-wrapperen med en CSS-grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.
   - Det gir 1 kolonne på mobil, 2 på nettbrett og 3 på større skjermer.

2. **Kort-innhold må tåle smalere bredde**
   - Behold eksisterende kort-innhold, men sørg for at interne flex-rader bryter fint ved smal bredde.
   - Pris- og knapp-seksjonen (`sm:min-w-[140px]`) kan gå fra horisontal til vertikal stabling på små kort; behold `flex-col` på `sm` og opp, men la den gå `flex-row` under `sm` som i dag.
   - Usage-baren (fremdrift) beholdes, men skalere med kortbredden.

3. **Responsivitet**
   - Sørg for at tittel + status-badges bryter på én linje eller pakker seg ved trang plass.
   - Knapper og pris justeres til høyre i bunnen av kortet.

4. **Ingen endring i data eller funksjonalitet**
   - `modules`-array, `monthlyTotal`, `handleToggleFramework`, `EditActiveFrameworksDialog` og `notImplemented` beholdes uendret.

Fil som endres:
- `src/components/msp/CustomerModulesTab.tsx`