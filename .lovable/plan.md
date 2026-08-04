# Kompakte produktkort i to kolonner

Produktsiden viser i dag hvert produkt som et bredt kort i full bredde. Kortene blir mindre og legges to og to ved siden av hverandre på desktop, ett og ett på mobil.

## Slik blir det

- Desktop: to kort per rad, like høye, med jevn avstand.
- Nettbrett: to kort per rad når det er plass, ellers ett.
- Mobil: ett kort per rad.
- Innholdet i hvert kort strammes opp så det passer i halv bredde: tittel og nivåmerke øverst, kort beskrivelse, forbrukslinje, og pris + knapper nederst i kortet i stedet for ute til høyre.
- Advarselen om oppbrukt plass ("Oppgrader"-boksen) beholdes, men som en tett linje nederst i kortet.
- Litt bredere sideinnhold slik at to kolonner får nok plass.

## Teknisk

- `src/pages/Subscriptions.tsx`: bytt produktseksjonen fra `space-y-3` til `grid gap-3 sm:grid-cols-2`, og øk container fra `max-w-5xl` til `max-w-6xl`. Ingen endring i logikk eller props.
- `src/components/subscriptions/ModuleCard.tsx`: gå fra horisontal `flex` (info venstre / pris høyre) til vertikal kolonne med `h-full` og `flex-col`, der pris og handlinger ligger i en bunnrad (`mt-auto`, pris til venstre, knapper til høyre). Redusert padding (`p-4`), mindre pristypografi, og fortsatt truncation av lange tekster.
- Ingen endringer i backend, priser eller flyter.
