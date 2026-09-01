# Ny, profesjonell side for agenttilkobling (MCP)

Målet: `/settings/integrations` skal se ut som en ferdig produktside der kunden på under ett minutt kobler én eller flere egne agenter til Mynder — med tydelig pedagogikk om at Claude-connector kommer, og at manuell URL + personlig kode er veien inntil da.

## Ny sidestruktur (topp til bunn)

1. **Hero / statuslinje**
   - Tittel «Koble din agent til Mynder», én kort ingress i klarspråk.
   - Primær CTA «Koble til agent» (åpner veiviseren) + sekundær «Se hva agenten får tilgang til».
   - Statuspille til høyre: «Ingen agenter tilkoblet» eller «N agenter aktive».
   - Illustrasjon beholdes, men strammere (mindre høyde, semantiske tokens).

2. **Slik fungerer det — 3 steg** (alltid synlig, ikoner + kort tekst)
   - 1) Lag en personlig kode i Mynder → 2) Lim inn adresse og kode i agenten din → 3) Be agenten om en plan for kontinuerlig etterlevelse.

3. **Dine agenter** (kompakt tabell, alltid synlig — tom tilstand med kort forklaring og CTA)
   - Kolonner: Agent, Status, Sist brukt, Utløper, Handling (Detaljer).
   - Detaljer/tilgang/tilbaketrekking i eksisterende sidepanel.

4. **Klientkort** (Claude, ChatGPT, Andre/MCP-klient)
   - Hvert kort: logotype/ikon, ett linjes beskrivelse, badge «Manuell tilkobling» og notat «Ett-klikks connector i Claude kommer — inntil da kobler du til med adresse og kode».
   - Klikk på kort åpner veiviseren forhåndsvalgt på den klienten.

5. **Kollapsede seksjoner nederst** (uendret prinsipp: less is more)
   - «Hva agenten kan gjøre for deg» (CapabilityList)
   - «Slik kommer du i gang» (prompt-forslag)
   - «For utviklere» (endepunkt, transport, verktøynavn)

## Veiviseren (ByoaConnectWizard) — pedagogiske forbedringer

- Beholder 3 trinn, men får tydeligere kopi:
  - Trinn 1: velg klient + navn på agenten (f.eks. «Claude – Synnøve»).
  - Trinn 2: velg varighet (30/90 dager/aldri) og lag kode. Koden vises én gang, med tydelig advarsel og kopiknapp.
  - Trinn 3: klientspesifikk oppskrift med nummererte punkter og skjermnære formuleringer («Åpne Innstillinger → Connectors → Legg til egendefinert connector»), kopiknapper for adresse, kode og JSON-snutt.
- Ny infoboks i trinn 3: «Når Claude-connectoren er live, trykker du bare Koble til og logger inn med Mynder-kontoen din. Fram til da bruker du adressen og koden over.»
- Avslutning: «Ferdig»-tilstand med testforslag — en ferdig prompt brukeren kan lime inn for å bekrefte at koblingen virker («Hvilke leverandører har jeg i Mynder?»).

## Teknisk

- Ingen backend-endringer. `agentTokens.ts`, `create-agent-code` og `mcpServerUrl()` brukes som i dag.
- Filer som endres: `src/pages/Integrations.tsx` (ny layout), `src/components/integrations/ByoaAgentHero.tsx` (erstattes av ny hero + stegstripe), `ByoaConnectedStatus.tsx` (tabellvisning + tom tilstand), `ByoaConnectWizard.tsx` (kopi/tekst og klientforvalg), ny `ClientPickerCards.tsx`.
- Alle strenger via i18next i `nb.json`/`en.json`. Kun semantiske design-tokens, ingen hardkodede farger.
- Mobilvennlig: kortene stables, tabellen faller tilbake til liste under `sm`.
