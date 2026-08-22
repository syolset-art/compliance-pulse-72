# Forenkle Regelverk-siden

Mål: mindre støy om Sara/agenter og godkjenning. Siden skal igjen handle om regelverkene og kravene — agentinfo vises kompakt og kun der det trengs.

## Det som støyer i dag

- **Forslagskøen** (`AgentFindingsQueue`) er en stor seksjon med egen forklaringsparagraf + et tungt kort per funn (agent-header, ansvarsgrense-banner, kildeboks med dok-ID/hash/versjon, godkjenningsboks). Samme funn vises i tillegg inne i kravlisten.
- **Hvert funn-kort** (`AgentFindingCard`) gjentar de samme forklaringene (BYOA-tekst, "kun ID og hash er delt", "påvirker ikke skåren") på hvert eneste funn.
- **Kravradene** har mange chips med lange tooltips (agent-badge, "Forslag", AUTO/MANUELL), og filterraden har en svær "Slik jobber Lara"-tooltip med kilder og analysesteg.

## Endringer

### 1. Forslagskø → kompakt stripe (standard lukket)
`AgentFindingsQueue` erstattes av én smal rad over kravlisten:

```text
[Inbox-ikon] 3 forslag fra din agent venter på godkjenning     [Gå gjennom]
```

- Klikk utvider listen i samme kort — ingen egen seksjon med introtekst.
- Når alt er avgjort vises ingenting (eller én diskre linje "Ingen forslag venter").
- Avgjorte funn skjules bak "Vis avgjorte (n)" — kun ventende vises som standard.

### 2. Funn-kort → tre linjer + utvidbar detalj
`AgentFindingCard` slankes til:
- Linje 1: agent-ikon + navn + konklusjon (én setning).
- Linje 2: obligatorisk ansvarsgrense som kort tekst: "Vurdert av din agent — dokument ikke delt med Mynder" (beholdes, men uten egen banner-boks).
- Linje 3: Godkjenn / Avvis (kun når status er "venter"), ellers én linje "Godkjent av Navn — dato".
- Kilde, dok-ID, hash, agentversjon og "kun ID og hash deles"-forklaring flyttes bak en "Detaljer"-lenke (utvider inline).
- All gjentatt forklaringstekst per funn fjernes — forklaringen finnes i hjelpepanelet.

### 3. Kravrader og filter — kortere forklaringer
- Agent-badge på kravrad beholdes, men tooltip kortes til én setning ("Dokumentasjon levert av din agent (Sara). Se køen over for godkjenning.").
- "Slik jobber Lara"-megatooltipen (kilder + analysesteg) kortes til én setning; utdypingen ligger allerede i hjelpepanelet til høyre.
- Funn-kortet inne i utvidet krav bruker samme slankede `AgentFindingCard` (ingen duplisert layout å vedlikeholde).

### 4. Bevares uendret
- Godkjenningsflyten (forslag teller ikke før navngitt person godkjenner), navngitt godkjenner, og WCAG-krav (tekstbasert status, ingen kursiv).
- "Vurdert av kundens egen agent — dokument ikke delt med Mynder" beholdes som synlig tekst på hvert funn — bare kortere og uten ekstra bokser.
- Ingen endring i data, logikk eller klassisk/beta-bryter.

## Teknisk
- `src/components/regulations/AgentFindingsQueue.tsx`: bygges om til collapsible stripe (egen `useState` for utvidet visning).
- `src/components/regulations/AgentFindingCard.tsx`: slankes, ny `Details`-utvider, prop `compact` ikke nødvendig — én felles slank layout brukes både i kø og i kravliste.
- `src/components/regulations/FrameworkRequirementsList.tsx`: kortere tooltips (agent-badge, "Forslag", "Lara følger opp").
- `src/pages/Regulations.tsx`: uendret plassering (kø-stripen ligger mellom detaljkort og kravliste).

## Akseptansekriterier
- Regelverk-siden viser maks én kompakt rad om agentfunn før brukeren aktivt åpner den.
- Ingen lange forklaringstekster synlige som standard — kun på hover/utvidelse.
- Godkjenning krever fortsatt eksplisitt handling med navngitt godkjenner.
