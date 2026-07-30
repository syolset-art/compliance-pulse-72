## Problem

Siste steg i «Legg til kunde» (`step === "recommend"`, Laras anbefaling) er tett, vanskelig å lese og gjentar informasjon som allerede finnes på kundekortet. Regelverksanbefalinger hører hjemme i **Veiledning fra Mynder**, der `RegulationsStatusCard` allerede viser dem i tabellform med Bekreft/Aktiver-handlinger.

## Endring

**1. Fjern anbefalingssteget i `src/components/msp/AddMSPCustomerDialog.tsx`**
- Ta bort hele `step === "recommend"`-blokken og `"recommend"` fra `STEP_LABELS` (wizarden blir metode → land → søk → kontakt).
- «Fullfør»-knappen på kontaktsteget kaller `handleSave` direkte i stedet for `setStep("recommend")`.
- Behold beregningen av anbefalinger, men kjør den i `handleSave` (samme `recommendFrameworks`-kall med land, bransje, ansatte, beskrivelse) og lagre resultatet som `recommended_frameworks`. `confirmed_frameworks` lagres tomt — partneren bekrefter i Veiledning.
- Fjern nå ubrukt state (`confirmedRecommendations`, `recommendations`-effekten som var bundet til steget) og import av `CustomerRecommendationsPanel` hvis den ikke brukes andre steder.

**2. Suksess-steget får en peker videre**
- Teksten utvides med en kort linje: «Lara har foreslått relevante regelverk — du finner dem under Veiledning fra Mynder.» Ingen ny knapp.

**3. Lesbarhet i `RegulationsStatusCard`**
- Regelverksnavnet står i dag som label + alias-span på samme linje i liten grå tekst (f.eks. «GDPR Personopplysningsloven»). Endres til: navn i normal vekt/foreground på egen linje, alias som `text-xs text-muted-foreground` under — med tydelig kontrast (WCAG AA).

Ingen endringer i datamodell eller edge functions; `recommended_frameworks` skrives allerede av wizarden i dag.
