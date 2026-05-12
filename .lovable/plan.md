## Mål

Vise samme Trust Score (sirkel-gauge) som på selve Trust Profile-siden, inne i aktiveringsveiviseren — beregnet av Lara basert på svarene brukeren ga i Modenhet-steget (steg 4). Brukeren skal forstå at dette er en foreløpig skår som vil endre seg når flere kontroller besvares i Regelverk.

## UX-flyt

**Steg 4 → 5 (Modenhet → Dokumenter):**

1. Bruker klikker **«Til dokumenter»**.
2. I stedet for å hoppe rett til steg 5, vises en kort mellomtilstand (ca. 1,5–2 sek) i veiviser-bodyen:
   - Lara-spinner + tekst: «Lara beregner foreløpig Trust Score …»
   - Liste med 3 mikrosteg som krysses av etter hvert (Vekter svar mot rammeverk · Sammenstiller dokumenter · Sammenligner mot bransjestandard).
3. Når beregningen er ferdig, går veiviseren videre til steg 5.

**Steg 5 (Dokumenter):**

- Helt øverst, før dokumentopplasting-listen, vises en **Trust Score-kort**:
  - Liten sirkel-gauge (samme stil som på profilsiden, men kompakt) med tall + `/100` + farget label (LOW/MODERATE/HIGH TRUST).
  - Kort tekst til høyre: «Foreløpig Trust Score basert på modenhetssvarene dine. Skåren oppdateres når du laster opp dokumenter under, og fortsetter å øke når du svarer på flere kontrollpunkter under Regelverk i menyen.»
  - Skåren oppdateres live når brukeren laster opp dokumenter (siden opplasting kan flippe et modenhetssvar til «Ja»).

## Skår-beregning

Enkel, transparent formel i en liten lokal helper:

```
score = round( (antall "yes" / totalt antall spørsmål) * 100 )
label = score >= 80 ? HIGH : score >= 50 ? MODERATE : LOW
```

Dette matcher logikken i `TrustCenterProfile.tsx` (`trustLabel`/`trustColor`).

## Endringer (kun frontend)

**`src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`**
- Ny state: `isCalculating` (boolean) + `calcStep` (0–3) for mikrosteg-animasjon.
- Endre `next()` slik at klikk på «Til dokumenter» (når `step === 4`) først setter `isCalculating = true`, animerer mikrostegene, og deretter setter `step = 5` og `isCalculating = false`.
- I `body`: når `step === 4 && isCalculating`, render en ny `<CalculatingScoreStep />`-komponent i stedet for MaturityStep.
- Disable Tilbake/Videre-knappene mens `isCalculating`.
- Send beregnet `trustScore` (memo fra `maturityAnswers`) inn i `<DocumentsStep />`.

**Ny komponent i samme fil: `CalculatingScoreStep`**
- Sentrert Loader2/Sparkles-animasjon med Lara-aksent.
- Tre rader med Check-ikoner som lyser opp én etter én.

**Oppdatert `DocumentsStep`**
- Ny prop: `trustScore: number`.
- Nytt kort øverst med kompakt Trust Score-gauge (gjenbruker SVG-mønsteret fra `TrustCenterProfile.tsx`, men i en liten variant — ca. 80–96 px sirkel).
- Forklarende tekst som beskrevet i UX-flyten.

**Ingen endringer på Trust Profile-siden.** Ingen nye routes, ingen backend-endringer.

## Tekniske detaljer

```text
Veiviser body
├── step 4 + !isCalculating → <MaturityStep ... />
├── step 4 + isCalculating  → <CalculatingScoreStep step={calcStep} />
└── step 5                  → <DocumentsStep trustScore={...} ... />
```

Alle eksisterende design-tokens og semantiske farger (`text-success`, `text-warning`, `text-destructive`, `bg-primary/5`) gjenbrukes — ingen nye Tailwind-tokens.