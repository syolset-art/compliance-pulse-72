# Databehandler-info på MCP integrasjon-siden

Når en kunde kobler sin egen språkmodell (Claude, ChatGPT e.l.) til Mynder via MCP, er den KI-leverandøren **kundens egen leverandør** — ikke Mynders underdatabehandler. Dette står i gjeldende databehandleravtale (pkt. 7, siste avsnitt), men avtalen er ikke publisert i appen ennå, og siden «MCP integrasjon» sier ingenting om det.

## To endringer

### 1. Publiser databehandleravtalen som juridisk dokument

- Ny fil `src/content/legal/databehandleravtale-v1.ts` med innhold fra styrende Notion-dokument «Databehandleravtale — Mynder AS og sluttkunde» (aktiv versjon, sist oppdatert 11.09.2026), inkl. vedleggshenvisningene.
- Registreres i `src/content/legal/index.ts` med slug `databehandleravtale`, audience `customer` — da dukker den automatisk opp under Dokumenter (`/dokumenter/databehandleravtale`) og på `/dokumenter`.

### 2. Kort infolinje på «MCP integrasjon»-siden

- I `src/pages/Integrations.tsx`, nær agenttilkoblingen (under hero/veiviser), en diskret infoboks med info-ikon — ikke stort banner:
  - **NO:** «Kobler du din egen KI-tjeneste (f.eks. Claude eller ChatGPT) til Mynder, er den leverandøren din egen leverandør — ikke Mynders underdatabehandler. Mynder sørger for innlogging, avgrensning og logging frem til dataene leveres til agenten. Du har selv ansvar for avtalen med din KI-leverandør. Les mer i databehandleravtalen (punkt 7).»
  - Lenke «Les databehandleravtalen» → `/dokumenter/databehandleravtale`.
- Engelsk oversettelse i `en.json`.

## Teknisk

- Alle strenger via i18next (`nb.json`/`en.json`), nøkler under `byoa.dpa.*`.
- Semantiske design-tokens, ingen hardkodede farger. Infoboksen følger sidens eksisterende stil (muted bakgrunn, liten tekst).
- Ingen backend-endringer.
- Verifisering: typesjekk + Playwright-sjekk av `/settings/integrations` og `/dokumenter/databehandleravtale`.
