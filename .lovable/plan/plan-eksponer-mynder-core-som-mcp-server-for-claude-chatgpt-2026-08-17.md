# Plan: Eksponer Mynder Core som MCP-server for Claude/ChatGPT

## Mål
Bygge en faktisk MCP-server for Mynder Core slik at du kan legge den til i Claude (eller andre MCP-klienter) og demonstrere at Mynder kan lese/skrive data fra en ekstern agent. Serveren skal bruke de fem verktøyene som allerede er forhåndsannonsert i appen.

## Autentisering
Siden du hoppet over spørsmålet, velger vi **OAuth 2.1 via Lovable Cloud-auth** som standard. Serveren krever pålogging, og hver klient kaller API-et som den påloggede brukeren. Dette er påkrevd fordi verktøyene leser leverandører, regelverk og aktiviteter som er knyttet til brukerens organisasjon (RLS-beskyttet data).

## Verktøy som eksponeres
1. `list_vendors` — les leverandører og kritikalitet.
2. `get_documentation_status` — les dokumentasjonsstatus per aktivert regelverk.
3. `create_activity` — opprett en aktivitet knyttet til en leverandør.
4. `list_requirements` — les krav og artikler i aktiverte regelverk.
5. `report_document_coverage` — rapporter dekningsgrad for dokumentasjon i egen infrastruktur (påvirker modenhet).

## Teknisk gjennomføring

### 1. Avhengigheter
- Installer `@lovable.dev/mcp-js` (zod finnes allerede).

### 2. MCP-kildekode
- Opprette `src/lib/mcp/tools/` med én fil per verktøy, som `defineTool` fra SDK.
- Opprette `src/lib/mcp/supabase.ts` med én felles klient-fabrikk:
  - `supabaseForUser(ctx)` — bruker det verifiserte bearer-tokenet fra MCP-konteksten, slik at RLS kjører som den påloggede brukeren.
  - `supabaseAnon()` — kun hvis vi senere legger til offentlige lese-verktøy.
- Opprette `src/lib/mcp/index.ts` som `defineMcp` med:
  - `name: "mynder-core"`, `title: "Mynder Core"`.
  - `instructions` på engelsk om hva verktøyene gjør.
  - `auth: auth.oauth.issuer(...)` satt til `https://yyvadlijsovebszximjv.supabase.co/auth/v1` (bygget fra `VITE_SUPABASE_PROJECT_ID`).
  - Referanse til alle fem verktøy.

### 3. Vite-plugin
- Legge `mcpPlugin()` fra `@lovable.dev/mcp-js/stacks/supabase/vite` inn i `vite.config.ts`.
- Plugin genererer `supabase/functions/mcp/index.ts` ved bygg; vi skriver ikke denne filen manuelt.

### 4. OAuth-samtykkeside
- Opprette `src/pages/OAuthConsent.tsx` og rute den på `/.lovable/oauth/consent`.
- Siden bruker `supabase.auth.oauth.*` for å hente detaljer, godkjenne eller avvise en autorisasjon, og sender brukeren tilbake til klienten.
- Sikre at uautentiserte brukere logges inn og returneres til det fulle consent-URL-et (også etter Google/sosial pålogging).
- Legge ruten inn i `App.tsx`.

### 5. Oppdatere app-UI
- Endre `mcpServerUrl()` i `src/lib/mcpAgentConnections.ts` til å returnere den faktiske Supabase Functions-URL-en (`https://<ref>.supabase.co/functions/v1/mcp`) når appen er publisert, eller opprettholde lokal fallback.
- Endre "Kommer"-badge i `McpDocumentDiscoveryPanel.tsx` til "Beta" / "Active" når serveren er klar.
- Vurdere om `McpAgentConnections.tsx` skal vise OAuth-status / deployment-status.

### 6. Manifest og deploy
- Kjøre `app_mcp_server--extract_mcp_manifest` for å generere `.lovable/mcp/manifest.json`.
- Kjøre `supabase--configure_oauth_server` for å aktivere OAuth 2.1 og DCR.
- Kjøre `supabase--deploy_edge_functions` med `function_names: ["mcp"]`.

### 7. Publisering
- Appen må publiseres for at Claude skal nå MCP-endepunktet på en offentlig URL.
- Etter publisering kan URL-en `https://<ref>.supabase.co/functions/v1/mcp` kopieres og legges inn i Claude Desktop / andre klienter.

## Kjente begrensninger
- Dette er en demoserver; ytelse og funksjonsomfang kan begrenses til les + én skriveoperasjon (`create_activity`).
- `report_document_coverage` vil i første omgang ta imot rådata og oppdatere modenhet manuelt, uten å analysere selve dokumentet (Lara-analysen skjer i appen, ikke via MCP).
- Det koster ikke penger å sette opp, men appen må publiseres for at eksterne klienter skal nå den.
