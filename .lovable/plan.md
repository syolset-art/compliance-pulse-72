## Problem

I "Opprett tilbud"-dialogen er gap-seksjonen overlappende:

- **"Forhåndsvis"-knappen** i headeren åpner `MSPGapAnalysisDialog`, som kjører en ny gap-analyse. Det er feil – analysen er allerede gjort, og "forhåndsvisning" skal kun vise mangellisten.
- **Collapsible-raden "Vis hvilke mangler aktivitetene lukker"** viser nøyaktig den samme mangellisten – men gjemt bak et klikk.
- I tillegg ligger en **"Se hele gap-analysen →"**-lenke nederst som også åpner gap-analyse-dialogen.

Resultat: tre innganger til samme informasjon, og forhåndsvisning gjør noe annet enn brukeren forventer.

## Endring

I `src/components/msp/MSPCreateOfferDialog.tsx`, blokken `coveredGaps && totalGapCount > 0` (ca. linje 513–679):

1. **Fjern "Forhåndsvis"-knappen** i headeren (linje 549–551).
2. **Fjern Collapsible-wrapperen** (linje 586–665). Innholdet – framework-chip + status-linje, progress-bar, mangelliste (`<ul>` med checkboxes) og crosswalk-chips – beholdes, men rendres direkte under dekningsbanneret. Da er mangellisten alltid synlig = det er forhåndsvisningen.
3. **Fjern bunn-lenken "Se hele gap-analysen →"** (linje 667–675).
4. Behold header (tittel + snapshot-badge + "X mangler · Y lukkes"), "Legg ved som vedlegg i PDF"-bryteren, dekningsbanneret med "Velg alle/Fjern alle", og selve mangellisten.

Resultat: én sammenhengende, ryddig blokk – ingen dobbel innganger, ingen utilsiktet ny analyse.

## Filer som endres

- `src/components/msp/MSPCreateOfferDialog.tsx`

Ingen state- eller logikkendringer utover å fjerne `gapsExpanded`-bruken i denne blokken (state-variabelen kan fjernes hvis den ikke brukes andre steder).
