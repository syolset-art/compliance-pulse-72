# Pin på alle regelverk

Pin finnes i dag bare på radene i regelverkslisten og i agenttabellen, og verdiene kommer fra en hash-basert mock som gir tilfeldige resultater. Når du åpner «Rediger aktive regelverk» for å legge til et regelverk, vises ingen Pin i det hele tatt.

## Slik blir det

- Hvert regelverk i katalogen (alle ~28, ikke bare GDPR/NIS2/AI Act) får sin egen faste Pin med realistiske verdier — ikke tilfeldig oppslag. De fleste får ærlige, lave verdier («ukjent kilde», «ikke attestert»), noen få offisielle konsoliderte kilder får høy kvalitet, og ett eksempel vises som «Pin falt».
- Pin vises der brukeren velger regelverk:
  - I dialogen «Rediger aktive regelverk» — et lite merke ved siden av hvert regelverksnavn i listen, slik at kvaliteten er synlig før aktivering.
  - I regelverkskortet/detaljvisningen for et enkelt regelverk, med full firedimensjonsvisning (kilde, attestering, ferskhet, autoritet).
  - I chip-velgeren og i bulk-aktiveringsdialogen, som kompakt prikk-merke.
- Klikk/hover på merket åpner samme forklaringspopup som i dag, som beskriver hva Pin betyr og hvorfor det ikke er en sperre: alt kan aktiveres, men kvaliteten er synlig og styrer hva Lara får lov til å gjøre med innholdet.
- En kort forklaringslinje øverst i «Rediger aktive regelverk»: «Pin viser kilde og kvalitet på regelverksdataene.»

## Teknisk

- `src/lib/pin.ts`: ny `PIN_BY_FRAMEWORK: Record<string, Pin>` med én oppføring per id i `frameworkDefinitions` (gdpr, iso27001, nis2, dora, cra, ai-act, iso42001, csrd, nsm-grunnprinsipper, …). `getMockPin(key)` slår opp direkte i dette kartet først og faller tilbake til dagens deterministiske pool for ikke-regelverk (agenter).
- `src/components/pin/PinBadge.tsx`: legg til `size="xs"`-variant (kun ikon + prikk) for tette lister; ingen endring i standardvisningen.
- `EditActiveFrameworksDialog.tsx`, `FrameworkChipSelector.tsx`, `BulkFrameworkActivationDialog.tsx`: rendre `<PinBadge pin={getMockPin(fw.id)} />` ved siden av navnet.
- `FrameworkDetailCard.tsx` (og regelverkets detaljside): `PinDetails` i en egen liten seksjon «Kilde og kvalitet».
- Ingen backend- eller skjemaendringer; Pin-data er fortsatt mock i frontend.
