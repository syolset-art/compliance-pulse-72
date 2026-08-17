# Plan: Naturlig plassering av MCP i plattformen — og teste demoen

## Hva finnes i dag
- MCP-serveren er bygget (5 verktøy: leverandører, krav, dokumentasjonsstatus, aktivitet, dekningsgrad) med OAuth-pålogging.
- Siden `Innstillinger → MCP-koblinger` finnes allerede (`/settings/mcp`), men den er halvskjult: ingen lenke i menyen, og innholdet er en prototype lagret lokalt i nettleseren.
- Et infopanel om MCP ligger inne på dokumentsiden.

## Anbefalt plassering
MCP hører hjemme to steder, med ett tydelig «hjem»:

1. **Hjem (der alt om MCP samles): Innstillinger → Integrasjoner → Agentkoblinger (MCP)**
   Dette er stedet der du kobler Mynder til noe utenfor Mynder, på linje med andre integrasjoner. Her ligger:
   - Serveradressen som limes inn i Claude/ChatGPT, med kopiknapp
   - Steg-for-steg oppkobling for Claude Desktop / ChatGPT / Cursor
   - Liste over verktøy agenten får tilgang til, med hva de leser og skriver
   - Status: er serveren publisert og klar, hvem har koblet seg til sist
   - Tydelig sikkerhetsavsnitt: agenten ser kun det den påloggede brukeren har tilgang til

2. **Inngang der brukeren faktisk trenger det: Dokumentasjon / kravområder**
   Det korte panelet «Kartlegg dokumentasjon uten å laste den opp» blir stående, men strammes inn til en kort forklaring + knapp «Koble til din agent» som går til hjemmet i innstillinger. Ingen duplisert informasjon.

Ikke eget menypunkt i hovedmenyen: MCP er en oppkobling, ikke en modul.

## Det som bygges

### 1. Ny MCP-side i innstillinger
Bygger om `/settings/mcp` til en ryddig side i tre deler:
- **Koble til**: serveradresse, kopiknapp, og fanevalg med ferdig oppsett for Claude, ChatGPT og Cursor (inkludert JSON-snutt som kan kopieres).
- **Verktøy**: de fem verktøyene listet med lesende/skrivende merke og én setning hver.
- **Tilgang og sikkerhet**: hvordan pålogging fungerer, at ingen dokumenter lastes opp til Mynder, og hvordan man kobler fra.

### 2. Synlig inngang
- Lenke til siden fra Innstillinger-oversikten under Integrasjoner.
- Panelet på dokumentsiden reduseres til kort tekst + lenke.

### 3. Test av demoen
For at Claude skal nå serveren må appen publiseres. Etter publisering:
- Kopier serveradressen fra den nye siden
- Legg den inn som «Custom connector» i Claude
- Logg inn med Mynder-brukeren din i samtykkevinduet
- Be Claude om «list vendors» for å bekrefte at koblingen virker

Jeg verifiserer at serveren svarer riktig før du prøver i Claude.

## Teknisk
- Skriver om `src/pages/McpAgentConnections.tsx` til seksjonene over; beholder ruten `/settings/mcp`.
- Bruker `mcpServerUrl()` og `MCP_EXPOSED_TOOLS` fra `src/lib/mcpAgentConnections.ts`, utvider verktøylisten med lese/skrive-flagg og beskrivelse.
- Legger inn lenke i innstillingsoversikten.
- Strammer inn `McpDocumentDiscoveryPanel.tsx`.
- Alt tekst på norsk/engelsk etter valgt språk, som ellers i appen.
