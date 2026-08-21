# Agent-levert dokumentasjon på krav — med godkjenning (EU AI Act-demo)

I dag vises bare en «AUTO»-badge på krav. Det er ikke synlig at dokumentasjon er levert av en agent i kundens egen infrastruktur (Sara eller kundens egen agent via MCP), hvem som leverte, hvor dokumentet ligger — eller om funnet er godkjent. Dette bygger vi nå som en synlig, deterministisk demo på EU AI Act.

## Ny datamodell (prototype, ingen databaseendring)

Ny fil `src/lib/agentRequirementFindings.ts`:
- `AgentRequirementFinding`: requirementId, agentName, channel («sara» lokal agent | «mcp» kundens egen agent), source (navn og sted, f.eks. «Notion / AI-styring / Risikostyringssystem»), documentId, hash, agentVersion, deliveredAt, samt `approval`: «pre_approved_at_source» | «awaiting_approval».
- Demofunn knyttet til EU AI Act-krav (AIACT-Art9, Art11, Art13, Art72):
  - **Art 9 Risikostyring** — levert av Sara, godkjent hos kunde før innsending → grønn/bekreftet.
  - **Art 11 Teknisk dokumentasjon** — levert av kundens egen agent via MCP, **mangler godkjenning** → tydelig varseltilstand.
  - **Art 13 Transparens** — levert av Sara, mangler godkjenning.
  - **Art 72 Markedsovervåking** — levert via MCP, godkjent hos kunde.
- Godkjenn/avvis lagres i localStorage (`mynder.agentFindings.decisions`) med dato, slik at tilstanden overlever refresh — samme mønster som øvrig Sara-prototyping.

## UI-endringer i `FrameworkRequirementsList.tsx`

**Kollapset rad** — for krav med agentfunn erstattes den nøytrale «AUTO»-badgen med:
- Agent-chip: SaraIcon/Bot + agentnavn (f.eks. «Sara» / «Kundens agent»), tooltip: «Dokumentasjon levert fra kundens infrastruktur via MCP — Notion / AI-styring / …».
- Ved manglende godkjenning: egen gul chip «Venter godkjenning» (Clock-ikon) — synlig uten å ekspandere.

**Ekspandert visning** — nytt kort øverst, `src/components/regulations/AgentFindingCard.tsx`:
- Header: agentnavn + kanal («Sara — lokal agent» / «Kundens agent via MCP»).
- Kildelinje: navn og sted på dokumentet + dokument-ID, hash, agentversjon og tidspunkt (samme metadata som SaraActivityLogDialog).
- Godkjenningsseksjon med tre tilstander:
  - *Godkjent hos kunde*: grønn merking «Godkjent i kundens system før innsending» — ingen handling nødvendig.
  - *Venter godkjenning*: gul boks «Funnet er ikke godkjent ennå og teller ikke som dokumentasjon» + knappene **Godkjenn funn** og **Avvis**.
  - *Godkjent i Mynder*: «Godkjent av deg, <dato>» etter at brukeren har trykket.
- Avvist funn: status faller tilbake til ikke oppfylt, med notat om avvisning.

## Statusintegrasjon

- Godkjente funn (både forhåndsgodkjente og godkjent i Mynder) speiles som `fulfilled` — samme mekanisme som dagens `agentConfirmed` i `generateUiStates`.
- Funn som venter på godkjenning teller **ikke** som oppfylt; kravet vises som «Venter godkjenning» i stedet.
- Eksisterende «agent»-filter i dokumentasjonsfanen skal også telle disse funnene.

## Teknisk

- Berørte filer: ny `src/lib/agentRequirementFindings.ts`, ny `src/components/regulations/AgentFindingCard.tsx`, endringer i `src/components/regulations/FrameworkRequirementsList.tsx` (chip i rad + kort i ekspandert visning + statusutledning).
- Gjenbruker `SaraIcon`, eksisterende tooltip/chip-mønster og localStorage-mønster fra `saraAgent.ts`.
- Norsk og engelsk tekst.
- Ingen databaseendringer, ingen endring i MCP-serveren — dette er ren UI/datamodell-demo på eksisterende kravdata.
- Verifisering: åpne EU AI Act i `/regulations`, sjekke de fire tilstandene, godkjenne et ventende funn og se at kravet blir oppfylt og tilstanden overlever refresh.
