# Flytte rolleforklaring inn i info-ikon

## Mål
I partner-innstillingene (Tilgangsstyring) ligger det i dag tre åpne forklaringslinjer under brukerlista. De skal inn i ett info-ikon med tooltip, plassert ved overskriften "Brukere med tilgang til partnerdelen", slik at siden blir mindre forstyrrende.

## Endringsdetalj

**Fil:** `src/pages/MSPPartnerSettings.tsx`

1. Fjern den åpne forklaringsblokken nederst i "Brukere med tilgang til partnerdelen"-kortet (de tre `<p>`-elementene som viser Kundeansvarlig, Driftspartner og Tilgangsnivå).
2. Legg til et `Info`-ikon inline med kortets overskrift, til høyre for teksten "Brukere med tilgang til partnerdelen".
3. Vis de samme tre forklaringene i en tooltip/popover når brukeren hover/klikker info-ikonet.
4. Tekstene hentes fra eksisterende konstanter:
   - `PARTNER_ROLE_DESC.Kundeansvarlig`
   - `PARTNER_ROLE_DESC.Driftspartner`
   - `PARTNER_ACCESS_LABEL.write` / `PARTNER_ACCESS_LABEL.read`
5. Importer `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` fra `@/components/ui/tooltip` dersom de ikke allerede er tilgjengelige i filen.

## Akseptansekriterier
- Ingen åpen forklaringstekst under brukerlista.
- Info-ikonet er synlig ved overskriften og viser tooltip med Kundeansvarlig-, Driftspartner- og Tilgangsnivå-forklaringer.
- Typesjekk/build består.
- Eksisterende funksjonalitet for roller, omfang og invitasjon endres ikke.
