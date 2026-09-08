# Arbeidsområder som Core-landingsside: «Kartlegg KI-muligheter» som knapp + agenter på tvers av arbeidsområder

## Mål
Når brukeren åpner Core skal `/work-areas` oppleves som «slik er virksomheten organisert»: alle arbeidsområder, velg ett, se systemer, eiendeler, prosesser og KI-agenter som hører til – og én tydelig knapp for å kartlegge KI-muligheter. Ingen ny fane, ingen ny meny.

## Dagens tilstand (verifisert)
- `/work-areas` = kombiboks-velger (`WorkAreaSwitcher`) + seks faner, inkl. fanen «KI-muligheter» som monterer `AiOpportunitiesTab`.
- Valgt arbeidsområde er lokal state (ikke URL). Første område velges automatisk.
- Prosesser hører til ett arbeidsområde via `system_processes.system_id → systems.work_area_id`. `process_agent_recommendations` har både `process_id` og `work_area_id`.
- KI-agenter (`useAgents`/`agentMacf`) er ren prototype i localStorage og har i dag ingen kobling til prosesser eller arbeidsområder.
- Plassholdere: fanebadge «Prosesser» viser hardkodet 110, velgeren viser hardkodet «10» systemer.

## Reflektert modell: kan en agent høre til flere arbeidsområder?
Tre modeller vurdert:

| Modell | Beskrivelse | Vurdering |
|---|---|---|
| A. Agent eies av ett arbeidsområde | Enkelt, men feil når f.eks. en fakturaagent brukes av både Økonomi og Innkjøp | Forkastes |
| B. Agent eies av prosesser, arbeidsområder avledes | Agenten kobles til én eller flere prosesser. Arbeidsområdene følger av prosessene. Én sannhet, ingen dobbeltregistrering | **Anbefalt** |
| C. Egen kobling agent ↔ arbeidsområde | Fleksibelt, men gir to kilder som kan sprike (prosess sier Økonomi, koblingen sier HR) | Forkastes nå |

Modell B gjenbruker det som allerede finnes (`process_agent_recommendations.status = recruited` er i praksis «agent i arbeid på prosess X»). En agent vises i et arbeidsområde fordi den jobber på en prosess der. Er den koblet til prosesser i flere arbeidsområder, merkes den som **delt**.

Notasjon for delt agent (samme overalt):
- Chip: `Fakturaagent · Delt (2)` med ikon for deling.
- Tooltip/popover: «Jobber i: Økonomi → Leverandørfaktura · Innkjøp → Bestillingsgodkjenning».
- I arbeidsområdet listes agenten med *hvilken prosess her* den er knyttet til, pluss «også i Innkjøp».

## Endringer

### 1. Ny oversiktsblokk for valgt arbeidsområde (erstatter fanen «KI-muligheter»)
Over fanene, under velgeren: ett kort «Slik er {arbeidsområde} satt opp»
- Venstre: navn, ansvarlig, kort beskrivelse.
- Tellere: Systemer · Eiendeler · Prosesser · KI-agenter (ekte tall fra spørringene som allerede finnes / ny liten spørring).
- Rad med KI-agent-chips (med delt-notasjon). Tom tilstand: «Ingen agenter i arbeid ennå».
- Primær CTA: **«Kartlegg KI-muligheter»** (Sparkles). Sekundær: «Se prosesser».
- Fanen «KI-muligheter» fjernes fra fanelisten.

### 2. Kartleggingsvisning åpnes fra knappen
- Knappen setter `?view=ki` i URL (delbar lenke) og bytter innholdet under oversiktskortet fra faner til `AiOpportunitiesTab` med en «Tilbake til arbeidsområdet»-lenke.
- `AiOpportunitiesTab` beholdes uendret (trakt, tabell, «Finn KI-muligheter», «Se vurdering»).
- Når en anbefaling blir `recruited`, dukker agenten opp i agent-raden på oversiktskortet.

### 3. Agenter på tvers av arbeidsområder (prototype)
- Utvid prototype-agentmodellen i `agentMacf` med `processIds: string[]` (localStorage, ingen skjemaendring).
- Ny hjelpefunksjon `deriveAgentWorkAreas(agent, processes)` som gir liste av `{ workAreaId, workAreaName, processId, processName }`.
- Ny liten komponent `AgentChip` med delt-notasjon og tooltip, brukt på oversiktskortet og i `AgentRegistry` (ny kolonne «Arbeidsområder»).
- Demo-data: én delt agent (Fakturaagent) koblet til Leverandørfaktura (Økonomi) og én prosess i et annet område, så delt-notasjonen faktisk vises i demoen.

### 4. Opprydding
- Erstatt hardkodet 110 (prosesser) og «10» (systemer) med reelle tellere.
- Intro-banneret får en ekstra rad «KI-agenter – se hvilke agenter som er i arbeid, og kartlegg nye muligheter».
- Sørg for at valgt arbeidsområde speiles i URL (`?wa=<id>`) slik at «Tilbake» og dyplenker fungerer.

## Klikkbar testflyt
Core → Arbeidsområder (Økonomi valgt) → oversiktskort med tellere og agent-chips → «Kartlegg KI-muligheter» → trakt/tabell → «Se vurdering» → HAIO-fane → «Godkjenn og aktiver» → tilbake til Arbeidsområder: agenten vises i Økonomi. Bytt til Innkjøp: samme agent vises med «Delt (2)» og tooltip.

## Bygger vi ikke nå
- Ingen databaseendringer (ingen ny kobling agent ↔ arbeidsområde/prosess i DB).
- Ingen ny toppmeny eller rute.
- Ingen faktisk agentkjøring; tekst om at oppsett ikke håndheves beholdes.

## Teknisk
- `src/pages/WorkAreas.tsx`: fjern fane `ai-opportunities`; legg til `WorkAreaOverviewCard`; `view`/`wa` i `useSearchParams`; ekte tellere.
- Ny: `src/components/work-areas/WorkAreaOverviewCard.tsx`, `src/components/agents/AgentChip.tsx`, `src/lib/agentWorkAreas.ts`.
- `src/lib/agentMacf.ts`: `processIds` på `AIAgent` + seed for delt agent.
- `src/components/work-areas/WorkAreaSwitcher.tsx`: reell systemteller via prop.
- `src/pages/AgentRegistry.tsx`: kolonne «Arbeidsområder» med `AgentChip`.
- Typesjekk + Playwright-sjekk av flyten over.
