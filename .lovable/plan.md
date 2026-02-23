

# Compliance-prosessen som kontinuerlig forbedring

## Problemet

I dag bruker vi "reise" og "sertifisering" som hovedmetafor. Dette gir inntrykk av at compliance har en slutt. I virkeligheten er de fleste kunder i **drift-fasen** og trenger ikke intern audit eller sertifisering. Fasene mangler innhold -- brukeren kan ikke klikke seg inn og lese hva som faktisk skjer i hver fase.

## Konsept

Erstatter "reise"-metaforen med en **kontinuerlig modenhetsprosess** der fasene er interaktive og lesbare. De tre forste fasene (Fundament, Implementering, Drift) er kjernen. Audit og Sertifisering markeres som valgfrie tillegg.

```text
+---------------------------------------------------------------------+
|  Din compliance-modenhet              Modenhetsniva: Implementering  |
+---------------------------------------------------------------------+
|                                                                     |
|  [Fundament]  [Implementering]  [Drift]  | [Intern Audit] [Sert.]  |
|   Fullfort      Aktiv fase       Neste   |   Valgfritt     Valgfritt|
|                                          |                          |
+------------------------------------------+--------------------------+
|                                                                     |
|  Utvidet fase-panel (klikkbar):                                     |
|  +-----------------------------------------------------------------+|
|  | IMPLEMENTERING -- Aktiv fase                                    ||
|  |                                                                 ||
|  | Hva skjer i denne fasen?                                        ||
|  | Du utvikler policies, gjennomforer risikovurdering og           ||
|  | definerer kontrolltiltak for virksomheten.                      ||
|  |                                                                 ||
|  | Aktiviteter:                                                    ||
|  | [x] Policy-utvikling                                            ||
|  | [x] Risikovurdering                                             ||
|  | [ ] Risikobehandling                                            ||
|  | [ ] Malsetting                                                  ||
|  |                                                                 ||
|  | Les mer om denne fasen ->                                       ||
|  +-----------------------------------------------------------------+|
+---------------------------------------------------------------------+
```

## Endringer

### 1. `src/lib/certificationPhases.ts` -- Utvid datamodell

- Legg til `optional: boolean` pa PhaseDefinition (true for audit og certification)
- Legg til `learningContent_no` og `learningContent_en` -- lengre forklaringstekst for hver fase
- Legg til `whatToExpect_no/en` -- "Hva skjer her?" kort forklaring
- Endre kommentar fra "Certification Phases" til "Compliance Maturity Phases"

### 2. `src/components/iso-readiness/CertificationJourney.tsx` -- Gjor interaktiv

- Gi nytt navn: `ComplianceMaturityStepper`
- Klikk pa en fase apner et utvidet panel med:
  - Fasebeskrivelse (whatToExpect)
  - Aktivitetsliste med sjekkmerker basert pa fremdrift
  - Lengre laeringsinhold (learningContent)
- Audit og Sertifisering vises med "Valgfritt"-badge og separator
- Erstatt spinner-ikon for aktiv fase med et mer moderne pulserende design

### 3. `src/components/widgets/PostOnboardingRoadmapWidget.tsx` -- Oppdater sprak

- Endre "Din compliance-reise" til "Din compliance-prosess"
- Endre "Fase:" til "Modenhetsniva:"
- Vis audit/sertifisering som dempet/valgfritt i stepperen

### 4. `src/pages/Auth.tsx` -- Oppdater tekst

- Endre "starte din compliance-reise" til "starte din compliance-prosess"

### 5. Lokalisering (`nb.json` / `en.json`)

- Oppdater `isoReadiness.journey.title` fra "Sertifiseringsreisen" til "Compliance-modenhet"
- Legg til nye nokler for valgfritt-badge, fase-innhold og "Les mer"

## Tekniske detaljer

### Utvidet PhaseDefinition
```typescript
export interface PhaseDefinition {
  id: CertificationPhase;
  name_no: string;
  name_en: string;
  description_no: string;
  description_en: string;
  percentageRange: [number, number];
  activities_no: string[];
  activities_en: string[];
  optional: boolean;            // NY: true for audit og certification
  whatToExpect_no: string;      // NY: kort forklaring
  whatToExpect_en: string;
  learningContent_no: string;   // NY: lengre innhold brukeren kan lese
  learningContent_en: string;
}
```

### Interaktiv CertificationJourney (ny ComplianceMaturityStepper)
- `useState` for `expandedPhase: CertificationPhase | null`
- Klikk pa fase toggler expanded panel
- Collapsible animasjon med Radix Collapsible
- Audit og Certification rendres etter en visuell separator med "Valgfritt"-badge
- Pa mobil: fase-kort stables vertikalt med fulle beskrivelser synlige

### Filer som endres
1. `src/lib/certificationPhases.ts` -- Utvid data, legg til optional-flagg og innhold
2. `src/components/iso-readiness/CertificationJourney.tsx` -- Omskrives til ComplianceMaturityStepper med ekspanderbare faser
3. `src/components/widgets/PostOnboardingRoadmapWidget.tsx` -- Oppdater sprak og vis valgfritt-markering
4. `src/pages/Auth.tsx` -- Endre "reise" til "prosess"
5. `src/locales/nb.json` -- Oppdater titler og nye nokler
6. `src/locales/en.json` -- Tilsvarende engelske verdier

