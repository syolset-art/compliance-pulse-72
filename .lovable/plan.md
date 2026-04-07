

## Plan: Koble historisk utvikling til kravhendelser

Problemet i dag er at grafen viser en kurve uten kontekst — brukeren ser at scoren gikk opp eller ned, men vet ikke *hvorfor*.

### Løsning: Event-annotasjoner på grafen

Legge til markører (dots/events) på grafen som viser *hvilke krav* som ble oppfylt eller mistet status på gitte datoer. Når brukeren hovrer over en markør, vises et tooltip med kravnavn og hva som skjedde.

### Endringer

**1. Utvide demo-datagenereringen i `ComplianceHistoryChart.tsx`**
- Generere demo-hendelser knyttet til datapunktene: f.eks. "GDPR-1.2 ble oppfylt", "AI-ACT-3.1 endret til delvis"
- Bruke kravdata fra `getRequirementsByFramework` for realistiske kravnavn
- Legge hendelsene som en `events`-array på hvert datapunkt

**2. Vise hendelsesmarkører på grafen**
- Bruke `ReferenceDot` eller custom dots på datapunkter som har hendelser — litt større, annen farge (grønn for oppfylt, rød for tapt)
- Utvide Tooltip til å vise hendelseslisten når brukeren hovrer over et punkt med hendelser

**3. Vise en hendelses-tidslinje under grafen**
- En kompakt liste med de siste 5-8 hendelsene under grafen: dato, krav-ID, hva som skjedde
- Fargekodede ikoner (CheckCircle for oppfylt, CircleAlert for delvis, Circle for tapt)
- Klikk på en hendelse scroller ned til det aktuelle kravet i listen og ekspanderer det

**4. Koble klikk fra tidslinje til kravlisten**
- `ComplianceHistoryChart` tar en ny prop `onEventClick(requirementId: string)`
- `Regulations.tsx` kobler denne til `FrameworkRequirementsList` via en ny `highlightRequirementId` prop som auto-ekspanderer og scroller til kravet

### Tekniske detaljer
- Nye props: `ComplianceHistoryChart` får `frameworkId` (har allerede) + `onEventClick`
- `FrameworkRequirementsList` får `highlightRequirementId` som setter `expandedId` og trigger scroll
- All data er fortsatt demo — hendelsene genereres deterministisk fra krav-IDer og seed

