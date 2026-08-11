# Første steg: be om grunnlag når leverandøren er ny

Når en leverandør nettopp er lagt til finnes det verken bevis eller vurderingsgrunnlag. I dag møter brukeren likevel Laras oppgaveplan og «Anbefalte tiltak», selv om ingenting er etterspurt. Første steg skal i stedet være ett tydelig kort: *Vi mangler grunnlag fra <leverandør>* — med én knapp som åpner valg av innhentingsmetode.

## Slik skal det se ut

Øverst i «Veiledning fra Mynder», i stedet for oppgaveplanen:

```text
 ✦  LARA · NESTE STEG

 Vi mangler grunnlag fra BankID

 Gap-analyse og modenhetsvurdering krever bevis. Vi har ikke bedt
 leverandøren om det ennå — så det finnes ingenting å vurdere mot
 rammeverk enda. Start med å be om grunnlag. Lara forbereder utkast
 til vurdering automatisk når svaret kommer inn — du beslutter.

 [ Be om grunnlag → ]   Eller registrer bevis du allerede har fått på e-post
```

Kortet vises kun så lenge ingen innhenting er startet. Så snart en metode er valgt, forsvinner det og den vanlige veiledningen (oppgaveplan, tiltak, dokumentasjon) tar over.

## Når brukeren klikker «Be om grunnlag»

Det åpnes en dialog med de tre innhentingsmetodene som allerede er definert. Laras anbefaling ligger øverst, merket «Laras anbefaling» med kort begrunnelse (mandatstyrke og offentlig fotavtrykk):

1. **Kunde-drevet kartlegging** — agenten høster offentlige kilder. Ingen innsats fra leverandøren.
2. **Lettvekts leverandør-respons** — én e-post med vedlegg tilbake. Minimal innsats.
3. **Leverandør-eid agentisk profil** — leverandøren overtar profilen. Full deltakelse.

Hvert valg viser innsatsnivå og hvilket bevisnivå det gir. Ved bekreftelse:
- Kartlegging: Lara starter høsting, kortet erstattes av «Lara kartlegger offentlige kilder…».
- E-post: forespørsel sendes, status blir «venter på svar».
- Agentisk profil: eksisterende inviteringsdialog åpnes.

Sekundærlenken «registrer bevis du allerede har fått på e-post» åpner dagens dialog for å registrere mottatt dokumentasjon manuelt.

## Teknisk

- Ny komponent `src/components/asset-profile/guidance/RequestBaselineCard.tsx` — tom-tilstandskortet, bruker `LaraAvatar` og eksisterende Lara-banner-stil.
- Ny dialog `src/components/asset-profile/guidance/RequestBaselineDialog.tsx` — metodevalg bygget på `SOURCING_METHOD_META`, `SOURCING_METHOD_ORDER` og `recommendSourcingMethod` fra `src/lib/vendorSourcingMethod.ts`.
- `src/components/asset-profile/MynderGuidanceTab.tsx`: les `readSourcingState(assetId)`; når `method` er tom og trust center-status er `none`, render kortet og skjul `LaraRecommendationBanner` + `VendorRecommendedActionsCard`. Skriv valgt metode med `writeSourcingState`.
- `VendorRecommendedActionsCard.tsx`: fjern den nå overflødige tom-tilstanden for innhentingsmetode (arketype-velgeren beholdes som prototyp-bryter, men flyttes inn i det nye kortet slik at Microsoft / BankID / Helse Vest-leverandør viser ulik anbefaling).
- Alle tekster i nb/en, ingen hardkodede fargeklasser — kun eksisterende tokens.
