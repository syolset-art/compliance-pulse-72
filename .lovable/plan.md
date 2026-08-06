# Simulert akseptansetest: Mynder Core mot styrings-Cockpit v1

Ikke-endrende gjennomgang. Ingen kode endret, ingen data skrevet, ingen publisering. Bevis er hentet fra kildekode på gjeldende commit og fra faktisk lasting av preview (`/board`, `/agents`, `/tasks` — alle rendrer uten konsollfeil).

## Viktig avgrensning: Styrerom er ikke Cockpiten

- **Eksisterende `/board` («Styrerom», `src/pages/BoardDashboard.tsx`, 580 linjer)** er et styre-**rapporterings**bilde: modenhet i prosent, risikoeksponering, tre KPI-tall, en beslutningskø og en regelverksliste.
- **Styrings-Cockpit v1** (Nå-visning, Playbook, Capability Profile, Agentoppdrag, KCP-receipt, Eval) finnes **ikke** i koden. Søk på `Playbook`, `Capability Profile`, `Agentoppdrag`, `KCP`, `receipt`, `DEP-38`, `cockpit`, `verdistrøm` gir ingen treff i `src/` eller `supabase/`. Tabell-listen i `supabase/migrations/` inneholder ingen tabeller for playbooks, agentoppdrag, beslutnings-receipts eller evals.
- Beslutningskøen i Styrerom er **statisk seed** (`SEED_DECISIONS` i `BoardDashboard.tsx`), leverandørkostnadene er `DEMO_VENDOR_COSTS`, og kvartalstrenden er en hardkodet tallrekke `[4,2,6,1,3,-1,5]`. Dette er ikke AI-output og skal ikke presenteres som det.

## Trinnvis vurdering

### 1. Nå-visning med maks 7 prioriterte saker + hvorfor navngitt person trengs
**Ikke implementert (delvis nærliggende funksjonalitet).**
- Bevis: `/board` viser 3 seedede beslutninger uten prioritetsrangering eller personangivelse. `src/pages/DashboardV2.tsx:90-93` slår sammen compliance-krav og brukeroppgaver, sorterer på `PRIORITY_ORDER` og kutter til `slice(0, 5)` — nærmeste eksisterende «topp-N»-visning, men uten begrunnelse for hvem som må gjøre noe.
- Ingen felt for ansvarlig person med begrunnelse: `user_tasks` har ingen «hvorfor denne personen»-attributt.
- For å bestå: egen Nå-visning-rute med maks 7 saker, hver med navngitt eier hentet fra rolle/arbeidsområde (`work_area_members`, `user_roles`) og en generert, kildebelagt begrunnelse for hvorfor akkurat den rollen kreves.

### 2. Sak viser oppgave, verdistrøm og konsekvens av å vente
**Delvis.**
- Bevis: beslutningsdialogen i `BoardDashboard.tsx` viser `context` + `recommendation` (statisk tekst). `src/lib/deviationImpact.ts` og `src/lib/requirementStatusModel.ts` inneholder konsekvenslogikk for avvik/krav.
- Mangler: begrepet **verdistrøm** finnes ikke i kodebasen, og «konsekvens av å vente» er ikke tidsavhengig beregnet noe sted.
- For å bestå: saksmodell med feltene oppgave, verdistrøm-ID og eskalerende konsekvens over tid, koblet til reell krav-/avviksdata.

### 3. Synlige/lenkede Playbook, Capability Profile og Agentoppdrag med versjon, fullmakt, stopp og evidence
**Ikke implementert.**
- Bevis: nærmeste eksisterende er agentregisteret `src/lib/agentMacf.ts` + `/agents` og `/agents/:id`. Det har `macf_level` (L1–L3), `trust_score`, `data_scope`, `tools`, `audit_logging`, `rbac_roles` — men **ingen** versjonsnummer, ingen eksplisitt fullmaktsgrense, ingen stoppknapp/kill-switch og ingen evidence-lenke.
- Data lagres kun i localStorage (`agentMacf.ts` topp-kommentar: «Kept local-only (localStorage) in this iteration»), altså ikke reviderbart.
- Ingen Playbook- eller Capability Profile-artefakt eksisterer.
- For å bestå: persistente tabeller for playbook, capability profile og agentoppdrag med versjon, fullmaktsomfang, stoppmekanisme og evidence-referanse, lenket fra hver sak.

