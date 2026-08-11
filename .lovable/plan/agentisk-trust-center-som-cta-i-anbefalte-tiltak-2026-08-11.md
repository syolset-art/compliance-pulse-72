# Agentisk Trust Center som CTA i "Anbefalte tiltak"

I dag er den eneste handlingen i kortet "Be om alt" — en engangsforespørsel per dokument. Den mangler den strategiske veien: å be leverandøren sette opp et **Agentisk Trust Center**, slik at dokumentasjon holdes løpende oppdatert og kunden (f.eks. Helse Vest IKT) slipper å purre hver gang.

## Hva som bygges

### 1. Ny primær CTA i kortet
I `VendorRecommendedActionsCard` blir "Be om alt" sekundær, og en ny primærknapp legges til:

- **"Inviter til Agentisk Trust Center"** (Lara-ikon + Sparkles)
- Kort forklaringslinje under nøkkeltallene når leverandøren ikke har trust center:
  "Leverandøren mangler Agentisk Trust Center — dokumentasjon må etterspørres manuelt."
- Har leverandøren allerede et aktivt trust center, byttes CTA-en ut med statusstripe: "Agentisk Trust Center aktivt · sist oppdatert <dato> · X av Y dokumenter levert" + knapp "Åpne trust center".

Samme CTA gjentas øverst i arbeidsvinduet (Sheet), over listen med tiltak.

### 2. Invitasjonsdialog (ny komponent)
`InviteAgenticTrustCenterDialog` — tre steg:

1. **Hva leverandøren får** — kort forklaring: eget trust center-rom, Lara ber om og validerer dokumentasjon, automatiske påminnelser før utløp, kunden trenger ikke purre.
2. **Kontaktpersoner** — primærkontakt forhåndsutfylt fra leverandørens `contactPerson`/`contactEmail`, med mulighet for å legge til flere brukere (navn, e-post, rolle: Eier / Bidragsyter / Kun lesetilgang). Eier er påkrevd.
3. **Dokumentasjon som etterspørres** — alle tiltak med `documentType` forhåndskrysset (med regelverksreferanse per linje, f.eks. "Databehandleravtale — GDPR art. 28"), frist og oppdateringsintervall (kvartalsvis / halvårlig / årlig), redigerbar meldingstekst.

Avslutning: bekreftelsesskjerm med lenke leverandøren mottar, og "Kopier lenke".

### 3. Status og oppfølging
- Etter invitasjon vises trust center-status i kortet (invitert / aktivt), med "Purr" og "Endre kontaktpersoner".
- Tiltak som dekkes av trust centeret merkes i arbeidsvinduet med en liten "Via Trust Center"-pille i stedet for "Be om dokumentasjon".

## Teknisk

- Ny fil: `src/components/asset-profile/guidance/InviteAgenticTrustCenterDialog.tsx`.
- Ny fil: `src/lib/agenticTrustCenter.ts` — typer (`AgenticTrustCenterState`, kontakter, forespurte dokumenttyper, intervall) samt les/skriv per `assetId`. Prototypenivå: `localStorage`, samme mønster som `readFrameworkState`/`writeFrameworkState` i `src/lib/vendorFrameworkSuggestions.ts`. Ingen databaseendringer i denne omgangen.
- `VendorRecommendedActionsCard.tsx`: ny CTA, statusstripe, `Via Trust Center`-merking; state løftes til `MynderGuidanceTab.tsx` som eier dialogen (som for `RequestUpdateDialog`).
- All tekst tospråklig via `isNb`-mønsteret som brukes i komponenten i dag.
- Ingen endringer i eksisterende `RequestUpdateDialog`-flyt — "Be om alt" fortsetter å virke som før.
