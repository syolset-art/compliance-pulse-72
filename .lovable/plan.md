# Mynder Core som virksomhetens AI-kart — revidert plan

Planen er strammet inn etter en kritisk gjennomgang. Den første versjonen bygget på flere antakelser som ikke stemte med koden, og la opp til mer ny kode enn runwayen tåler. Under står først hva som var galt, deretter den enklere planen.

## Hva som var feil i forrige plan

**Faktafeil om dagens app:**
- Core-menyen har allerede fire punkter (Behandlingsprotokoll, Systemer, Arbeidsområder, Oppgaver) — ikke to. Å foreslå «fem punkter» var å legge til, ikke rydde.
- RoPA ligger på `/protocols`, ikke `/processing-activities`.
- Det finnes ingen `/processes`-side i dag; prosesslisten ligger inne i Arbeidsområder. Å lage en ny toppside for prosesser innfører et nytt sted for noe som allerede har et sted.
- Det finnes ingen M Vest Energy-demo-org. Firmanavn faller tilbake til «Mynder AS», og demo-data er bransjestyrt via maler.
- Sara-funn bruker ikke ordene foreslått/observert/bekreftet. Koden har `awaiting → approved_mynder / rejected`. Å innføre en tredje vokabular-variant hadde skapt tre parallelle språk for samme sak.
- «Rekrutter agent» finnes allerede og oppretter en `user_tasks`-rad. Godkjenningskøen jeg foreslo å bygge er delvis bygget.

**For mye kompleksitet:** ny prosesside, nytt kartbånd, ny veiviser, ny seed, omskrevet agentregister og omorganisert sidebar — seks arbeidsstrømmer før én av dem er overbevisende.

**Feil inntrykk:** planen ville vist «mandat» og «logg» som om de håndheves. De gjør de ikke. En sikkerhetsansvarlig som klikker seg inn ville trodd noe var på plass som ikke er det.

**Inkonsistent IA:** to frakoblede agentbegreper i koden — anbefalinger per prosess (i databasen) og agentregister med mandat (kun i nettleseren). Forrige plan lot dem være frakoblet, men bandt likevel veiviseren til begge.

## Den reviderte planen: én historie, fire endringer

Demoen skal vise **én** reise fra ende til ende: *Økonomi → leverandørfaktura → her kan AI avlaste dere → sett AI i arbeid → agent med kontrollpunkt → menneske godkjenner.*

### 1. Én ny inngang på Core-oversikten

`CoreDashboard.tsx` får ett nytt kort øverst: **«Hvor kan AI avlaste oss?»**. Det viser de tre høyest rangerte AI-mulighetene fra `process_agent_recommendations` — prosessnavn, arbeidsområde, hva agenten ville gjort, anslåtte timer spart per måned. Knappen er **Sett AI i arbeid** og går rett til prosessen.

Dette er hele den nye inngangen. Dagens modenhetsvisninger blir liggende under, uendret.

### 2. Ingen navigasjonsendring

Core-menyen står som den er. Arbeidsområder er allerede stedet der prosesser bor, og AI-agenter finnes allerede som eget punkt. Reisen går gjennom oversikten, ikke gjennom nye menypunkter. Dette er det som skiller den reviderte planen mest fra den forrige — og det er bevisst.

### 3. Én ny fane på prosessen: «AI-oppsett»

Ny fane i `ProcessCard` (`src/components/process/tabs/ProcessAiSetupTab.tsx`), i klarspråk og uten sjargong:

- *Slik utføres arbeidet i dag* — systemer, data og hvem som gjør hva, fra kartleggingen som allerede finnes.
- *Agentens jobb* — hentet fra anbefalingens `suggested_agent_role` og begrunnelse.
- *Hva agenten får lov til* — brytere, gjenbruker taksonomien i `agentMandate.ts`.
- *Krever godkjenning* — ett menneskelig kontrollpunkt, forhåndsutfylt med en terskel.
- Primærknapp **Sett AI i arbeid**.

