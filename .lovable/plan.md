# Avvikle en tjeneste: årsak og dataplan

Oppsigelse av en modul (f.eks. Mynder Core) skjer i dag via en enkel bekreftelsesdialog uten begrunnelse og uten informasjon om hva som skjer med kundens data. Denne planen erstatter den med en dedikert avviklingsdialog i to steg.

## Steg 1 — Hvorfor avvikler du?

- Én obligatorisk årsakskategori (radioliste, ett valg):
  - For dyrt
  - Bruker den ikke / lite verdi
  - Bytter til annen leverandør
  - Manglende funksjonalitet
  - Prosjekt/behov avsluttet
  - Annet
- Fritekstfelt (valgfritt, obligatorisk hvis «Annet» eller «Bytter til annen leverandør»).
- Valgfri konkurrentangivelse når «Bytter til annen leverandør» velges.
- Diskré linje: tilbakemeldingen brukes til produktforbedring og deles ikke eksternt.

## Steg 2 — Dine data

Kort, konkret oversikt over hva som skjer med dataene, uten juss-vegg:

- **Hva som avvikles:** Modulnavn, aktiv til {periodeslutt}, hva som blir utilgjengelig etter den datoen.
- **Datainventar for modulen:** antall poster per type (f.eks. systemer, avvik, behandlingsaktiviteter, dokumenter og samlet filstørrelse) slik at kunden ser hva som står på spill.
- **Tre valg, kunden må aktivt velge minst ett:**
  1. **Last ned nå** — samlet eksport (strukturerte data som CSV/JSON + dokumenter som ZIP). Startes fra dialogen, kunden får varsel når eksporten er klar.
  2. **Overfør til ny leverandør** — maskinlesbart eksportformat i tråd med retten til dataportabilitet; kunden oppgir mottakers e-post og får en tidsbegrenset nedlastingslenke.
  3. **Behold i 90 dager** — data ligger låst men intakt, slik at reaktivering gjenoppretter alt. Etter 90 dager slettes de permanent.
- **Slettefrist tydelig angitt:** dato for permanent sletting og at kunden kan be om sletting umiddelbart i stedet.
- Lenke til vilkår/personvern, ikke lang forklarende tekst.

## Bekreftelse

- Avslutningsknapp er inaktiv til årsak er valgt og et datavalg er gjort.
- Avkryssing: «Jeg forstår at {modul} blir utilgjengelig etter {dato} og at data slettes {slettedato}.»
- Etter bekreftelse: modulen får status «Sagt opp — aktiv til {dato}» (eksisterende `pending_cancellation`), toast med kvittering og «Angre oppsigelse».
- Angrer kunden oppsigelsen, avbrytes også den planlagte slettingen; allerede bestilt eksport beholdes.
- Mynder Core kan avvikles, men dialogen viser eksplisitt at avvikling av Core også avvikler modulene som ligger under den (systemer, avvik, behandlingsprotokoll, leverandør), med opptelling per modul.

## Teknisk

- Ny komponent `src/components/subscriptions/RetireModuleDialog.tsx` (to steg i én dialog, `Dialog` + intern stegstate) som erstatter dagens `AlertDialog` for `confirmDeactivate` i `src/pages/Subscriptions.tsx`.
- Utvid `src/lib/moduleActivationState.ts`: `cancelModule(id, meta)` lagrer `{ reason, reasonNote, competitor?, dataChoice, retentionUntil }` på `ModuleState`; `resumeModule` nullstiller feltene. Bakoverkompatibel lesing beholdes.
- Ny tabell `module_cancellations` i backend for revisjonsspor (org, modul, årsak, fritekst, datavalg, tidspunkt, effektiv dato, sletteforfall) med RLS + GRANT: eier-org leser/skriver egne rader, `service_role` full tilgang.
- Datainventar hentes med en enkel telling per modul (systemer, avvik, behandlingsaktiviteter, dokumenter) — vises som «n poster», ikke som liste.
- Eksport i steg 2 kjøres av en ny edge function `export-module-data` som samler tabelldata til JSON/CSV og dokumentreferanser, legger filen i en privat storage-bucket og returnerer en tidsbegrenset signert lenke.
- Overføringsvalget bruker samme eksport, men sender lenken på e-post til oppgitt mottaker via eksisterende e-postoppsett.
- Kortet i `ModuleCard.tsx` beholder dagens `pending_cancellation`-visning; ingen visuell endring utover at «Aktiv til {dato}» suppleres med sletteforfall i tooltip.
