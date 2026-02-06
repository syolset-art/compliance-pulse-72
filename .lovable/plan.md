

# Plan: Forbedret arbeidsområde-opprettelse med system/eiendel-valg og AI-forslag

## Oppsummering

Når et nytt arbeidsområde opprettes, skal brukeren umiddelbart bli guidet til å legge til systemer/eiendeler. Dette er kritisk for:
1. Å generere relevante prosessforslag via AI
2. Sikre at prosesser har koblet kontekst fra start
3. Forbedre onboarding-opplevelsen

---

## Nåværende flyt vs. ny flyt

| Nåværende | Ny |
|-----------|-----|
| Arbeidsområde opprettes → Ferdig | Arbeidsområde opprettes → Steg 5 viser AI-foreslåtte systemer → Bruker velger → (Valgfritt) Prosessforslag → Ferdig |
| Steg 5 sier "systemer kan kobles senere" | Steg 5 viser interaktiv liste med AI-foreslåtte og mal-baserte systemer |
| Ingen kobling mellom opprettelse og innhold | Komplett flyt fra arbeidsområde → systemer → prosesser |

---

## Del 1: Ny edge-funksjon for å foreslå systemer til arbeidsområde

Lager en ny `suggest-work-area-assets` edge-funksjon som:
- Tar inn `work_area_name` og `work_area_description`
- Henter company profile for bransje-kontekst
- Kombinerer `system_templates` med AI-genererte forslag
- Returnerer relevante systemer/eiendeler

```text
Input: { work_area_name: "HR og personal", description: "..." }

Output: {
  template_assets: [  // Fra system_templates
    { name: "HR-system", vendor: null, has_ai: true, ... },
    { name: "Rekrutteringsportal", vendor: null, has_ai: true, ... }
  ],
  ai_suggestions: [   // AI-generert basert på kontekst
    { name: "BambooHR", vendor: "BambooHR", reason: "...", ... }
  ]
}
```

---

## Del 2: Oppdatert AddWorkAreaDialog - Steg 5

Erstatter nåværende placeholder i steg 5 med:

**Ny komponent: `WorkAreaSystemsStep`**

```text
+--------------------------------------------------+
| Velg systemer for [Arbeidsområdenavn]            |
|                                                  |
| [Loader / Sparkles] Lara foreslår...             |
|                                                  |
| ─── Foreslåtte systemer (fra maler) ───          |
| [✓] HR-system                     [AI] [Mal]     |
| [✓] Rekrutteringsportal           [AI] [Mal]     |
| [ ] Kompetansesystem              [AI] [Mal]     |
|                                                  |
| ─── AI-forslag basert på din bransje ───         |
| [ ] BambooHR                      [AI] [Foreslått]|
| [ ] Workday                            [Foreslått]|
|                                                  |
| [Hopp over] [Neste: Legg til valgte (3)]        |
+--------------------------------------------------+
```

**Funksjonalitet:**
- Automatisk pre-select systemer fra `system_templates` som matcher arbeidsområde-navnet
- Vis AI-forslag fra ny edge-funksjon
- Vis AI-badge for systemer med `has_ai: true`
- Mulighet for å hoppe over (systemer kan fortsatt legges til senere)

---

## Del 3: Automatisk opprettelse av systemer/assets

Når brukeren klikker "Neste" eller "Opprett":

1. **Opprett arbeidsområdet** i `work_areas` tabellen
2. **Opprett valgte systemer** i `systems` tabellen med `work_area_id`
3. **Eller opprett som assets** i `assets` tabellen (for lokasjoner, nettverk etc.)
4. **Oppdater onboarding-progress** med `systems_added: true`

---

## Del 4: Valgfritt neste steg - Prosessforslag

Etter at systemer er lagt til, kan vi tilby:

```text
+--------------------------------------------------+
| [Sparkles] Lara kan foreslå prosesser            |
|                                                  |
| Basert på de valgte systemene kan Lara foreslå   |
| prosesser som:                                   |
| • Ansettelsesprosess (HR-system)                 |
| • Onboarding av nyansatte (HR, Kompetanse)       |
| • Rekruttering (Rekrutteringsportal)             |
|                                                  |
| [Hopp over] [Få prosessforslag fra Lara]        |
+--------------------------------------------------+
```

Dette trinnet er valgfritt og kan hoppe rett til bekreftelse.

---

## Del 5: Fil-endringer

| Fil | Handling |
|-----|----------|
| `supabase/functions/suggest-work-area-assets/index.ts` | Ny - Edge-funksjon for AI-forslag |
| `src/components/dialogs/AddWorkAreaDialog.tsx` | Oppdatert - Steg 5 med asset-velger |
| `src/components/dialogs/WorkAreaSystemsStep.tsx` | Ny - Komponent for system-valg |
| `src/components/dialogs/WorkAreaProcessSuggestionStep.tsx` | Ny - Valgfritt prosessforslag-steg |

---

## Tekniske detaljer

### Edge-funksjon: suggest-work-area-assets

```typescript
// Input
{ 
  work_area_name: string,
  work_area_description?: string 
}

// Output
{
  template_assets: SystemTemplate[],  // Fra system_templates
  ai_suggestions: AssetSuggestion[], // AI-generert
  work_area_type: string             // Matchet mal-type
}
```

**Logikk:**
1. Hent `system_templates` hvor `work_area_type` matcher (fuzzy match på navn)
2. Hent `company_profile` for bransje
3. Kall AI for å foreslå flere relevante systemer
4. Filtrer ut duplikater og returner kombinert liste

### WorkAreaSystemsStep-komponent

```typescript
interface WorkAreaSystemsStepProps {
  workAreaName: string;
  workAreaDescription: string;
  onSystemsSelected: (systems: SelectedSystem[]) => void;
  onSkip: () => void;
}

interface SelectedSystem {
  name: string;
  description: string | null;
  vendor: string | null;
  has_ai: boolean;
  source: "template" | "ai_suggestion" | "manual";
}
```

### Endring i AddWorkAreaDialog flyt

```text
Steg 1: Navn + Kontaktperson
Steg 2: Beskrivelse
Steg 3: Ansvarlig person
Steg 4: Innstillinger
Steg 5: Velg systemer/eiendeler [NY FUNKSJONALITET]
Steg 6: Bekreftelse (oppsummering inkl. valgte systemer)
```

---

## Brukeropplevelse

1. **Automatisk kontekst**: Systemer foreslås basert på arbeidsområde-navn
2. **Ingen tvang**: Brukeren kan alltid hoppe over systemvalg
3. **AI-markering**: Systemer med AI vises tydelig for compliance-tracking
4. **Sømløs overgang**: Valgte systemer opprettes automatisk
5. **Prosessforslag klar**: Med systemer på plass kan prosessforslag genereres umiddelbart

---

## Oppsummering av leveranser

1. **Ny edge-funksjon**: `suggest-work-area-assets` for intelligent forslag
2. **Ny komponent**: `WorkAreaSystemsStep` for interaktiv systemvelger
3. **Oppdatert dialog**: `AddWorkAreaDialog` med funksjonelt steg 5
4. **Forbedret flyt**: Fra tomme arbeidsområder til komplett struktur

