# Vis tilkoblede agenter med utløpsdato

Når du har opprettet en agentkobling, skal den dukke opp i en liste rett under toppseksjonen — med navn, status, sist brukt og utløpsdato (eller «Ingen utløp»).

I dag lages koden riktig og lagres, men siden viser ingen liste: listevisningen finnes i produktet, men er ikke plassert på siden.

## Slik gjør vi det

- Legg listen «Dine agenter» tilbake på MCP-integrasjonssiden, rett under toppkortet.
- Listen oppdateres automatisk med én gang en ny kode er laget, uten at du må laste siden på nytt.
- Utløpsdato vises alltid, også på mobil. Er koden laget uten utløp, står det «Ingen utløp».
- Status vises som «Aktiv», eller «Utløpt»/«Tilbakekalt» når koden ikke lenger gjelder.
- «Detaljer» åpner panelet der du ser tilgang og kan trekke tilbake koden.

## Teknisk

- `src/pages/Integrations.tsx`: rendre `ByoaConnectedStatus` med `tokens`, `onConnectAnother={openWizard}` og `onChanged={refreshTokens}` (event-lytteren på `AGENT_TOKENS_EVENT` finnes allerede).
- `ByoaConnectedStatus.tsx`: fjern `hidden md:table-cell` på utløpskolonnen, og utled statusbadge fra `isActiveToken` + `revoked_at`/`expires_at` i stedet for alltid «Aktiv».
- Nye tekstnøkler for «Utløpt»/«Tilbakekalt» i `nb.json` og `en.json`.
