# Jobbe med dokumentasjon i regelverksvisningen

Målet: brukeren skal kunne laste opp bevis og se hvilke dokumenter som er aktuelle for det aktiverte regelverket — uten å endre dagens layout. Alt legges inn i felt som allerede finnes.

## Hva som endres (lite, additivt)

### 1. Én knapp i raden som allerede er der
Raden over kravlisten (den med "Bevis"-bryteren) får en `Last opp bevis`-knapp, og raden vises i begge grupperingene (i dag bare under "Grupper etter kontrollområde"). Ingen nye seksjoner, ingen flytting av eksisterende innhold.

### 2. Ett dokument kan treffe flere krav
Knappen åpner den samme analysedialogen som allerede brukes per krav (`AttachEvidenceDialog`), men i "regelverk-modus":
- Lara analyserer dokumentet mot alle krav i regelverket, ikke bare ett.
- Bekreftelsessteget viser en kort liste med foreslåtte krav (kravnavn + dekkede artikler + hake), forhåndsvalgt der treffet er sterkt.
- Bruker fjerner/legger til haker og bekrefter. Statusen oppdateres for de valgte kravene via samme logikk som i dag (`applyEvidenceAttachment`), så score/prosent oppdateres umiddelbart.

### 3. "Aktuelle dokumenter" i Bevis-visningen
Bevis-bryteren viser i dag bare opplastede dokumenter. Den utvides med en kompakt liste over forventet dokumentasjon for regelverket, gruppert per kontrollområde som nå, med tre tilstander per rad:
- `Mottatt` — dokument er lastet opp
- `Bekreftet av agent` — kundens agent har signalisert at dokumentet finnes (ingen fil lastet opp)
- `Mangler` — klikk går til kravet og åpner opplasting

Samme radhøyde og typografi som dagens dokumentrader; kun et statusmerke til høyre.

### 4. Agent-signal som bevis
Et signal fra kundens agent ("vi har dokument X") behandles som bevis uten fil: kravet får status som i dag ved egenrapportering, med kilde `Agent-bekreftet` i tooltip. Dette gir samme score-effekt som en egenrapportering, ikke som verifisert bevis — verifisert krever fil eller uavhengig part.

## Teknisk

- `src/components/regulations/FrameworkRequirementsList.tsx`: vis verktøyraden i begge grupperinger, legg til knapp + state for regelverk-nivå opplasting, og render "forventet dokumentasjon"-radene i eksisterende `docGroups`-seksjoner.
- `src/components/regulations/AttachEvidenceDialog.tsx`: valgfri `mode: "requirement" | "framework"` med kravliste inn og flervalg ut (`matchedRequirementIds`). Eksisterende bruk endres ikke.
- Ny liten hjelpefil for forventet dokumentasjon per krav/kontrollområde og agent-signaler (demo-data, samme mønster som dagens lib-filer). Ingen databaseendringer i dette steget.
- Full norsk/engelsk tekst via samme `isNb`-mønster som resten av filen.
