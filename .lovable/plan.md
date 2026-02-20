

# Post-onboarding veiviser: "Hva gjor jeg na?"

## Bakgrunn

Etter at onboarding er fullfort (selskapsinfo, rammeverk, systemer, arbeidsomrader), forsvinner OnboardingProgressWidget og brukeren star igjen uten tydelig retning. Dashbordet viser widgets med tall og statuser, men ingen handlingsplan eller tidslinje.

## Losning: "Compliance Roadmap" widget

Erstatt OnboardingProgressWidget med en ny **PostOnboardingRoadmap**-widget som vises nar onboarding er ferdig. Denne gir brukeren en PECB-forankret handlingsplan med konkrete neste steg, tidshorisont og mestringsfølelse.

### PECB-rammeverkets anbefalte arshjul

PECB (ISO Lead Implementer) definerer et kontinuerlig forbedringslop med klare milepaler:

| Periode | Aktivitet | Hva brukeren gjor i Mynder |
|---------|-----------|---------------------------|
| Maned 1-2 | Gap-analyse og scope | Fullfore compliance-sjekklisten per domene |
| Maned 2-3 | Risikovurdering | Gjennomga og score risiko pa systemer |
| Maned 3-4 | Policies og dokumentasjon | Laste opp/generere policyer, DPA-er |
| Maned 4-6 | Kontrollimplementering | Lukke manuelle krav, sette opp leverandorstyring |
| Maned 6-9 | Overvaking og opplaring | Mynder Me kurs, avviksrapportering |
| Maned 9-12 | Internrevisjon | Gjennomga status, forberede ledelsesgjennomgang |
| Arlig | Vedlikehold | Review-datoer, re-sertifisering |

### Widget-design

Widgeten vises ovenfor resten av dashbordet (der OnboardingProgressWidget var) og inneholder:

1. **Navaerende fase** -- henter fra `certificationPhases.ts` basert pa compliance-score
2. **Neste 3 prioriterte handlinger** -- dynamisk beregnet fra:
   - Compliance-krav med status `not_started` og prioritet `critical`/`high`
   - Systemer som mangler risikovurdering
   - Leverandorer uten dokumenter
   - Forfalt review-dato
3. **Tidshorisont-indikator** -- "Du er i maned 2 av din compliance-reise"
4. **Fremgangsbjelke** med PECB-fasene som steg (gjenbruk CertificationJourney-komponenten)

### Teknisk plan

**Ny fil: `src/components/widgets/PostOnboardingRoadmapWidget.tsx`**
- Bruker `useComplianceRequirements({})` for a beregne total compliance-score
- Bruker `CERTIFICATION_PHASES` og `getPhaseStatus` fra `certificationPhases.ts`
- Henter data fra `assets`, `system_risk_assessments`, `systems` for a identifisere mangler
- Beregner "neste handlinger" dynamisk basert pa hva som faktisk mangler
- Viser `CertificationJourney` som stepper overst
- Inkluderer en "Se arskalender"-knapp som ekspanderer en enkel tidslinje

**Ny fil: `src/components/widgets/ComplianceCalendarSection.tsx`**
- Collapsible arskalender-visning inni roadmap-widgeten
- 4 kvartaler med forventede aktiviteter
- Markerer navaerende kvartal
- Kobler hver aktivitet til relevant side i Mynder (f.eks. klikk pa "Risikovurdering" gar til /tasks?view=readiness)

**Endring: `src/components/widgets/OnboardingProgressWidget.tsx`**
- Nar `isFullyComplete === true`, vis PostOnboardingRoadmapWidget i stedet for a returnere `null`

**Endring: `src/pages/Index.tsx`**
- Ingen endring nodvendig -- OnboardingProgressWidget rendres allerede pa linje 276

### Dynamiske handlinger -- logikk

Widgeten prioriterer handlinger i denne rekkefølgen:

```text
1. Kritiske compliance-krav (manual, not_started, critical priority)
2. Systemer uten risikovurdering
3. Leverandorer uten dokumenter (vendor_documents count = 0)
4. Systemer med forfalt review-dato
5. Manglende DPA-er for databehandlere
6. Kurs som ikke er gjennomfort (Mynder Me)
```

Hver handling vises som et kort med:
- Ikon og tittel
- Kort beskrivelse
- Knapp som navigerer til riktig sted
- Badge som viser PECB-fase (f.eks. "Implementering")

### Mestringselement

- Vis antall fullforte handlinger / total ("12 av 47 fullfort")
- Vis en "streak"-indikator: "3 uker pa rad med aktivitet"
- Nar brukeren fullforer en fase, vis en kort gratulasjon med konfetti (gjenbruk canvas-confetti)
- Progressbar viser tydelig bevegelse fra forrige uke

### Arskalender-innhold (CollapsibleSection)

```text
Q1 (Jan-Mar): Gap-analyse, scope, roller
Q2 (Apr-Jun): Risikovurdering, policy-utvikling, leverandoravtaler
Q3 (Jul-Sep): Kontroller, opplaring, overvaking
Q4 (Okt-Des): Internrevisjon, ledelsesgjennomgang, forbedring
```

Hvert kvartal viser:
- Sjekkliste med 3-4 aktiviteter
- Antall fullforte vs totale
- Lenker til relevante sider

