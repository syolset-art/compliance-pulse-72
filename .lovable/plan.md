
## Hva skjer i dag etter Lara har analysert?

Når brukeren trykker "Analyser med Lara" på et arbeidsområde i dag:

1. `AgentRecommendationStrip` kaller edge-funksjonen `analyze-process-agent-fit`.
2. Funksjonen henter alle prosessene i arbeidsområdet, sender dem til Gemini, og lagrer én rad pr. prosess i `process_agent_recommendations` med `recommendation` (autonomous / copilot / manual), `rationale`, `suggested_agent_role` og `estimated_hours_saved_per_month`.
3. UI oppdateres:
   - Stripen øverst viser totaler: "X autonom-klare · Y co-pilot · ~Z t/mnd potensiell besparelse".
   - Hvert `ProcessOverviewCard` får en `AgentFitChip` (Bot / Users / User-ikon).
   - Klikk på chip åpner en popover med rationale, foreslått agent-rolle, estimert besparelse, og knappene **Rekrutter agent** / **Avvis** / (for manual) en notis om at Lara anbefaler manuelt.
4. "Rekrutter agent" oppdaterer bare status til `recruited` i databasen i dag – det skjer ingen videre handling. Dette er løs ende #1.

Så analysen produserer altså innsikt + en CTA, men "rekrutteringen" leder ingen steder ennå.

## Bør analysen heller ligge klar?

Ja – og det matcher hvordan resten av plattformen fungerer (Lara forbereder, brukeren bekrefter). Argumenter:

- Prosesser endrer seg sjelden. En ny analyse hver gang er sløsing av credits og latency.
- "Less is more": Brukeren skal ikke trenge å trykke "Kjør analyse" for å forstå verdien – verdien skal være synlig fra første sekund.
- Demo / salg: dette blir et sterkt "wow"-element hvis kunden ser klare AI-anbefalinger umiddelbart etter at de har lagt inn arbeidsområdet sitt.
- Vi får et tydelig credits-skille: forhåndsanalyse er gratis innsikt, *rekruttering* av en agent er det som faktisk koster.

## Foreslått løsning

### 1. Forhåndsberegnet analyse ("ligger klar")

- Når prosesser opprettes (manuelt eller via `suggest-processes`), trigge `analyze-process-agent-fit` automatisk i bakgrunnen for de nye prosessene (debounced, ikke per insert).
- For eksisterende arbeidsområder uten anbefalinger: kjør analysen én gang første gang noen åpner arbeidsområdet (lazy backfill), uten at brukeren må trykke noe.
- Lagre `generated_at` (finnes allerede). Vis "Sist oppdatert: …" diskret i stripen. Tilby fortsatt "Oppdater analyse" som en stille refresh-knapp for power users.

### 2. Avduking i stedet for "kjør analyse"

`AgentRecommendationStrip` endres fra "trykk for å starte" til en *teaser* som allerede vet svaret:

```text
Lara har identifisert 3 prosesser hvor en AI-agent kan ta over arbeidet.    [Vis innsikt]
```

- Før klikk: Chips på prosesskort er skjult. Stripen viser bare antallet og en mild CTA ("Vis innsikt" / "Se hvilke").
- Etter klikk: Chipsene fades inn på relevante kort, stripen utvides med fordelingen (autonom / co-pilot / besparelse).
- Dette gjør "less is more"-aestetikken: ingen ekstra støy med mindre brukeren ber om det, men verdien er forhåndsberegnet og umiddelbar.

State lagres som user preference (localStorage pr. arbeidsområde) så valget huskes.

### 3. Rekruttering må lede et sted (lukke løs ende)

Når brukeren trykker "Rekrutter agent":
- Opprett en oppgave i Lara Inbox / Activity feed: "Sett opp [suggested_agent_role] for [prosess]".
- Marker `recruited_at` på raden.
- Vis bekreftelse i popover: "Lara har lagt dette i innboksen din. Du får varsel når agenten er klar til testing."

Dette gjør "Rekrutter" konkret og verdt credits, uten å bygge selve agent-runtime ennå.

### 4. Demo-/test-vennlig

- Legg til en "demo-seed" så demo-organisasjoner får forhåndsutfylte anbefalinger uten edge-kall (raskere demo, ingen credits).
- Logg `recruited` events så vi kan måle hvilke agent-roller kunder faktisk velger – kjernedata for å prioritere hvilke agenter vi bygger neste.

## Tekniske endringer

**Frontend**
- `src/components/process/ProcessList.tsx`: trigge auto-analyse når prosesser finnes men `agentRecs` er tom (lazy backfill, kun én gang pr. session).
- `src/components/process/AgentRecommendationStrip.tsx`: ny "teaser"/"reveal"-modus, stille refresh-knapp, vise `generated_at`.
- `src/components/process/ProcessOverviewCard.tsx`: vis `AgentFitChip` kun når `revealed === true`.
- Ny `src/hooks/useAgentInsightReveal.ts`: localStorage-basert reveal-state pr. workAreaId.
- `src/components/process/AgentFitChip.tsx`: ved "Rekrutter agent" – kall ny mutation som oppretter Lara Inbox-oppgave.

**Backend**
- `supabase/functions/analyze-process-agent-fit/index.ts`: legg til parameter `processIds?: string[]` så vi kan analysere kun nye prosesser i stedet for hele arbeidsområdet.
- Ny migration: legg til kolonne `recruited_at timestamptz` på `process_agent_recommendations`.
- (Valgfritt senere) DB-trigger på `system_processes` som markerer arbeidsområdet "needs reanalysis" – holder seg unna automatiske AI-kall fra triggere.

**Demo-data**
- `src/lib/demoSeedSystems.ts` (eller tilsvarende): seede `process_agent_recommendations` for demo-prosesser så det vises umiddelbart.

## Hva som *ikke* gjøres nå

- Vi bygger ikke selve agent-runtime / agent-konfigurasjonsside. Rekruttering = oppgave i innboksen.
- Ingen automatisk re-analyse hver gang en prosess endres – kun ved nye prosesser, ellers manuell refresh. Holder credits-bruk i sjakk.
