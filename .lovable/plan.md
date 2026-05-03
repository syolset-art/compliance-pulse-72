
## Mål

Erstatt dagens 3-stegs modal (`AddDeviationDialog`) med en **agentisk inline-flyt** der Lara er proaktiv: brukeren beskriver hendelsen i klartekst (eller via en kort spørsmål-trigger), og Lara klassifiserer, foreslår alle felter, kobler til **normative regler** (GDPR art. 33 / 72t, NIS2 24t tidlig varsling, ISO 27001 A.5.24–A.5.27, personvernforordning art. 34) og presenterer ett **bekreft-kort** i stedet for et skjema.

## UX — fra skjema til samtale

Trigger "Legg til avvik" på `/deviations` åpner ikke lenger et modalt vindu. I stedet utvides en **inline agent-stripe** rett under header-en (samme mønster som `AgentPlanStrip` / `InlineAgentProposal` vi allerede bruker for gap-tiltak).

Tre tilstander, alle inline:

```text
┌─ State 1: PROMPT ─────────────────────────────────────────┐
│ Lara: "Hva har skjedd? Beskriv kort så klassifiserer jeg │
│        avviket og sjekker varslingsfrister for deg."      │
│ [ tekstfelt: "f.eks. e-post sendt til feil mottaker..." ] │
│ Hurtigvalg: [Datalekkasje] [Systemnedetid] [Phishing]     │
│             [Fysisk hendelse] [Ansattfeil] [Annet]        │
│                                          [Avbryt] [Send]  │
└───────────────────────────────────────────────────────────┘

┌─ State 2: ANALYSING (2–4 sek) ───────────────────────────┐
│ ● Lara analyserer...                                      │
│   ✓ Klassifisert som: Datalekkasje (personopplysninger)   │
│   ✓ Sjekker GDPR art. 33, NIS2, ISO 27001                 │
│   … Vurderer alvorlighetsgrad og frist                    │
└───────────────────────────────────────────────────────────┘

┌─ State 3: DRAFT CARD (Laras forslag) ────────────────────┐
│ Lara foreslår dette avviket — bekreft eller juster:       │
│                                                            │
│ Tittel:        E-post med kundeliste til feil mottaker    │
│ Kategori:      Datalekkasje · Personopplysninger          │
│ Alvorlighet:   HØY    Lara: "Omfatter særlige kategorier" │
│ Rammeverk:     GDPR · ISO 27001 · NIS2                    │
│ Ansvarlig:     Maria Johansen (DPO)  ← foreslått av Lara  │
│ Oppdaget:      03.05.2026                                  │
│                                                            │
│ ⚠ Normativ frist  GDPR art. 33 — meld Datatilsynet innen  │
│                   72 timer (06.05.2026 14:00)             │
│ ⚠ Normativ frist  GDPR art. 34 — vurder varsling av de    │
│                   registrerte                              │
│                                                            │
│ Foreslåtte umiddelbare tiltak:                             │
│   ☑ Be mottaker slette e-posten (bevis sikres)            │
│   ☑ Logg hendelsen i avviksregisteret                     │
│   ☑ Start vurdering av meldeplikt til Datatilsynet        │
│                                                            │
│ Trenger Lara mer info? Svar på:                            │
│   • Hvor mange registrerte er berørt? [< 10] [10–100] [>] │
│   • Inneholdt e-posten sensitive opplysninger? [Ja] [Nei] │
│                                                            │
│       [Juster manuelt]   [Avvis]   [Bekreft og opprett]   │
└───────────────────────────────────────────────────────────┘
```

Sentrale prinsipper:
- **Ingen tomme skjemaer.** Lara fyller alle felter; brukeren bekrefter.
- **Proaktive oppfølgingsspørsmål kun når det påvirker normativ klassifisering** (f.eks. antall berørte → meldeplikt).
- **Normative frister** vises som egne "normativ frist"-chips med paragraf-referanse, ikke som vanlige due dates.
- **"Juster manuelt"** kollapser kortet til redigerbart skjema for de som vil overstyre — fallback, ikke standard.

## Teknisk

