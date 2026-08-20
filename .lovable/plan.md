# Etter "Godta alle" — bekreftet tilstand og neste steg

I dag lagrer "Godta alle" verdiene (kritikalitet, GDPR-rolle, risiko, bruksmerker, bruksformål), men banneret ser helt likt ut etterpå. Brukeren får ingen bekreftelse på at noe skjedde, og ingen retning videre.

## Ny oppførsel

Når brukeren trykker "Godta alle" bytter Lara-banneret fra forslagstilstand til **bekreftet tilstand**:

1. Kort bekreftelse: "Laras forslag er tatt i bruk" med tidspunkt.
2. Kompakt liste over hva som faktisk ble satt — kritikalitet, GDPR-rolle, risikonivå, bruksmerker og bruksformål — slik at endringen er sporbar.
3. "Angre"-knapp som tilbakestiller til verdiene som gjaldt før godkjenningen (kun i samme økt).
4. Neste naturlige steg som én tydelig CTA, valgt ut fra hva som faktisk mangler på leverandøren:
   - mangler databehandleravtale og GDPR-rolle er databehandler → "Legg til databehandleravtale" (Dokumentasjon-fanen)
   - kritikalitet Høy og ingen risikovurdering → "Gjør risikovurdering"
   - ellers → "Se leverandørens dokumentasjon"
5. Under CTA-en en rolig linje: brukeren kan alltid overstyre feltene manuelt i pillene under. Verdiene forblir redigerbare som i dag.

Bekreftet tilstand vises så lenge de lagrede verdiene fortsatt matcher Laras forslag. Endrer brukeren ett felt manuelt, går banneret tilbake til forslagstilstand for det som avviker — konsistent med at AI foreslår og brukeren bestemmer.

Alt på norsk og engelsk.

## Teknisk

- `src/components/asset-profile/usage/LaraContextBanner.tsx`: ny `accepted`-tilstand med props for anvendte verdier, tidspunkt, `onUndo` og neste-steg-CTA. Samme kortformat og farger som i dag, ikke et nytt stort panel.
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: `handleAcceptAll` tar vare på forrige verdier for angre, setter `acceptedAt`, og beregner neste steg fra `asset.has_dpa`, `gdpr_role`, `criticality` og eksisterende risikovurdering. Sammenligner lagrede verdier mot `contextSuggestion` for å avgjøre om bekreftet tilstand skal vises.
- Ingen databaseendringer; angre-tilstand holdes i komponenten.
