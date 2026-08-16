# Dokument hub: opplasting, veiledende dokumentasjon og MCP-demo

Tre nye evner i Dokument hub, alle demonstrerbare i prototypen.

## 1. Last opp dokument direkte i huben

- Knapp «Last opp dokument» i headeren ved siden av totalantallet.
- Dialog med: fil, visningsnavn, dokumenttype og valgfri kobling til modul/kontekst (Regelverk, Leverandør, Arbeidsområde eller «Ingen kontekst»).
- Filen lagres i `documents`-bøtta og raden i `uploaded_documents`, slik at den dukker opp i tabellen umiddelbart.
- Etter opplasting: en vennlig melding om at Lara kan analysere dokumentet for å finne hvilke krav det dekker — med to valg: «Analyser nå» eller «Gjør det senere». Velger man senere, får raden et diskret merke «Ikke analysert» og kan analyseres fra dokumentpanelet når som helst.
- «Analyser nå» kjører Lara-analysen (samme mønster som i Regelverk): dokumentet matches mot krav i aktiverte regelverk og får en dekningsgrad (0 / 0,5 / 1) per krav, som lagres som bevis og påvirker modenhet.

## 2. Arkfane «Veiledende dokumentasjon»

Huben får to faner: **Mine dokumenter** (dagens tabell) og **Veiledende dokumentasjon**.

- Fanen vises bare når kunden har aktiverte regelverk (f.eks. GDPR), og lister per regelverk hvilke dokumenter som forventes — f.eks. personvernerklæring, databehandleravtaler, ROS/DPIA, opplæringsbevis, hendelsesplan.
- Hver linje viser: dokumentnavn, hvilke kontrollområder/krav det treffer, forventet effekt på modenhet, og status «Finnes» / «Mangler» (matchet mot dokumenter huben allerede har).
- Mangler-linjer har «Last opp» som åpner samme dialog med typen forhåndsvalgt.

## 3. MCP: kartlegg dokumentasjon uten å laste den opp

Et eget, tydelig merket «Kommer»-panel nederst i Veiledende-fanen som demonstrerer arbeidsmåten:

- Forklaring: koble din egen agent til Mynder via en MCP-lenke, så kan agenten lese hvilke regelverk og krav som er aktivert her, lete opp tilsvarende dokumentasjon i deres egen infrastruktur, og bekrefte at den finnes — uten at dokumentene deles med eller lastes opp til Mynder.
- Agenten analyserer også kvaliteten lokalt: hvor mange av artiklene i et krav dokumentet faktisk treffer, og rapporterer dekningsgraden tilbake. Det påvirker modenhetsscoren på samme måte som et opplastet dokument.
- Panelet viser MCP-URL med kopier-knapp, listen over verktøy agenten får tilgang til (utvidet med lesing av krav/artikler og rapportering av dekning), og en lenke til eksisterende MCP-side. Demo-tilstand: en simulert agentkjøring som viser «3 dokumenter bekreftet i egen infrastruktur, 1 delvis dekning».

## Teknisk

- Ny `UploadHubDocumentDialog.tsx` under `src/components/documents/`, gjenbruker mønsteret fra `FrameworkDocumentsDialog` (Storage-bøtte `documents` + `uploaded_documents`).
- Ny `src/lib/guidingDocuments.ts` med katalog over veiledende dokumenter per regelverk (GDPR først, deretter NIS2/ISO), inkludert kravreferanser og vekt.
- Ny `GuidingDocumentsTab.tsx` og `McpDocumentDiscoveryPanel.tsx`; sistnevnte bruker `mcpServerUrl()` og `MCP_EXPOSED_TOOLS` fra `src/lib/mcpAgentConnections.ts` (utvides med to verktøy).
- Analyse skrives til `requirement_evidence` med `coverage_ratio`, slik at `useDocumentHub` og modenhetsberegningen plukker det opp uten endringer.
- Alt tekstinnhold i NO/EN via samme `L()`-mønster som i huben.
