## Bakgrunn
Brukeren ønsker å beholde dagens modenhetsvisning (5 kontrollområder med prosent og fremdriftslinjer, Trust Score) i baseline-kortet på kundevdetail-siden, men de to handlingsknappene nederst tar for mye plass.

## Mål
Redusere visuelt fotavtrykk for knappene "Fortsett kartlegging" / "Med kunden" / "Fyll ut sammen med kunden" i `src/pages/MSPCustomerDetail.tsx` (området rundt linje 454–472).

## Endringsforslag
1. **Behold modenhetsvisningen uendret** (linjer 425–452).
2. **Komprimer knapperaden**:
   - Reduser eller fjern top-padding (`pt-1`) og gap mellom knappene.
   - Bruk en mer kompakt knappestil, f.eks. `h-7`/`h-8` med `px-2`/`px-3` og `text-xs`.
   - Vurder å forkorte teksten til "Fortsett" / "Med kunden" (allerede kort variant) eller bruke ikon + tooltip for den minste varianten.
   - Alternativ: Legg knappene i en knappegruppe (`ButtonGroup`/`SegmentedControl`) for å spare horisontal plass.
3. **Oppdater i18n-nøkler** kun hvis tekstendres.

## Akseptansekriterier
- Modenhetsvisningen (5 områder + Trust Score) ser identisk ut.
- Knappene tar mindre vertikal/horisontal plass.
- Begge handlingene (partner-modus og møte-modus) er fortsatt tilgjengelige og klikkbare.
- Drawer for baseline åpnes med samme funksjonalitet som i dag.