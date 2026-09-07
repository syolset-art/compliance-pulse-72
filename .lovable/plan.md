# Mynder Core som virksomhetens AI-kart

Målet er å snu inngangen til Core fra «compliance først» til «hvor kan AI-agenter avlaste oss?», uten å bygge et nytt produkt. Alt bygger på kartleggingen som allerede finnes: arbeidsområder, prosesser, systemer, data og mennesker. Compliance (RoPA, AI Act, ROS, NIS2/ISO) blir utledet av det samme kartet, ikke startpunktet.

## Hva som allerede finnes (og gjenbrukes)

Prototypen har mer av dette på plass enn den viser:

- **Arbeidsområder** — `src/pages/WorkAreas.tsx` med faner for eiendeler, protokoller, prosesser, dokumenter, innstillinger.
- **Prosesser** — `src/components/process/` (ProcessCard, ProcessList, faner for systemer, datatyper, risiko, kritikalitet) og `src/pages/ProcessProfile.tsx`.
- **AI-mulighet per prosess** — finnes allerede: `useProcessAgentRecommendations` + kant-funksjonen `analyze-process-agent-fit` gir anbefaling (autonom / copilot / manuell), begrunnelse, foreslått agentrolle og estimerte spart timer per måned, med status foreslått → rekruttert → avvist. `AgentRecommendationStrip` og `AgentFitChip` viser dette.
- **AI-oppsett** — `src/pages/AIAgentSetup.tsx` har allerede autonominivåer med krav og compliance-kobling.
- **Mandat** — `src/lib/agentMandate.ts` har tillatelser med «krever godkjenning»-flagg.
- **Agentregister** — `src/pages/AgentRegistry.tsx` + `src/lib/agentMacf.ts` (Mynder-agenter og BYOA).
- **Sara** — `src/lib/saraAgent.ts` med funn som har bekreftet/ubekreftet-tilstand.
- **Systemer** — `src/pages/Systems.tsx` og `DiscoverSystemsDialog`.

Konklusjonen: vi trenger ikke bygge motoren. Vi trenger å **koble bitene sammen til én synlig reise** og gi den et nytt språk og en ny inngang.

## Navigasjonsendring — minst mulig, størst effekt

Sidebar har allerede et mønster for sammenleggbare seksjoner med underpunkter (`renderCollapsibleSection`, `coreNav`). Vi utvider Core-seksjonen fra to punkter til fem, i den rekkefølgen reisen faktisk går:

```text
Core
  Oversikt        /dashboard-core   (finnes, får nytt innhold)
  Arbeidsområder  /work-areas       (finnes)
  Prosesser       /processes        (ny samleside på tvers av arbeidsområder)
  AI-agenter      /agents           (finnes — flyttes inn under Core)
  Systemer        /systems          (finnes — flyttes inn under Core)
```

Ingen ruter fjernes eller omdøpes, så eksisterende lenker fortsetter å virke. «Oppgaver» blir liggende der det er i dag. Dette er hele den strukturelle endringen.

## Skjermer

**1. Core Oversikt (`CoreDashboard.tsx`) — ny topp, gammelt innhold beholdt**

Øverst et kartbånd som viser virksomheten som en kjede med tall: arbeidsområder → prosesser → systemer → AI-muligheter. Under: «Her kan AI avlaste dere» — de tre høyest rangerte AI-mulighetene på tvers av arbeidsområder, hver med prosessnavn, hva agenten ville gjort, anslåtte timer spart per måned, og knappen **Sett AI i arbeid**. Under dette: «Dette faller ut av kartet» — små lenker til RoPA, AI Act, ROS og regelverk med antall poster som allerede er dekket. Dagens modenhetsvisninger flyttes ned, uendret.

**2. Prosesser (`/processes`, ny side)**

Tabell over alle prosesser på tvers av arbeidsområder, gjenbruker `ProcessList`/`AgentFitChip`. Kolonner: prosess, arbeidsområde, systemer, persondata, AI-mulighet, risiko, status. Filtre på arbeidsområde og AI-mulighet. Klikk går til eksisterende `ProcessProfile`.

**3. Prosessprofil — én ny fane «AI-oppsett»**

Fanen viser i klarspråk: *Slik utføres arbeidet i dag* (steg fra kartleggingen), *Agentens jobb*, *Hva agenten får lov til* (fra `agentMandate`), *Krever godkjenning* (menneskelige kontrollpunkter), og *Hva som logges*. Nederst: **Sett AI i arbeid**.

