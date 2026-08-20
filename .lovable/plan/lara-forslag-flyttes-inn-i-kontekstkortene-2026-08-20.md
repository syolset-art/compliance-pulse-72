# Lara-forslag flyttes inn i kontekstkortene

Det brede Lara-banneret over de to kortene fjernes. I stedet får hvert felt i de to kortene sitt eget forslag fra Lara, som brukeren kan godkjenne eller redigere — alltid med en kort begrunnelse.

## Hva som endres

1. Banneret «Lara foreslår …» over kortene fjernes helt (inkludert bekreftet-tilstand, «Godta alle» og «Angre»).
2. Hver pille i venstre kort (Kritikalitet, Prioritet, Risikonivå) og høyre kort (GDPR-rolle, Relasjonskategori) viser en Lara-linje når verdien avviker fra forslaget eller ikke er satt:
   - Lara-ikon + «Forslag: <verdi>»
   - én linje begrunnelse (hvorfor Lara foreslår dette — bransje, personvernerklæring, beskrivelse, datakategorier)
   - «Godkjenn»-knapp som setter verdien, og nedtrekksfeltet ved siden av for å redigere/velge noe annet
3. Når brukeren har godkjent eller overstyrt: linjen erstattes av en dempet bekreftelse («Godkjent av <navn>» / «Satt manuelt av <navn>»), slik som risikofeltet gjør i dag.
4. «Hva brukes leverandøren til» i høyre kort beholder dagens Lara-forslag med godkjenn/rediger, men får samme begrunnelseslinje som pillene.
5. Kortene beholder lik høyde og responsiv oppførsel fra forrige endring.

## Teknisk

- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: fjern `LaraContextBanner`-import og bruk (linje 21 og 931–944), samt tilhørende tilstand som blir ubrukt (`suggestionApplied`, `acceptedAt`, `appliedItems`, `nextStep`, `preAcceptSnapshot`, `handleAcceptAll`, `handleUndoAccept`) hvis den ikke brukes andre steder.
- Ny liten delkomponent `src/components/asset-profile/usage/LaraFieldSuggestion.tsx`: props `isNb`, `suggestedLabel`, `reason`, `approvedBy`, `approvedAt`, `onApprove`. Rendrer Lara-ikon, forslag, begrunnelse og «Godkjenn»-knapp — eller bekreftelseslinjen.
- Bruk komponenten i panelene for `criticality`, `priority`, `risk`, `gdpr` og `relation` i `pillItems`. Forslagsverdiene finnes allerede i `contextSuggestion` (kritikalitet, GDPR-rolle, bruksformål), `riskSuggestion` (nivå + `reasons`/`reasonsEn`) og `relationSuggestion`.
- Begrunnelser: gjenbruk `riskSuggestion.reasons`, og utled korte begrunnelser for kritikalitet/prioritet/GDPR/relasjon fra kildene i `vendorContextSuggestion` (bransje, personvernerklæring, beskrivelse).
- `LaraContextBanner.tsx` slettes hvis ingen andre filer importerer den.
- Ingen endringer i datamodell eller lagringslogikk — samme `handleFieldChange` / `handleManualRiskChange` / `handleGdprRoleChange` brukes.
