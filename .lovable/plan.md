## Mål
Etter at brukeren har svart på Lara-veiviseren (kundetyper, domener, modell, modenhet), skal **forslagslisten med tilpasningsmulighet være standard landingsside** på tjenestesiden — ikke en mellomtilstand som forsvinner ved første "Legg til i katalog". Slik blir det enklere å se og finjustere tjenestene før de blir en del av katalogen.

## Endring i flyt

I dag:
1. Wizard → forslag vises midlertidig over (tom) katalog
2. Bruker trykker "Legg til i katalog" → forslag forsvinner, kun lagt-til tjenester vises

Ny flyt:
1. Wizard → forslag rendres som **hovedinnhold** ("Tilpass før import"-modus) — fyller hele tjenestesiden
2. Bruker kan toggle synlighet, redigere, fjerne forslag i listen før import
3. Først når bruker eksplisitt trykker "Importer valgte til katalog" → tjenestene flyttes til katalogen og forslag-modus avsluttes
4. Bruker kan også **forkaste forslag** for å gå direkte til (tom) katalog

## UI-endringer

### `MSPServiceCatalogTab.tsx`
- Når `suggestions` er satt: **skjul stats-rad og top action-rad**. Vis kun forslag-visningen som primær landing.
- Legg til en tydelig **header over forslagsvisningen**: "Lara har skreddersydd N tjenester — tilpass før du importerer". Med sekundærknapp "Start på nytt" (åpner wizard igjen) og "Forkast alle".
- Etter import: vis katalog + stats som før.

### `MSPLaraServiceSuggestions.tsx`
Utvid hvert forslagskort med samme redigeringsmuligheter som i katalogen, slik at brukeren faktisk kan **tilpasse før import**:
- **Synlighets-toggle** (Eye/EyeOff + Switch) per forslag — `publishedToCustomers` settes per kort, beholdes ved import.
- **Rediger-knapp** (Pencil) per forslag → åpner inline `ServiceForm` (samme komponent som i katalogen) for å endre navn, beskrivelse, sjekkliste, rammeverk, pris.
- **Fjern-knapp** (X) per forslag → fjerner forslaget fra listen helt.
- Sticky bottom-bar oppdateres: knappetekst endres fra "Legg til i katalog" → **"Importer N tjenester til katalog"**, og "Tilpass før import" fjernes (siden hele visningen nå ER tilpassings-modus). Beholder "Forkast"-knapp som alternativ til import.

### Wizard-trigger
- "Lara: foreslå flere"-knappen i toppen av katalogen (når katalog ikke er tom) skal også sende resultatet til samme forslag-visning — dvs. den blir igjen primær landing til brukeren importerer eller forkaster.

## Filer som endres
- `src/components/msp/MSPServiceCatalogTab.tsx` — skjul stats + action-rad i forslag-modus, legg til header for forslagsvisning, oppdater state-flyt for import/forkast.
- `src/components/msp/MSPLaraServiceSuggestions.tsx` — legg til synlighets-toggle, rediger-knapp (inline ServiceForm), fjern-knapp per forslag. Oppdater sticky bottom-bar.
- Trekk `ServiceForm` ut av `MSPServiceCatalogTab.tsx` til egen fil `src/components/msp/ServiceForm.tsx` så den kan gjenbrukes i forslagsvisningen.

## Hva som IKKE endres
- Datamodellen (`PartnerService`) er uendret.
- Wizard-spørsmål og `suggestServices`-logikk uendret.
- Eksisterende katalog-visning, stats-kort og kortdesign uendret.
- Ingen nye dependencies eller designtokens.

Resultat: Etter wizarden lander brukeren rett i en redigerbar liste der hvert Lara-forslag kan toggles, redigeres eller fjernes før de eksplisitt importeres. Det blir den naturlige "arbeidsbenken" på tjenestesiden inntil katalogen er bekreftet.