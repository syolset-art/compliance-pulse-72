# Lik høyde på kontekstkortene (Bruk og kontekst)

De to kortene ved siden av hverandre (venstre: Kritikalitet/Prioritet/Risikonivå — høyre: GDPR-rolle/Relasjonskategori/Hva brukes leverandøren til) har i dag ulik høyde fordi griden bruker `items-start` og kortene tilpasser seg innholdet. Målet er at de alltid fyller samme høyde, uansett innhold, slik at UI-et ser ryddig ut.

## Hva som endres

1. Griden i fanen strekker begge kolonnene til samme høyde i stedet for å toppjustere dem.
2. Venstre kort (pill-kortet) fyller hele kolonnehøyden, med pillene øverst og eventuelt utvidet panel under.
3. Høyre kort (bruksbeskrivelsen) fyller også hele kolonnehøyden, slik at tekstområdet vokser i stedet for å etterlate tomrom.
4. På mobil/brett (én kolonne) beholdes naturlig høyde — fast lik høyde gjelder kun når kortene står side om side.

## Teknisk

- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: bytt `items-start` til `items-stretch` på grid-wrapperen rundt `ContextPillRow` og `VendorPurposeCard`.
- `src/components/asset-profile/usage/ContextPillRow.tsx`: legg til `h-full` på `Card` og `flex flex-col` på `CardContent` (kun i ikke-`bare`-modus), slik at kortet strekker seg.
- `src/components/asset-profile/usage/VendorPurposeCard.tsx`: `h-full` på `Card` og `flex flex-col` på innholdet slik at bruksbeskrivelsen tar restplassen.
- Ingen endring i logikk, data eller tekster.
