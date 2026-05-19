# Mer konkrete Lara-steg i «Pågående oppdrag»

Gjør demoen troverdig ved å vise *hva* Lara faktisk gjør (med hvilken integrasjon) og *hvor* grensen mot manuelt partnerarbeid går.

## Hva som endres

### 1. Datamodell — `DeliveryActivity`
Utvider hvert Lara-steg fra `string` til objekt med valgfri integrasjon:

```ts
type LaraStep = string | { text: string; via?: string };
laraSteps?: LaraStep[];
```

Bakoverkompatibel — strenger funker fortsatt.

### 2. Seed-data — stram opp alle aktiviteter i `MSPMaturityServiceMatrix.tsx`

Eksempel «Re-test phishing og rapportering»:

```text
Lara utfører automatisk
- Hentet baseline fra Q1: 18 % klikk, 24 % rapportert      via KnowBe4
- Valgt nytt scenario «DHL pakkesporing» (unngår gjenkjenning)  via KnowBe4
- Bygget mottakerliste: 138 ansatte, eksklud. nyansatte    via Entra ID
- Planlagt utsending tirs–ons (sprer 48 t)                 via KnowBe4
- Samler klikk/rapportering i sanntid                      via KnowBe4
- Genererer trendrapport: 18 % → 9 % klikk-rate            via Lara
- Mapper resultat til ISO 27001 A.6.3                      via Lara

Partner manuelt
- Godkjenne phishing-scenario før utsending (etisk sjekk)
- 1:1-samtale med 3 repeat offenders
- Presentere rapport for kundens ledergruppe
```

Tilsvarende oppstramming for:
- Baselinemåling phishing (samme stil)
- Kvartalsvis e-læring (`via Microsoft 365 Learning`, `via HR-system`)
- Målrettet opplæring ledergruppen (`via Outlook`, `via Entra ID`)
- Penetrasjonstest aktivitetene (`via Tenable`, `via Jira`)
- Sårbarhetshåndtering (`via Tenable`, `via Microsoft Defender`)
- Policy-utkast (`via Lara`, `via Microsoft 365`)

### 3. Visning av integrasjons-badge

I `DeliveryWizard.tsx` (Lara utfører-kortet) og `DeliverySummaryDialog.tsx`:
- Hvert steg rendres med tekst + liten badge `via {integration}` til høyre
- Badge: `text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/15`
- Hvis `via` mangler → ingen badge

### 4. «Hvordan Lara jobber»-info-boks

Ny komponent `LaraMechanicsCallout.tsx`, vises som collapsible boks øverst i wizarden (lukket som default):

```text
ⓘ Hvordan Lara jobber for deg
Lara er koblet til kundens systemer via standard-integrasjoner (Microsoft 365,
Entra ID, KnowBe4, Tenable, Jira m.fl.). Hun utfører rutineoppgaver automatisk
— henting av data, kampanje-utsending, rapport-generering — og overlater 
juridiske, etiske og relasjonsbaserte oppgaver til deg som partner.

[Aktiverte integrasjoner: Microsoft 365, Entra ID, KnowBe4, Tenable, Outlook]
```

Plasseres rett under leveranse-velgeren, lagrer åpen/lukket-state i localStorage.

## Tekniske detaljer

**Filer som endres:**
- `src/components/msp/MSPMaturityServiceMatrix.tsx` — type-utvidelse + seed
- `src/components/msp/DeliveryWizard.tsx` — render badge på Lara-steg + plassere callout
- `src/components/msp/DeliverySummaryDialog.tsx` — render badge på Lara-steg

**Ny fil:**
- `src/components/msp/LaraMechanicsCallout.tsx` — collapsible info-boks

**Hjelper:**
- Liten util `getStepText(step)` og `getStepVia(step)` for å håndtere både `string` og `{text, via}`-form

Ingen endringer i RLS, edge functions eller backend — kun frontend + seed-data.