Ingen egen veiviser. Fanen *er* oppsettet. Knappen kaller eksisterende `recruitAgent()`, som allerede setter status til rekruttert og legger en rad i `user_tasks`.

### 4. Ærlig statusspråk, ett sett ord

Vi bruker kodens eksisterende to trinn og legger på klarspråk i visningen, ikke et nytt tredje sett:

```text
Foreslått av Lara        (awaiting)          — et forslag, ikke en beslutning
Bekreftet av <navn>      (approved_mynder)   — et menneske har godkjent
```

Sara-observasjoner vises som *Observert av Sara — venter på bekreftelse*, som er den samme `awaiting`-tilstanden med kilden synlig. Ingen ny enum, ingen ny tabell.

Der noe ikke er koblet til reell utførelse, står det i klartekst på skjermen: **«Kontrollpunktet vises her, men agenten kjører ikke ennå i denne prototypen.»** Det er billigere enn å bli tatt i det på et kundemøte.

## Demo-data

Én seed, ikke en generell løsning: `src/lib/demoSeedEconomy.ts` etter mønster fra `demoSeedSystems.ts`. Arbeidsområde **Økonomi** med fire prosesser (leverandørfaktura, reiseregning, månedsavslutning, kundefakturering), hver med systemer, persondata og risiko. Én rad i `process_agent_recommendations` er forhåndsutfylt for leverandørfaktura, slik at demoen ikke er avhengig av at et AI-kall lykkes live.

Firmanavnet i demoen settes til et energiselskap i seeden. Vi lager ingen generell org-bytter.

## Klikkbar testflyt (den eneste som må være perfekt)

Core Oversikt → «Hvor kan AI avlaste oss?» → leverandørfaktura → fanen AI-oppsett → Sett AI i arbeid → agenten blir rekruttert → oppgaven dukker opp i Oppgaver som «Godkjenn AI-oppsett for leverandørfaktura» → godkjenn → prosessen viser *Bekreftet av <navn>*.

Alt annet på skjermen er kulisser og skal tåle et klikk uten å gå i stykker, men det er denne flyten som demonstreres.

## Vi bygger IKKE nå

Ingen ny prosesside, ingen ny navigasjon, ingen egen veiviser-dialog, ingen omskriving av agentregisteret, intet kartbånd, ingen sammenslåing av de to agentmodellene, ingen agent-kjøretid, ingen håndhevelse av mandat i backend, ingen endring av eksisterende compliance-motorer.

## Språk

«Verdistrøm» og HAIO beholdes i kode og interne felt, aldri i kundetekst. Synlige ord: AI-oppsett, Slik utføres arbeidet, Agentens jobb, Hva agenten får lov til, Krever godkjenning, Sett AI i arbeid. Nye strenger legges i `nb.json`/`en.json` under et nytt `aiSetup`-navnerom, i tråd med mønsteret i filene.

## Risiko

Den gjenstående risikoen er at Core-oversikten blir en side til å lese i stedet for å handle på. Motvekten er at det nye kortet har én knapp og tre linjer. Hvis kortet vokser til flere valg før demoen, kutter vi ned igjen framfor å legge til.

## Teknisk oppsummert

- `src/components/dashboard/AiOpportunityCard.tsx` (ny) — leser `process_agent_recommendations`, monteres øverst i `CoreDashboard.tsx`.
- `src/components/process/tabs/ProcessAiSetupTab.tsx` (ny) — registreres som fane i `ProcessCard`; gjenbruker `useProcessAgentRecommendations` og `MANDATE_PERMISSIONS`.
- `src/lib/demoSeedEconomy.ts` (ny) — arbeidsområde, prosesser, systemer og én forhåndsutfylt anbefaling.
- Små tekstendringer i `agentRequirementFindings.ts`-visninger for det felles statusspråket.
- Ingen migrasjoner utover seed-data, ingen ruteendringer, ingen endringer i `Sidebar.tsx`.
