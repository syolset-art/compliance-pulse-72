

## Plan: Endre CTA på Pro Badge — gratis frem til lansering

CTA-knappen på Pro Badge-kortet i Trust Profile (Share & Publish) skal endres fra "Oppgrader for å tilpasse badge" til en melding som tydeliggjør at funksjonen er gratis frem til offisiell lansering.

### Endringer

**Fil:** `src/pages/TrustCenterProfile.tsx` (linje 824-827)

**1. CTA-knapp**
- Tekst (NB): "Aktiver Pro Badge — gratis frem til lansering"
- Tekst (EN): "Activate Pro Badge — free until launch"
- Ikon: `Sparkles` beholdes
- Klikk åpner samme `setUpgradeDialogOpen(true)` (eller eventuelt en toast som bekrefter aktivering — se under)
- Stil beholdes (`bg-primary hover:bg-primary/90`)

**2. Liten "Gratis"-pille over knappen**
- Subtil chip: `bg-success/10 text-success border-success/20`
- Tekst (NB): "Gratis i lanseringsperioden"
- Tekst (EN): "Free during launch period"
- Plasseres rett over knappen, sentrert

**3. Pro-badgen i header (linje 786-789)**
- Endres fra grå "Pro" outline til grønn "Gratis nå"-pille
- NB: "Gratis nå" / EN: "Free now"
- Stil: `bg-success/10 text-success border-success/20`

### Designtokens
- Bruker eksisterende `success`-token (grønn) — matcher Mynders risikofargesystem
- Apple-minimal, ingen tunge skygger
- Beholder Pro Badge-kortets eksisterende layout og spacing

### Ut av scope
- Faktisk aktiveringslogikk / backend-flagg (kun UI-tekst nå)
- Endring av selve oppgraderingsdialogen (`UpgradeDialog`)

