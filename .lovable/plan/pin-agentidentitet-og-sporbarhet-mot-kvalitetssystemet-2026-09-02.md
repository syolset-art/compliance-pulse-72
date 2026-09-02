# Pin: agentidentitet og sporbarhet mot kvalitetssystemet

I dag sier hover-visningen bare «Agentverifisert · Verifisert av agentis runtime-rutine». Den viser ikke hvilken agent som verifiserte, og gir ingen referanse tilbake til Mynders kvalitetssystem. Målet er at Pin skal være etterprøvbar uten å avsløre IP.

## Slik blir det

Agentverifisert Pin viser i hover:

- **Verifisert av:** Regelverksagent · alias (f.eks. «LEX-3») — aldri modell, leverandør eller prompt.
- **Agent-ID:** en stabil, ikke-avslørende identifikator (f.eks. `agt_7f2c91`).
- **Kontrollrutine:** navn på rutinen i kvalitetssystemet, i klartekst men uten metode­detaljer (f.eks. «Kildesjekk og artikkelmapping, rutine QS-04»).
- **Sporingskode:** en kode som Mynder kan slå opp i kvalitetssystemet for å hente full valideringsdokumentasjon (f.eks. `QS-2026-LEX3-0442`), med kopier-knapp.
- Kort forklaringslinje: «Full dokumentasjon på valideringsprosessen kan fremlegges på forespørsel med denne koden.»

Menneskeverifisert Pin viser som i dag: «Verifisert av juridisk fagansvarlig», men får samme sporingskode-rad slik at begge typer kan spores tilbake til kvalitetssystemet.

Kilde og «Sist kontrollert» beholdes uendret. Disclaimeren nederst beholdes.

## Teknisk

- `src/lib/pin.ts`
  - Utvid `PinAttestationDimension` med `agentId?`, `agentAlias?`, `routineRef?` (rutinenavn/-nummer) og `traceCode?`.
  - Deterministiske generatorer: `agentId = agt_<stableHex(id,6)>`, `traceCode = QS-<år>-<alias>-<stableHex>`; alias tildeles fra en liten fast pool (LEX-1..LEX-4) per regelverks-id slik at samme regelverk alltid får samme agent.
  - `agentRecipe()` og `humanRecipe()` fyller feltene; menneskeverifisert får `traceCode` med prefiks `QS-<år>-JUR-…` og ingen agentfelt.
  - Nye labels: `AGENT_IDENTITY_NOTE` (IP-forklaringen) og radetiketter.
- `src/components/pin/PinBadge.tsx`: legg til radene «Agent», «Agent-ID», «Kontrollrutine», «Sporingskode» i tooltip-listen — kun agentradene når `level === "agent_verified"`. Sporingskode i monospace.
- `src/components/pin/PinDetails.tsx` (popover): samme felter, med kopier-knapp på sporingskoden.
- Ingen backend- eller skjemaendringer; Pin-data er fortsatt deterministisk mock i frontend.
