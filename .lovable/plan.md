# Agents — eget menypunkt i Mynder

Mynder skal ikke bare være compliance. Kunden skal oppleve at de bygger og styrer **sine egne agenter** — i HR, salg, kommunikasjon, økonomi, drift — og at Mynder er orkestreringslaget rundt dem: identitet, arbeidskontrakt, eier, verdikjede, datafølsomhet og logg.

Agents skal kunne stå på egne ben. En kunde som bare vil ha agenter — uten Core, uten systemregister, uten arbeidsområder fra før — skal kunne starte her, og kartleggingen de gjør skal senere kunne gjenbrukes i Core når de vil ha personvern (GDPR), NIS2, risikostyring og kritikalitet på toppen.

Styrende dokument «Prosjekt — Agentlaget i Mynder Core» sier «ikke eget toppnivå-menypunkt», begrunnet i faren for parallell kartlegging. Vi gjør et bevisst unntak, men fjerner den faren ved at Agents og Core deler **samme** datamodell for arbeidsområder og prosesser — det er én kartlegging, sett fra to innganger.

## To innganger, én kartlegging

- **Har Core:** arbeidsområder og prosesser finnes allerede. Agents viser forslag basert på dem, og lenker til Core for kartleggingen.
- **Har ikke Core:** Agents viser en lettvekts kartlegging i samme skjermbilde — først arbeidsområder («Hvilke deler av virksomheten jobber dere i?»), så prosesser under hvert område («Hvilke oppgaver gjøres her?»). Ingen systemer, ingen compliance-felt, ingen krav om noe annet enn navn og en kort beskrivelse.

Det som lagres er de samme radene Core bruker (`work_areas`, `system_processes`). Aktiverer kunden Core senere, ligger kartleggingen allerede der — og da kommer personvern, RoPA, NIS2, risiko og kritikalitet som et lag på toppen, uten å gjøre jobben på nytt. Dette er selve salgsargumentet og skal sies eksplisitt i grensesnittet: «Kartleggingen du gjør her brukes også hvis du senere tar i bruk Core.»


## Slik oppleves det (Notion-inspirert)

Notions Workers-side er intuitiv fordi den gjør fire ting på én skjerm: forklarer hva dette er i én setning, forklarer kostnaden ærlig i en egen boks, viser «Alle workers» som én rad man klikker inn i, og legger styringen (pause alt, hvem kan opprette) rett under som enkle brytere. Vi kopierer den strukturen.

`/agents` blir:

1. **Tittel + én setning:** «Agents (Beta) — Bygg agenter som utfører reelt arbeid i virksomheten. Mynder holder styr på hva de får lov til, hvem som eier dem og hva de har gjort.» Lenke «Kom i gang».
2. **Kostnadsboks:** hva en agent koster i kreditter/kroner, hva som er gratis i beta, og «Les mer». Ærlig og synlig — ikke gjemt i prislisten.
3. **Alle agenter:** én rad → antall agenter → klikk inn til listen.
4. **Sett alle agenter på pause** (bryter) og **Hvem kan opprette agenter** (nedtrekk: alle, kun administratorer, administratorer + valgte grupper).

## Menystruktur

Nytt toppnivå-punkt **Agents** rett etter Core-seksjonen (samme stil som Trust Center / Styrerom). Under det:

- **Oversikt** — skjermen beskrevet over
- **Alle agenter** — registeret (dagens `/agents`-tabell, utvidet)
- **Forslag** — agentforslag fra prosesskartleggingen i Core
- **Arbeidskontrakter** — bibliotek over playbooks/maler

Core beholder kartleggingen (arbeidsområder, prosesser, KI-muligheter). Der en agent i dag aktiveres fra en prosess, får brukeren nå tydelig beskjed: «Agenten er opprettet og ligger under Agents».

## Agenten som objekt

Hver agent har en profilside med:

- **Identitet:** ID, navn, kort formål, ikon, status (utkast / i test / aktiv / satt på pause)
- **Arbeidskontrakt:** hva agenten gjør, steg for steg, hva den kan gjøre selv, hva som krever godkjenning. Versjonert, med «Foreslått av Lara» til et menneske har bekreftet.
- **Eier:** navngitt person + avdeling
- **Verdikjeder:** hvilke prosesser og arbeidsområder agenten jobber i. En agent kan tilhøre flere — vises som «Delt (2)», slik det allerede gjøres i dag.
- **Data:** hvilke systemer og datatyper, og om personopplysninger eller sensitive data er involvert
- **Domene:** HR, salg, kommunikasjon, økonomi, drift, compliance — slik at det er åpenbart at dette ikke bare er et compliance-verktøy
- **Kontroll og logg:** kontrollpunkter, hvem godkjenner, aktivitetslogg
- **Regelverk:** hva agenten automatisk bidrar med (AI-register, RoPA, risiko) — som en konsekvens, ikke som inngang

## Å bygge en agent

Én knapp «Ny agent» med to veier:

- **Fra forslag** — velg et forslag fra kartleggingen; arbeidskontrakten er allerede utfylt som utkast
- **Fra bunnen** — velg domene (HR, salg, …), beskriv jobben, Lara foreslår arbeidskontrakt, eier og datafelter

Begge ender i samme fire steg: **Jobben → Arbeidskontrakt → Eier og data → Kontrollpunkter**. Til slutt «Sett agenten i arbeid».

## Demo-innhold

Fem agenter på tvers av domener slik at bredden er tydelig: onboarding av ansatt (HR), tilbudsutkast (salg), innholdskalender (kommunikasjon), leverandørgjennomgang (compliance), fakturakontroll (økonomi). Én av dem delt på to arbeidsområder.

## Teknisk

Ingen skjemaendring i denne runden. Prototypen bygger videre på det som finnes.

- `src/lib/agentMacf.ts` — utvid `AIAgent` med `domain`, `contract` (steg, fullmakter, godkjenninger), `owner_name`, `sensitive_data`, `lifecycle`. Behold localStorage som lager.
- `src/lib/agentWorkAreas.ts` / `useWorkAreaAgents.ts` — gjenbrukes uendret for verdikjede-koblingen og «Delt (n)».
- `src/components/Sidebar.tsx` — nytt toppnivå-punkt `Agents` med undermeny; `agentsLink` flyttes hit.
- Nye ruter: `/agents` (oversikt), `/agents/all` (dagens tabell), `/agents/suggestions`, `/agents/contracts`, `/agents/new`. `/agents/:id` beholdes og utvides.
- Nye komponenter: `AgentsOverview`, `AgentCostCard`, `AgentGovernanceControls` (pause + hvem kan opprette), `AgentBuilderWizard`, `AgentContractCard`, `AgentDomainBadge`.
- Forslagslisten leser `process_agent_recommendations` via eksisterende hook; «Bygg agent» setter status `recruited` med dagens `recruitAgent()`.
- Rapporten `/reports/ai-agents` beholdes og lenkes fra oversikten.

## Vi bygger ikke nå

Ingen kjøremotor, ingen faktisk håndheving av fullmakter, ingen ekte kredittrekk, ingen ny database. Skjermene sier tydelig at agenten er dokumentert og styrt, men ikke kjørende.
