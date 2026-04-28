## Mål

Berike Lara-innboksen så brukeren ser realistisk dokumentflyt:
1. Flere dokumenter venter i innboksen
2. Lara analyserer dem (synlig "analyserer"-tilstand)
3. Når analysen er ferdig får brukeren beskjed (toast + indikator)
4. Brukeren kan se analyseresultatet og deretter godkjenne at det beriker leverandørens trust score

## Endringer

### 1. Database: utvid `lara_inbox` med analyse-status

Legg til kolonner via migrasjon:
- `analysis_status` (text, default `'pending'`) — `pending` | `analyzing` | `analyzed`
- `analyzed_at` (timestamptz, nullable)
- `analysis_summary` (jsonb, nullable) — Laras strukturerte funn (typer: bekrefter, berører, evidence-poeng, eventuelle merknader)

Eksisterende `status`-felt beholdes (`new` → `manually_assigned` / `rejected`) for selve godkjenning/avvisning.

### 2. Seed flere ventende dokumenter (insert-tool)

Sett inn ~5–7 nye `lara_inbox`-rader med `status='new'` fordelt på flere leverandører (Atea, TietoEvry, Visma, Microsoft, AWS, Salesforce, Atlassian). Variert dokumenttype: `iso27001`, `soc2`, `dpa`, `penetration_test`, `dpia`.

Innledende `analysis_status`:
- 2 stk `analyzed` (klare for brukerens godkjenning, med ferdig `analysis_summary`)
- 2 stk `analyzing` (Lara jobber — viser progress)
- 2 stk `pending` (i kø)

### 3. UI-endringer i `LaraInboxTab.tsx`

**Tre seksjoner i stedet for to:**
```text
┌─ Klar for din godkjenning  [N]   ← analysis_status='analyzed'
│   • Viser Laras funn + "Godkjenn og berik trust score"
├─ Lara analyserer  [N]            ← analysis_status='analyzing'
│   • Pulserende Sparkles + "analyserer …"
├─ I kø  [N]                       ← analysis_status='pending'
│   • Diskret liste, "Venter på Lara"
└─ Behandlet                       ← som i dag
```

**Knapper i "Klar for godkjenning":**
- Primær: "Godkjenn og berik trust score" (grønn `Sparkles` → `CheckCircle2`)
- Sekundær: "Avvis"
- Klikk på rad utvider og viser `analysis_summary`-detaljene Lara fant

**Auto-progresjon (demo-realisme):**
- Når komponenten mountes, finn `pending`-elementer eldre enn 30 sek → flytt til `analyzing`
- Finn `analyzing`-elementer eldre enn ~45 sek → sett `analysis_status='analyzed'`, generer enkel `analysis_summary` basert på `matched_document_type`, og vis sonner-toast: *"Lara har analysert {filename}. Klar for godkjenning."*
- Re-fetch hvert 15. sek (`refetchInterval`) så brukeren ser bevegelse

### 4. Godkjenn-handlingen

`approveMutation` (eksisterende) brukes uendret — kun knappetekst/ikon flyttes hit. Resultatet er fortsatt:
- Dokumentet flyttes til `vendor_documents`
- `ApprovalSuccessDialog` viser TPRM-beriket score

## Filer som endres

- **Migrasjon** — nye kolonner på `lara_inbox`
- **Insert** (data-tool) — seed nye inbox-rader
- `src/components/asset-profile/tabs/LaraInboxTab.tsx` — tre-seksjons-UI, polling, auto-progresjon, justerte knappetekster
