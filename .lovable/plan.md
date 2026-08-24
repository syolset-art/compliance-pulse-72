# Tydeligere pakkeflyt: Lagre = aktiver, fast topp-knapp, egendefinert navn

## Bakgrunn (verifisert i koden)
I `MSPFrameworkTaskPackageSheet.tsx` er «Aktivert i salgsporteføljen»-bryteren og «Lagre pakke»-knappen i dag **to løskoblede handlinger**: bryteren lagrer `is_active` til databasen umiddelbart, mens «Lagre pakke» ligger nederst i en sticky bunnlinje. Pakkenavnet er hardkodet (`{Regelverk} — full leveranse`) og kan ikke endres.

## Mål
Én tydelig hovedhandling: **Lagre pakke** — alltid synlig øverst. Når pakken lagres, aktiveres den automatisk i salgsporteføljen og kan brukes i tilbud. Partneren kan gi pakken et eget navn, men ser tydelig at den er koblet til aktivering av regelverket.

## Endringer

### 1. Fast handlingslinje øverst i sheetet
- Ny sticky topp-rad i `MSPFrameworkTaskPackageSheet.tsx`, alltid synlig ved scrolling:
  - **Pakkenavn-felt** (redigerbart input): forhåndsutfylt med regelverkets navn, f.eks. «ISO 27001». Hjelpetekst under: «Visningsnavn i salgsporteføljen — pakken er koblet til aktivering av {regelverk}».
  - **Status-merke**: «Ikke lagret» / «Pakke lagret» / «Aktivert i salgsporteføljen».
  - **Primærknapp «Lagre pakke»** — alltid tilgjengelig.
- Den gamle sticky bunnlinjen beholder kun sekundærvalgene «Bruk i tilbud» og «Lagre som tjeneste».

### 2. Lagre = aktiver (én sammenhengende flyt)
- Den frittstående «Aktivert i salgsporteføljen»-bryteren fjernes fra toppen.
- Ved lagring settes pakken til aktiv (`is_active: true`) og toasten sier: «Pakken er lagret og aktivert i salgsporteføljen».
- Når pakken er aktiv vises en liten tekstknapp «Fjern fra salgsporteføljen» i topp-raden for de som vil deaktivere uten å slette pakken (bruker eksisterende `setActive(false)`).

### 3. Egendefinert pakkenavn
- `customName` legges inn i `FrameworkPackageState` (lagres i eksisterende JSONB-felt i `msp_framework_packages` — **ingen databasemigrering nødvendig**).
- `buildPackage()` bruker det egendefinerte navnet i `SavedFrameworkPackage.name` (standard: `{Regelverk} — full leveranse`), slik at navnet følger med inn i tilbud.
- Listen i `MSPFrameworkHoursTab.tsx` viser det egendefinerte navnet (med regelverksnavnet som undertekst) når det finnes.

### 4. Uendret
- Time-/prisberegning, oppgavelisten, Lara-forslag og «Nullstill til forslag» fungerer som i dag.

## Tekniske detaljer
- Filer: `src/components/msp/MSPFrameworkTaskPackageSheet.tsx`, `src/lib/frameworkTaskPackage.ts`, `src/hooks/useFrameworkPackages.ts`, `src/components/msp/MSPFrameworkHoursTab.tsx`.
- Ingen nye tabeller eller migreringer; `state`-kolonnen (JSONB) bærer det nye navnefeltet.
- `onToggleActive`-propen beholdes i forenklet form for «Fjern fra salgsporteføljen».
