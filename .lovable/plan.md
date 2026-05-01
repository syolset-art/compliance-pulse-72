
# AI-agent rekruttering for arbeidsområder

## Problem
En leder ser i dag en lang liste prosesser pr. arbeidsområde, men har ingen hjelp til å vurdere *hvor en AI-agent kan ta over eller forsterke arbeidet*. Det er en kjerneverdi vi bør levere når kunder kartlegger arbeidsområdene sine.

## Konsept: "AI Agent Readiness"
Lara analyserer hver prosess og scorer den langs 4 akser:
- **Repetisjon** — gjentas oppgaven ofte?
- **Strukturert input** — finnes data/dokumenter den jobber på?
- **Regelbasert / lavt skjønn** — kan beslutninger beskrives?
- **Lavt risikonivå for full automasjon** (ellers: "co-pilot" istedenfor "autonom")

Ut fra dette får hver prosess én av tre anbefalinger (less-is-more, ingen tunge bannere):
- **Autonom agent anbefales** — Lara kan utføre selv
- **Co-pilot anbefales** — agent assisterer menneske
- **Hold manuelt** — krever skjønn / mennesker

Hver anbefaling kommer med:
- 1 setning *hvorfor*
- Forslag til konkret agent-rolle (f.eks. "DPA-overvåker", "Onboarding-screener", "Avviksklassifiserer")
- Estimert tidsbesparelse pr. mnd (rough)

## UI — to nivåer

### 1. Arbeidsområde-nivå: kompakt "Agent-potensial"-strip
På valgt arbeidsområde, over prosesslisten, en diskret linje:

```text
✦ Lara har funnet 3 prosesser hvor en AI-agent kan ta over og 5 hvor agent kan assistere.
   [Se forslag]   [Rekrutter alle anbefalte]
```

Stil: `bg-muted/40 border border-border`, ingen lilla/grønn dominans (følger memory).

### 2. Prosess-nivå: liten "Agent-egnethet"-chip på hvert ProcessOverviewCard
Inline i kortets metadata-rad, ved siden av kritikalitet/AI-bruk:

- ⚡ **Autonom-klar** (subtil)
- 🤝 **Co-pilot** (nøytral)
- 👤 **Manuell** (muted)

Klikk på chippen åpner en *inline drawer* (ikke modal) med:
- Begrunnelse fra Lara
- Foreslått agent-rolle + ansvar
- Knapper: **Rekrutter agent** / **Be om mer info** / **Avvis**

Følger samme agentiske inline-mønster som vi nettopp innførte for Gap-analyse (`InlineAgentProposal`). Ingen store dialoger.

### 3. Status etter "rekruttering"
Når bruker klikker *Rekrutter*, opprettes en `agent_assignment` som er synlig i Lara Inbox / Aktivitet. Prosessen får et lite "Agent tildelt"-merke. Ikke noe nytt fullt arbeidsflyt-system — bare en oppgave + audit-spor.

## Teknisk

### Ny tabell: `process_agent_recommendations`
```text
id (uuid)
process_id (uuid → system_processes.id)
work_area_id (uuid → work_areas.id)
recommendation enum('autonomous','copilot','manual')
rationale text
suggested_agent_role text
estimated_hours_saved_per_month numeric
generated_at timestamptz
generated_by_model text
status enum('proposed','recruited','dismissed') default 'proposed'
```
RLS: les/skriv for autentiserte brukere i samme org (følger eksisterende mønster).

### Ny edge function: `analyze-process-agent-fit`
- Input: `{ workAreaId }` eller `{ processId }`
- Henter prosessdata + tilknyttede systemer + AI-bruk + risikonivå
- Bruker Lovable AI (`google/gemini-2.5-flash`) med strukturert JSON-output
- Skriver resultat til `process_agent_recommendations` (upsert pr. process_id)

### Frontend
- **Ny:** `src/components/process/AgentRecommendationStrip.tsx` (arbeidsområde-nivå sammendrag + bulk)
- **Ny:** `src/components/process/AgentFitChip.tsx` (chip + inline drawer pr. prosess)
- **Ny hook:** `src/hooks/useProcessAgentRecommendations.ts` (les + trigger generering)
- **Endre:** `src/components/process/ProcessList.tsx` — vise stripen øverst, sende anbefaling ned i kort
- **Endre:** `src/components/process/ProcessOverviewCard.tsx` — vise `AgentFitChip` i metadata-rad
- i18n nøkler i `nb` og `en`

### Lara Inbox
- Når status settes til `recruited` opprettes en `user_tasks`-oppføring "Sett opp AI-agent for {prosess}", slik at ledere får oppfølging i eksisterende oppgaveflyt. Ingen ny page nødvendig.

## Hva vi *ikke* gjør nå
- Ingen automatisk eksekvering av agenten — bare *kartlegging og rekruttering*
- Ingen ny side; alt er inline i eksisterende WorkAreas-side
- Ingen dominante farger — følger "less is more"-stilen