**4. «Sett AI i arbeid» — kort veiviser (3 steg)**

Steg 1: Agentens jobb (forhåndsutfylt fra anbefalingen, kan endres). Steg 2: Hva agenten får lov til — brytere per tillatelse, med «krever godkjenning» der det er relevant. Steg 3: Kontrollpunkt og logg — hvem godkjenner, hvor ofte gjennomgås. Avslutning skriver en agent inn i registeret og viser hva dette betyr for AI Act / ROS / RoPA.

**5. AI-agenter (`AgentRegistry`) — tre lag forklart**

Siden får tre tydelige grupper med én setning hver, ingen sjargong:
- *Din egen agent* — ChatGPT, Claude eller Gemini koblet til Mynder (lenker til MCP-siden).
- *Mynder-agenten* — kjenner en bestemt jobb og har fått et mandat.
- *Sara* — kjenner miljøet deres og finner dokumentasjon lokalt.

Sara-funn får tre synlige tilstander: **Foreslått → Observert → Bekreftet av menneske**. Bare bekreftet teller som sannhet.

## Demo-data

Ett realistisk scenario, M Vest Energy-lignende, seedet på samme måte som dagens demo-seeds (`src/lib/demoSeed*.ts`):

- Arbeidsområde **Økonomi** med fire prosesser: leverandørfaktura, reiseregning, månedsavslutning, kundefakturering.
- Hver prosess med systemer (ERP, bank, e-post), persondata, risiko og AI-mulighet.
- **Leverandørfaktura** er den komplette historien: kartlagt → anbefalt AI-mulighet (høy, ~40 timer/mnd) → AI-oppsett → aktiv agent med kontrollpunkt «faktura over 50 000 kr krever godkjenning» → to loggførte hendelser, hvorav én venter på godkjenning.

## Klikkbar testflyt

Core Oversikt → «Her kan AI avlaste dere» → leverandørfaktura → fanen AI-oppsett → Sett AI i arbeid → tre steg → agenten dukker opp under AI-agenter med mandat og kontrollpunkt → logg viser én hendelse til godkjenning → lenke tilbake til RoPA-posten som ble utledet av samme prosess.

## Språk

«Verdistrøm» og HAIO beholdes i koden og i interne felt, men vises aldri. Kundeteksten er: AI-oppsett, Slik utføres arbeidet, Agentens jobb, Hva agenten får lov til, Krever godkjenning, Sett AI i arbeid. Alle nye strenger legges i `nb.json` og `en.json` etter mønsteret som brukes i Core-sidene i dag.

## Vi bygger IKKE nå

Ingen faktisk agent-kjøretid, ingen reell systemintegrasjon eller lesing av kundens data, ingen ny håndhevelse av mandat i backend, ingen endring av eksisterende compliance-motorer, ingen ny prismodell. Godkjenningskøen er klikkbar, ikke koblet til reell utførelse.

## Risiko

Den reelle faren er at Core blir tyngre, ikke lettere. Motvekten er tredelt: vi legger til én ny side og én ny fane, vi flytter eksisterende punkter i stedet for å duplisere dem, og compliance-utledningene vises som resultater langt nede på siden — aldri som noe brukeren må fylle ut først. Hvis Core-oversikten begynner å kreve rulling for å nå det første handlingsvalget, har vi gått for langt.

## Teknisk

- `Sidebar.tsx`: utvid `coreNav` med Oversikt, Prosesser, AI-agenter, Systemer; gjenbruk `renderCollapsibleSection`. Fjern de samme lenkene fra toppnivå der de i dag ligger som frittstående moduler, men behold gating-logikken.
- Ny `src/pages/Processes.tsx` + rute i `App.tsx`; gjenbruker `ProcessList`, `AgentFitChip`.
- Nytt `src/components/core/ValueMapStrip.tsx` og `AiOpportunityCard.tsx` for Core-oversikten.
- Ny fane i `ProcessCard` (`src/components/process/tabs/ProcessAiSetupTab.tsx`) som leser fra `useProcessAgentRecommendations` og `agentMandate`.
- Ny `src/components/core/PutAiToWorkWizard.tsx`; skriver agent via `agentMacf.ts` (localStorage, som i dag) med nye felter for mandat og kontrollpunkt.
- Ny `src/lib/demoSeedEconomy.ts` etter mønster fra `demoSeedSystems.ts`.
- `AgentRegistry.tsx`: tre grupper; Sara-funn får trestegsstatus i `saraAgent.ts`.
