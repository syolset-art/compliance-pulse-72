# Legg til agentisk kilde (MCP) i «Tilknytt bevis»

## Mål
I dialogen «Tilknytt bevis» skal brukeren kunne velge mellom å laste opp en fil eller å hente beviset fra en agentisk kilde (MCP), for eksempel Notion, SharePoint eller Google Drive. Dokumentet blir liggende i kundens egen infrastruktur — Mynder får kun dekningsgraden.

## Slik blir flyten
1. Steg 1 i dialogen får to valg side om side:
   - «Last opp fil» (dagens dropsone)
   - «Hent fra agentisk kilde (MCP)» — ny knapp
2. Velger brukeren MCP, vises en liste over koblede kilder (lest fra dagens lokale MCP-koblinger). Hver kilde vises med navn og status.
   - Er ingen kilde koblet, vises en tom tilstand med knapp «Koble til kilde» som går til MCP-innstillingene, samt forslag til vanlige kilder (Notion, SharePoint, Google Drive, Confluence).
3. Brukeren velger kilde, agenten «søker» og analyserer mot kravets artikler (samme analyse-steg som i dag, med tydelig tekst om at dokumentet ikke lastes opp til Mynder).
4. Bekreft-steget gjenbrukes uendret: dekningsgrad, artikkelliste og bekreftelse. Beviset merkes med kilden (f.eks. «Notion») i stedet for filnavn, og med et lite MCP-ikon.

## Avgrensning
- Selve MCP-oppkoblingen mot Notion gjøres fortsatt i innstillinger for agentkoblinger; dialogen bare bruker og lenker dit.
- I første versjon simuleres agentsøket (samme demo-nivå som resten av MCP-funksjonaliteten); dekningsanalysen kjøres på metadata om kravet, ikke på selve filen.

## Teknisk
- `src/components/regulations/AttachEvidenceDialog.tsx`
  - Ny `sourceMode`-tilstand: `"upload" | "mcp"`, med kildevelger i select-fasen.
  - Ny handler `handleMcpSource(connection)` som setter fase til `analyzing` og deretter `review` med et `EvidenceDocument` uten `file`, hvor navn = dokumentnavn fra kilden og en ny markering for at kilden er ekstern.
  - `AttachEvidenceResult.file` er allerede valgfri, så kallere trenger ingen endring.
- `src/lib/mcpAgentConnections.ts`
  - Legg til en liten katalog med foreslåtte kilder (Notion, SharePoint, Google Drive, Confluence) med navn og standard-URL, brukt både i dialogen og i innstillingssiden.
- Tekster på norsk og engelsk følger dagens `isNb`-mønster i filen.
