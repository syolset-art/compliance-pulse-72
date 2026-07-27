## Endre modul-visning til liste-rader

Referansebildet viser modulene som fulle rader stablet vertikalt, ikke som et grid av kort. Hver rad har:
- Venstre: tittel + statuspille + evt. nivåpille på samme linje, kort beskrivelse, og en subtil bruksmetrikk (f.eks. `21 av 50 systemer i bruk` med tynn progress-bar for Core, `3 aktive: GDPR, ISO 27001, Åpenhetsloven` for Regelverk, `11 leverandører registrert` osv.).
- Høyre: pris (stor) + `per måned`, med `Avbestill` som subtil tekst-lenke og hovedhandling som outline-knapp (`Endre nivå`, `Åpne modulen`, `Legg til regelverk`, `Aktiver`).
- Trust Profile viser `Gratis` / `inkludert i Core` istedenfor pris.

### Endringer

**`src/components/subscriptions/ModuleCard.tsx`**
- Bytt fra vertikal kort-layout til en horisontal rad: venstre kolonne (info, flex-1) og høyre kolonne (pris + handlinger, shrink-0, høyrejustert).
- Fjern det store fargede ikon-badgen — bruk kun tittel + pille(r) på topplinja for et strammere uttrykk.
- Flytt `priceLabel` (f.eks. "Inntil 50 systemer") opp til topplinja som en sekundær nøytral pille ved siden av statuspilla.
- Bygg om bruksvisning:
  - Core: valgfri `usageBar` (tall + tynn progress bar under beskrivelsen).
  - Andre moduler: enkel muted tekstlinje under beskrivelsen (`{usage} {usageSuffix}` eller `breakdown`-oppsummering som "3 aktive: GDPR, ISO 27001, Åpenhetsloven").
- Høyre kolonne: pris øverst, deretter en horisontal rad med `Avbestill` (ghost-lenke) + primær-handling (outline-knapp). Ved `included`: vis `Gratis` + `inkludert i Core` istedenfor pris.
- Fjern `MoreVertical` dropdown — `Avbestill` blir eksplisitt tekst-handling ved siden av knappen.
- Ved `inactive`: primær-knapp bruker `variant="default"` (fylt), som Partner-raden i referansen.

**`src/pages/Subscriptions.tsx`**
- Bytt `section className="grid ..."` til `section className="space-y-3"` slik at modulene stables.
- Tilpass `usageLimit`/`usage`-props så Core får progress-bar og de andre får den nye kompakte tekstlinja.
- Behold eksisterende dialoger, priser og totalsum uendret.

Ingen endringer i data, priser eller forretningslogikk — kun visuell omstrukturering av modulkortet og containeren.