### 4. Normal DEP-38-scenario kan kjøres og gi kildebelagte forslag
**Blokkert.**
- Bevis: `DEP-38` finnes ikke som identifikator noe sted i repoet; det finnes ingen scenariomotor. Scenarioet kan derfor ikke kjøres og ikke vurderes.
- Nærliggende: reelle AI-endepunkter finnes (`supabase/functions/analyze-evidence-coverage`, `analyze-doc-gap`, `suggest-*`), så byggeklossene for kildebelagte forslag er til stede.
- For å bestå: definer DEP-38 som et konkret, kjørbart scenario med inngangsdata, forventet output og kildehenvisning per forslag.

### 5. Manglende kontekst eller fullmaktsgrense gir faktisk blokkering/eskalering
**Ikke implementert.**
- Bevis: ingen fullmaktsgrense finnes i agentmodellen (`agentMacf.ts`). MACF-nivåene er visuelle merker uten håndhevelse. Ingen kode avbryter en AI-handling på grunn av manglende kontekst; edge-funksjonene returnerer forslag uten gatekeeping.
- For å bestå: policy-sjekk før agenthandling som returnerer «blokkert» eller «eskalert til X» med lagret årsak, testbart ved å fjerne påkrevd kontekst.

### 6. KCP-beslutning/receipt kan inspiseres
**Ikke implementert.**
- Bevis: `confirmDecision()` i `BoardDashboard.tsx` fjerner saken fra lokal state, legger den i `processedToday` og viser en toast. Ingenting skrives til database; protokollnotatet forkastes ved refresh. Ingen receipt-objekt, ingen KCP-modell.
- For å bestå: persistert beslutnings-receipt (hvem, hva, når, grunnlag, fullmakt, versjon av playbook) med egen inspeksjonsvisning.

### 7. Eval lagres med score, avvik, rotårsak og neste handling
**Ikke implementert.**
- Bevis: ingen eval-tabell i migrasjonene. `src/components/chat/FeedbackDialog.tsx` samler enkel tilbakemelding, og `ai_classification_feedback` finnes som tabell, men uten score/avvik/rotårsak/neste handling. «Rotårsak» finnes kun som tekst i `qualityModuleDefinitions.ts` og `moduleInfo.ts`.
- For å bestå: eval-post per kjøring med numerisk score, registrerte avvik, rotårsak og forpliktende neste handling.

## Oppsummering

| Trinn | Status |
| --- | --- |
| 1 Nå-visning maks 7 + personbegrunnelse | Ikke implementert |
| 2 Oppgave, verdistrøm, konsekvens av å vente | Delvis |
| 3 Playbook / Capability Profile / Agentoppdrag | Ikke implementert |
| 4 DEP-38-scenario | Blokkert |
| 5 Blokkering ved manglende kontekst/fullmakt | Ikke implementert |
| 6 KCP-receipt | Ikke implementert |
| 7 Eval med score og rotårsak | Ikke implementert |

### Tre sterkeste sider
1. Styrerommet leverer et troverdig, lesbart styrebilde på ekte modenhets- og hendelsesdata (`useComplianceRequirements`, `system_incidents`) — riktig abstraksjonsnivå for et styre.
2. Reell AI-infrastruktur er allerede på plass: 38 edge-funksjoner for analyse, klassifisering og forslag, inkludert evidens- og gap-analyse — fundamentet for kildebelagte forslag eksisterer.
3. Agentregisteret med MACF-nivå, trust-score, dataomfang og verktøyliste er en god skisse av en Capability Profile og kan løftes til Cockpit-standard uten å starte fra null.

### Tre største svakheter
1. Hele Cockpit-kjernen — Playbook, Agentoppdrag, KCP-receipt, Eval — mangler både datamodell og UI. Dette er ikke finpuss, det er ny arkitektur.
2. Ingenting er reviderbart: styrebeslutninger lever i React-state og agentene i localStorage. En beslutning tatt i demoen forsvinner ved refresh.
3. Sentrale deler av styrebildet er statisk seed (beslutninger, leverandørkostnader, kvartalstrend) og kan lett forveksles med AI-output.

### Ærlig demosetning til styret
«Vi kan i dag vise et fungerende styrebilde med reell modenhets- og hendelsesdata, men beslutningskøen, kostnadstallene og trendene i demoen er forhåndsdefinert innhold — og styringsmekanismene Cockpit v1 krever, med fullmaktsgrenser, sporbare beslutningskvitteringer og evaluering, er ennå ikke bygget.»

## Hvis dere vil gå videre

Neste naturlige leveranse er en fundamentpakke: datamodell og persistering for playbook, agentoppdrag, beslutnings-receipt og eval, samt en Nå-visning som topper på syv saker med navngitt eier. Si fra hvis dere vil at jeg lager en implementeringsplan for det.
