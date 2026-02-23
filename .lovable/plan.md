
# Ressurssenter 2.0 -- Modenhetsdrevet kunnskapssenter

## Konsept

Ressurssiden transformeres fra et generisk "hjelp-dashboard" til et **modenhetsdrevet kunnskapssenter** der "Kom i gang" ikke er en knapp som scroller til chat, men en strukturert, lesbar gjennomgang av compliance-prosessen. Brukeren ser umiddelbart hvor virksomheten befinner seg, hva som skjer i hver fase, og hvordan Mynder hjelper dem videre.

Siden har tre seksjoner:
1. **Modenhetsoversikt** -- Visuell stepper med aktiv fase, koblet til samme data som dashbordet
2. **Faseinnhold** -- Lesbar, utfyllbar visning av den valgte fasen (hva skjer, aktiviteter, Mynder-stotte, laeringsinnhold)
3. **Chat** -- Kontekstuell chat som automatisk tilpasser seg valgt fase

```text
Desktop:
+-------------------------------------------------------------+
|  Ressurssenter                                               |
|  Din compliance-prosess -- Forstaa hvor du er og hva du      |
|  skal gjore videre                                           |
+-------------------------------------------------------------+
|                                                              |
|  [Fundament] --> [Implementering] --> [Drift]                |
|   Fullfort        AKTIV              Neste                   |
|                                                              |
|  (separator) [Intern Audit] [Sertifisering] -- Valgfritt     |
|                                                              |
+-------------------------------------------------------------+
|                                                              |
|  IMPLEMENTERING -- Aktiv fase                                |
|  +---------------------------------------------------------+ |
|  | Hva skjer her?                                          | |
|  | Du utvikler policies, gjennomforer risikovurdering...   | |
|  |                                                         | |
|  | Aktiviteter:                                            | |
|  | [x] Policy-utvikling                                    | |
|  | [ ] Risikovurdering                                     | |
|  |                                                         | |
|  | Hvordan Mynder hjelper deg:                              | |
|  | - Compliance-sjekkliste: automatisk sporing av krav      | |
|  | - Risikovurdering: bygg-inn i systemprofilene            | |
|  | - Lara AI: hjelper deg skrive policies                   | |
|  |                                                         | |
|  | Les mer (utvidet laeringsinnhold)                        | |
|  +---------------------------------------------------------+ |
|                                                              |
|  Andre faser (kollapsede kort du kan klikke pa)              |
|  [Fundament - Fullfort] [Drift - Neste]                      |
|                                                              |
+-------------------------------------------------------------+
|  Kunnskapsbase                                               |
|  [GDPR] [NIS2] [ISO 27001] [AI Act]                         |
+-------------------------------------------------------------+
|  Chat med Lara  (kontekst = valgt fase)                      |
|  "Sporr meg om implementeringsfasen..."                      |
+-------------------------------------------------------------+
```

## Detaljerte endringer

### 1. `src/lib/certificationPhases.ts` -- Legg til Mynder-kobling

Utvid `PhaseDefinition` med `mynderFeatures_no` og `mynderFeatures_en` -- en liste over konkrete Mynder-funksjoner som stotter hver fase, med tilhorende ruter:

```typescript
interface MynderFeature {
  title: string;
  description: string;
  route: string;
}
```

Eksempler:
- **Fundament**: Onboarding-veiviseren (/onboarding), Gap-analyse (/compliance-checklist), Roller og ansvar (/work-areas)
- **Implementering**: Compliance-sjekkliste (/compliance-checklist), Risikovurdering (/tasks?view=readiness), Systemregistrering (/assets), Lara AI-assistent
- **Drift**: Avvikshanding (/deviations), Leverandoradministrasjon (/assets), Rapporter (/reports), Kundekrav (/customer-requests)
- **Intern Audit**: ISO Readiness (/tasks?view=readiness), Rapporter (/reports)
- **Sertifisering**: Trust Profile, Rapporter (/reports)

### 2. `src/pages/Resources.tsx` -- Fullstendig omskriving

**Ny struktur:**

**State**: `selectedPhase: CertificationPhase` (default = aktiv fase basert pa fremdrift, gjenbruker `useComplianceRequirements` fra dashbordet)

**Seksjon 1 -- Velkomstheader:**
- Tittel: "Ressurssenter"
- Undertekst: "Forstaa din compliance-prosess og hva du skal gjore videre"
- Modenhetsniva-badge som viser gjeldende fase

**Seksjon 2 -- Fasestepper (horisontal):**
- Gjenbruker data fra `CERTIFICATION_PHASES`
- Klikk pa en fase setter `selectedPhase`
- Visuelt identisk med dashbordets stepper (progresjonslinje), men storre og mer prominent
- Valgfrie faser separert med "Valgfritt"-badge

**Seksjon 3 -- Valgt fase (hoveddelen):**
- Stor, lesbar seksjon med:
  - Fasenavn og status-badge (Fullfort/Aktiv/Neste)
  - "Hva skjer i denne fasen?" -- `whatToExpect_no/en`
  - Aktiviteter med sjekkmerker (beregnet fra fremdrift)
  - **NY: "Slik hjelper Mynder deg"** -- liste over plattformfunksjoner med lenker
  - Utvidbart laeringsinnhold (`learningContent_no/en`) med ikon og "Les mer"-toggle
- De andre fasene vises som kompakte klikkbare kort under

**Seksjon 4 -- Kunnskapsbase:**
- Horisontale kort (GDPR, NIS2, ISO, AI Act) -- beholder eksisterende data

**Seksjon 5 -- Chat:**
- Chatvindu med kontekst satt til valgt fase
- Foreslatte sporsmaal tilpasses valgt fase

**Mobil:**
- Fasestepper som vertikale kort
- Valgt fase vises utvidet
- Chat i full bredde under

### 3. `src/components/support/SupportChat.tsx` -- Fase-kontekst

- Legg til en mapping fra `CertificationPhase` til kontekst-prompt og foreslatte sporsmaal
- Nar `activeContext` matcher en fase-id, tilpasses chat-velkomsten og forslagene

### Filer som endres
1. **`src/lib/certificationPhases.ts`** -- Legg til `mynderFeatures_no/en` med ruter
2. **`src/pages/Resources.tsx`** -- Full omskriving til modenhetsdrevet layout
3. **`src/components/support/SupportChat.tsx`** -- Legg til fase-kontekst mapping

## Tekniske detaljer

### Ny type i certificationPhases.ts
```typescript
export interface MynderFeatureLink {
  title_no: string;
  title_en: string;
  description_no: string;
  description_en: string;
  route: string;
}

// Legges til i PhaseDefinition:
mynderFeatures: MynderFeatureLink[];
```

### Resources.tsx dataflyt
- Importerer `CERTIFICATION_PHASES`, `getPhaseStatus`, `getMaturityLevel` fra certificationPhases
- Bruker `useComplianceRequirements` for a hente fremdrift (samme som dashbordet)
- `selectedPhase` state med default til gjeldende aktive fase
- Rendrer fase-stepper, fase-detaljer, kunnskapskort og chat

### SupportChat fase-mapping
```typescript
const phaseSuggestions: Record<string, string[]> = {
  foundation: ["Hva bor vaere i scopet mitt?", "Hvordan gjor jeg en gap-analyse?"],
  implementation: ["Hvordan skriver jeg en policy?", "Hjelp med risikovurdering"],
  operation: ["Hvordan handterer jeg avvik?", "Tips til awareness-trening"],
  // ...
};
```