### Ny komponent
`src/components/deviations/InlineDeviationAgent.tsx` — erstatter `AddDeviationDialog` som default-flyt. Tre interne tilstander: `prompt | analysing | draft`. Eksponerer `onCreated` callback.

### Ny edge-funksjon
`supabase/functions/classify-deviation/index.ts` — bruker `google/gemini-2.5-flash` via Lovable AI Gateway. Tar inn `{ description, quickCategory?, companyProfile, workAreas }` og returnerer via tool-call:

```ts
{
  title: string,
  description: string,           // ryddet versjon av brukerens tekst
  category: DeviationCategoryId, // matchet mot deviationCategories
  criticality: "critical"|"high"|"medium"|"low",
  frameworks: string[],          // GDPR, NIS2, ISO 27001, etc.
  normativeRules: Array<{
    code: string,                // "gdpr-art-33"
    label: string,               // "GDPR art. 33 – melding til tilsyn"
    deadlineHours: number,       // 72
    action: string,              // "Meld Datatilsynet"
    triggered: boolean,          // true hvis kriterier oppfylt
  }>,
  suggestedResponsible: { name: string, reason: string } | null,
  suggestedMeasures: string[],   // 2–4 umiddelbare tiltak
  followUpQuestions: Array<{
    id: string,
    question: string,
    options: string[],           // chip-svar
    affects: string,             // hvilket felt svaret kan endre
  }>,
  reasoning: string,             // kort begrunnelse vist i kortet
}
```

Regelmotor i prompt: GDPR art. 33 (72t hvis personopplysninger berørt), art. 34 (sannsynlig høy risiko → varsle registrerte), NIS2 art. 23 (24t early warning + 72t notification for "vesentlige" enheter), ISO 27001 A.5.24–A.5.27 (incident management), personopplysningsloven §§ relevante henvisninger.

Oppfølgingsspørsmål brukes til å re-kjøre klassifisering uten å åpne nytt skjema — Lara oppdaterer draft-kortet inline.

### Hook
`src/hooks/useDeviationAgent.ts` — håndterer state-maskin (prompt → analysing → draft), kaller edge-funksjonen, re-kjører ved follow-up-svar, og persisterer via samme `system_incidents`-insert som i dag (gjenbruker mutation-logikken fra `AddDeviationDialog`). Lagrer i tillegg `normative_rules` og `suggested_measures` som metadata på avviket.

### DB
Migrasjon: legg til `normative_rules jsonb` og `agent_reasoning text` på `system_incidents` for å spore hva Lara konkluderte. Foreslåtte tiltak skrives som `user_tasks` koblet til avviket (samme mønster som "Recruit agent" allerede gjør).

### Oppdatering av `Deviations.tsx`
- Fjern `AddDeviationDialog`-bruk fra "Legg til avvik"-knappen.
- Knappen toggler nå `InlineDeviationAgent` rett under header (animert utvidelse).
- Behold `AddDeviationDialog` midlertidig som "Juster manuelt"-fallback fra draft-kortet.

### Eksisterende komponenter som beholdes
- `EditDeviationDialog` — uendret.
- `deviationCategories` — uendret, brukes som whitelist for AI-output.
- `suggest-deviations` edge-funksjon — kan deprekeres etter at ny flyt er stabil.

## Filer som lages/endres

Nye:
- `src/components/deviations/InlineDeviationAgent.tsx`
- `src/hooks/useDeviationAgent.ts`
- `src/lib/normativeDeviationRules.ts` (referanse-konstanter for GDPR/NIS2/ISO frister, brukes også til UI-labels)
- `supabase/functions/classify-deviation/index.ts`
- Migrasjon for `system_incidents.normative_rules` + `agent_reasoning`

Endres:
- `src/pages/Deviations.tsx` (bytter trigger fra dialog til inline agent)
- `src/components/dialogs/AddDeviationDialog.tsx` (kun beholdt som fallback fra "Juster manuelt")

## Avgrensninger
- Bruker Lovable AI Gateway (ingen ny API-nøkkel).
- Ingen endringer i listing/filter-delen av `/deviations`.
- Norsk språk i Lara-tekster (matcher resten av appen).
