

# Plan: Credits-estimat ved aktivering av regelverk

## Oversikt

Oppdatere `FrameworkActivationDialog` til å vise et estimert credit-forbruk per regelverk, presentert på en lav-friksjon måte. Brukeren skal føle seg trygg — ikke bekymret for kostnader.

## Endringer

### 1. Legg til credit-estimat per regelverk i `planConstants.ts`
Legge til et `estimatedCredits`-felt på `Framework`-definisjonen eller som en separat mapping. Eksempel: GDPR ~5 credits, NIS2 ~15 credits, ISO 27001 ~10 credits osv. Disse representerer estimert AI-bruk for baseline-etablering.

### 2. Oppdater `FrameworkActivationDialog.tsx`
Legge til en ny seksjon mellom suksess-meldingen og score-advarselen:

- Ikon: `Sparkles` (credits-ikonet)
- Myk bakgrunn (primary/5)
- Tekst: "Vi estimerer ca. **~15 credits** for å etablere baseline for NIS2."
- Undertekst: "Du har X credits tilgjengelig. Du vil bli varslet om du trenger å fylle på — enkelt og raskt."
- Ingen prisdetaljer, ingen knapper for kjøp, ingen friksjon

Importere `useCredits` for å vise nåværende saldo i kontekst.

### 3. Filer som endres

| Fil | Endring |
|---|---|
| `src/lib/frameworkDefinitions.ts` | Legge til `estimatedCredits` per framework |
| `src/components/dialogs/FrameworkActivationDialog.tsx` | Ny credits-info-seksjon med saldo og estimat |

