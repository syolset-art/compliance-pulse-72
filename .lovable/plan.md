# Vis modenhet per kontrollområde under demoen

## Bakgrunn

Wizardens steg 6 (`MaturityStep` i `ActivateTrustProfileWizard.tsx`) viser allerede ett kort per kontrollområde fra `MATURITY_AREAS` med Laras forhåndsutfylte svar. Problemet er at alle kortene starter sammenslått (`openAreas = {}`), så under autoplay-demoen ser det ut som om siden hoppes over — viseren rekker bare å se sammenslåtte titler i ~5 sekunder før demoen går videre til synlighet.

Laras svar er allerede seedet via `seedMaturityDefaults` i steg 2/3, så innholdet finnes — det er bare ikke synlig.

## Endringer

### 1. `MaturityStep` (samme fil, ca. linje 1274–1280)
- Legg til prop `autoPlay?: boolean`.
- Når `autoPlay` er true, kjør en `useEffect` som åpner hvert område i `MATURITY_AREAS` sekvensielt med ~900 ms mellomrom (første åpnes umiddelbart). Bruk `setOpenAreas` slik at brukeren manuelt fortsatt kan toggle.
- Effekten rydder timere ved unmount.

### 2. Bruk i wizarden (linje 688)
- Send `autoPlay={autoPlay}` til `<MaturityStep …/>`.

### 3. Lengre lesetid på steg 6 (linje 528–535)
- Øk `readDelays[6]` fra `5000` til ca. `12000` ms slik at alle 4 områdene rekker å åpne seg og viseren får se Lara-badges og ja/nei-knappene per kontrollområde før demoen går videre.

## Filer som endres
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` (kun presentasjonslogikk i wizarden)

Ingen endringer i datamodell, MaturityStep-svar, eller backend.
