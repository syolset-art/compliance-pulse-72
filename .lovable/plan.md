# "Opprett aktivitet" i stedet for "Be om alt" — med MCP-datainnhenting

"Be om alt" erstattes av en bredere handling: **Opprett aktivitet**. Brukeren velger hvordan dokumentasjonen skal skaffes — inkludert å hente data om leverandøren fra egen infrastruktur via MCP-koblede agenter.

## 1. Ny knapp og dialog

I `VendorRecommendedActionsCard` (og i arbeidsvinduet) byttes "Be om alt" ut med **"Opprett aktivitet"**. Knappen åpner en ny dialog `CreateVendorActivityDialog` med fire valg:

1. **Be leverandøren om dokumentasjon** — dagens flyt (`RequestUpdateDialog`), uendret oppførsel.
2. **Hent data fra egen infrastruktur (MCP)** — Lara spør dine egne koblede agenter om leverandørdata dere allerede har (avtaler, fakturaer, systemeierskap, tidligere risikovurderinger).
3. **Registrer aktivitet manuelt** — oppgave med ansvarlig, frist og prioritet, koblet til valgte tiltak.
4. **Inviter til Agentisk Trust Profile** — snarvei til invitasjonsdialogen.

Alle valg viser hvilke tiltak/dokumenttyper som inngår (forhåndskrysset fra listen over anbefalte tiltak).

## 2. MCP-valget

Velges "Hent data fra egen infrastruktur":

- Har brukeren ingen MCP-koblinger: forklaringstekst + knapp **"Sett opp MCP-kobling"** som lenker til innstillingssiden.
- Har brukeren koblinger: liste over tilgjengelige agenter/kilder med avkrysning, valgte dokumenttyper, og knapp "Start innhenting". Resultatet vises som en Lara-aktivitet med status (prototype: simulert svar med funnet/ikke funnet per dokumenttype).

## 3. Ny side: MCP-tilkobling for egne agenter

Ny rute `/settings/mcp` ("Agentkoblinger (MCP)") lagt inn i integrasjonsområdet under Innstillinger:

- Kort forklaring på hva MCP er og hvorfor det er nyttig her.
- **Tilkoblingsinformasjon** brukeren kopierer inn i egen agent: server-URL for arbeidsområdet, autentiseringsmetode, og hvilke verktøy som eksponeres (les leverandører, les dokumentasjonsstatus, opprett aktivitet). Kopier-knapper på hvert felt.
- Liste over registrerte agentkoblinger med navn, status (aktiv / venter / feilet), sist brukt, og "Fjern".
- Dialog "Legg til agentkobling" (navn, URL, valgfri beskrivelse).
- Merknad om at koblingen er på prototypenivå og at faktisk kjøring kommer.

## Teknisk

- Nye filer:
  - `src/components/asset-profile/guidance/CreateVendorActivityDialog.tsx`
  - `src/pages/McpAgentConnections.tsx` + rute `/settings/mcp` i `src/App.tsx`
  - `src/lib/mcpAgentConnections.ts` — typer og les/skriv av koblinger (localStorage, samme prototypemønster som `agenticTrustCenter.ts`)
- `VendorRecommendedActionsCard.tsx`: `onRequestAllMissing` erstattes av `onCreateActivity`; `MynderGuidanceTab.tsx` eier den nye dialogen og videresender til eksisterende `RequestUpdateDialog` / invitasjonsdialog ved behov.
- Tospråklig tekst via `isNb`-mønsteret. Ingen databaseendringer.
