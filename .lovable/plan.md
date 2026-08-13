# Bytt plass på GDPR-rolle og Prioritet i VendorUsageTab

## Mål
I leverandørprofilen under fanen "Bruk" skal kortene vises i rekkefølgen: **Kritikalitet → Prioritet → GDPR-rolle** (i dag står GDPR-rolle før Prioritet).

## Gjennomføring
1. I `src/components/asset-profile/tabs/VendorUsageTab.tsx` flyttes `Card`-blokken for **Prioritet** (linje ~345) opp før `Card`-blokken for **GDPR-rolle** (linje ~250).
2. Ingen endring i logikk, state, oversettelser eller interaksjoner – kun rekkefølgen på de to React-komponentene i grid.
3. Grid-oppsettet (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) beholdes, da det allerede støtter opptil fire kort og nå bare inneholder tre.

## Verifisering
- Forhåndsvis fanen for en leverandør og bekreft at "Prioritet" står til venstre for "GDPR-rolle".
- Bekreft at select-boksene, hover-ikoner og lagring fortsatt fungerer som før.