# Datakilder og agenter

Siden heter i dag «Integrasjoner», men den dekker nå tre ulike ting: sky-kilder Mynder kobler til, en lokal agent (Sara) som kjører hos kunden, og agentkoblinger (MCP). Navnet og strukturen oppdateres slik at siden framstår agentisk: den handler om hvor Lara og Sara henter grunnlaget sitt fra, ikke om tekniske integrasjoner.

## Ny struktur (ovenfra og ned)

```text
Datakilder og agenter
├─ Header + tillitsgrense-panel   (Blir hos deg  |  Sendes til Mynder)
├─ 1. Lokal agent (Sara)          nedlasting, kjøreplan, status
├─ 2. Agentaktivitet              siste funn, hva venter på godkjenning
├─ 3. Tilkoblede kilder           det som er aktivt nå
├─ 4. Kildekart – hva Lara oppdager
│     Systemer · Leverandører · Dokumenter · Personer/tilganger
├─ 5. Neste steg fra Lara         hvilke kilder mangler for å dekke krav
└─ 6. Agentkoblinger (MCP)        uendret innhold, nederst
```

## 1. Navn og ingress

- Tittel: **Datakilder og agenter**. Ingress: kort om at Lara og Sara henter grunnlag herfra, og at du godkjenner før noe blir aktivt.
- Sidemeny og alle interne henvisninger får samme navn (norsk/engelsk: «Data sources and agents»).
- Ruten `/settings/integrations` beholdes, så eksisterende lenker og bokmerker virker.

## 2. Tillitsgrense øverst

Dagens sikkerhetsstripe erstattes av samme tillitsgrense som i Sara-modalen: to felt side ved side — «Blir hos deg» (dokumenter, filer, rådata) og «Sendes til Mynder» (funn, dekningsgrad, kravreferanse). Detaljene om kryptering, lesetilgang og godkjenning blir liggende bak «Mer info», som i dag. Antall aktive koblinger og oppdagede elementer blir stående synlig.

## 3. Lokal agent (Sara) — egen seksjon øverst

Eget kort før sky-kildene:

- Kort forklaring: Sara kjører i din egen infrastruktur, dokumentene forlater den aldri.
- Knapp «Last ned Sara» (åpner samme «kommer snart»-melding som i dag) og «Slik kommer du i gang» som åpner den eksisterende Sara-onboardingmodalen — samme komponent, ingen duplisert tekst.
- Statuslinje: ikke installert / installert, valgt kjøreplan (manuell eller ukentlig), sist kjørt.
- Dokumentkildene listes akkurat som i dag (Notion, SharePoint, Google Drive, Confluence, lokale mapper) — listen utvides ikke.

## 4. Agentaktivitet og siste funn

Kompakt liste over de siste hendelsene fra kilder og agenter: hva som ble oppdaget, fra hvilken kilde, når, og status (venter på godkjenning / godkjent). Tom tilstand: «Ingen funn ennå — koble til en kilde eller start Sara.» Data hentes fra de tilkoblede kildene som allerede finnes i sidens tilstand; ingen ny backend i denne omgangen.

## 5. Kildekart etter hva Lara oppdager

Filtrene endres fra leverandørkategori (identitet, produktivitet, sky …) til hva kilden gir Lara: **Systemer**, **Leverandører**, **Dokumenter**, **Personer og tilganger**. Søkefeltet beholdes. Kortene beholder dagens utseende, men kategoriteksten byttes ut med hva kilden oppdager. Gruppene «Tilkoblet», «Tilgjengelig nå» og «Planlagt» beholdes.

## 6. Neste steg fra Lara

Et kort under kildekartet som peker på hull: hvilke typer kilder som mangler for at Lara skal kunne dekke krav automatisk (for eksempel «Ingen dokumentkilde tilkoblet — Sara eller SharePoint dekker dokumentasjonskrav»). Forslagene utledes av hvilke kildetyper som allerede er tilkoblet.

## 7. MCP nederst

Agentkoblinger (MCP) blir liggende nederst som i dag, med uendret innhold og overskrift.

## Teknisk

- `src/pages/Integrations.tsx` omstruktureres; nye underkomponenter under `src/components/integrations/`: `LocalAgentCard.tsx`, `AgentActivityFeed.tsx`, `TrustBoundaryStrip.tsx`, `NextSourceSuggestions.tsx`.
- Sara-modalen gjenbrukes fra `src/components/regulations/SaraOnboardingDialog.tsx` (flyttes til `src/components/agents/` slik at både kravvisning og denne siden importerer samme sted).
- Filtrering på oppdagelsestype bruker `discovers`-feltet som allerede finnes i `src/lib/integrationCatalog.ts`; kategorifeltet beholdes i data, men vises ikke som filter.
- Sidenavn oppdateres i `src/components/Sidebar.tsx` og tilhørende oversettingsnøkler; `/settings/mcp`-redirecten beholdes.
- Ingen databaseendringer. Aktivitet og Sara-status holdes i sidens tilstand / eksisterende `useConnectedSources`.
