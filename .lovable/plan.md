# Navnefelt øverst i «Velg type eiendel»

Steget «Velg type eiendel» i dialogen for å legge til eiendel viser bare et rutenett med typer — det finnes ingen inndatafelt. Brukeren må klikke seg gjennom typevalg selv om de allerede vet hva eiendelen heter.

## Endring

Øverst i steget legges ett felt, samme mønster som «Legg til system»:

```text
 ✦  Skriv navnet på eiendelen, så gjør Lara resten
 ┌──────────────────────────────────────┐  ┌──────────────────┐
 │ F.eks. Slack, Dell Latitude, brannmur│  │ La Lara fylle ut │
 └──────────────────────────────────────┘  └──────────────────┘

 — eller velg type selv —
 [ Server ] [ System ] [ Enhet ] [ Nettverk ] ...
```

- Feltet er fokusert når steget åpnes; Enter utløser samme handling som knappen.
- Ved utfylt navn utleder Lara sannsynlig type fra navnet og hopper rett til det manuelle skjemaet med navn og type forhåndsutfylt, slik at brukeren bare bekrefter.
- Typerutenettet beholdes uendret under feltet som alternativ vei.
- Tomt felt: knappen er deaktivert, ingen endring i dagens flyt.

## Teknisk

- Kun `src/components/dialogs/AddAssetDialog.tsx`, funksjonen `renderSelectType`.
- Ny lokal state for navnetekst; ved innsending settes `selectedType` via eksisterende `handleTypeSelect`, navnet settes i skjemastate, og `setStep("manual-form")`.
- Typeutledning: enkel nøkkelordmatching mot `assetTypeTemplates` (navn/plural/type) med fallback til første tilgjengelige type; ingen nye API-kall.
- Tekster på nb/en med samme `isNb`-mønster som i `AddSystemDialog`. Ingen hardkodede fargeklasser, kun eksisterende tokens.
