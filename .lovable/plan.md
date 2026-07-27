## Mål
1. Gjøre om **Abonnement / Plan**-siden (`/subscriptions`) slik at den viser aktiverte og tilgjengelige moduler som kort, likt referansebildet «Moduler».
2. Fjerne pillen med aktivt plannavn (f.eks. «Start») fra **Plan**-menypunktet i sidebaren.

## Bakgrunn
- Nåværende `/subscriptions` viser tre prisplan-kort (Starter / Profesjonell / Enterprise) pluss en egen regelverk-liste.
- `CustomerModulesTab.tsx` har allerede den ønskede kortkomponenten med status-badge, beskrivelse, metainfo, pris og handlinger.
- Sidebaren har et **Plan**-menypunkt (`CreditMenuItem`) som viser aktiv plan som en pill/badge.

## Endringer

### 1. `src/components/sidebar/CreditMenuItem.tsx` — fjern «Start»-pillen
- Fjern `<span>`-elementet som rendrer `planName` som pill ved siden av «Plan».
- Behold ikon og label, slik at menypunktet fremdeles lenker til `/subscriptions`.
- Oppdater kommentar til at komponenten ikke lenger viser aktiv plan-badge.

### 2. `src/pages/Subscriptions.tsx` — ombygging til modulkort
- Erstatt dagens hero-overskrift, planbanner og plan-kort med en **Moduler**-overskrift og kortliste i samme stil som `CustomerModulesTab`.
- Vis følgende modulkort (tilpasset organisasjon / abonnement):
  - **Mynder Core** — status, beskrivelse, system-bruk/progress, pris, knapper for «Endre nivå» / «Avbestill».
  - **Regelverk** — aktive regelverk fra `selected_frameworks`, antall aktive, pris, knapp «Endre regelverk».
  - **Leverandørmodul** — status, antall leverandører, pris, knapp «Åpne modulen» / «Avbestill».
  - **Assets** — status, antall eiendeler, pris, knapp «Åpne modulen» / «Avbestill».
  - **Trust Profile** — status, URL, pris «Gratis / Inkludert i Core».
  - **Partner Workspace** (valgfritt, hvis relevant) — status, pris, knapp «Aktiver».
- Behold eksisterende datahenting fra `selected_frameworks` og `useSubscription()`.
- Bruk eksisterende `EditActiveFrameworksDialog` for regelverk og `FrameworkPurchaseDialog` for betalte regelverk.
- Vis månedlig total øverst i høyre hjørne.
- Behold funksjonalitet for å bytte plan (f.eks. via «Endre nivå»-knapp på Core-kortet) og for å aktivere/deaktivere regelverk.

### 3. Hjelpekomponenter og styling
- Trekk ut / gjenbruk kort-layout fra `CustomerModulesTab` (ev. opprette en liten gjenbrukbar `ModuleCard`-komponent) for å holde koden DRY.
- Sørg for at fargebruk følger prosjektets design-tokens (suksess-grønn for aktivert, nøytral for ikke aktivert, primærfarge for usage-badge).

### 4. Validering
- Kjør `bun run build` / `tsgo` for å sikre at endringer kompilerer.
- Verifiser at **Plan**-menypunktet i sidebaren ikke lenger viser «Start»-pillen.
- Verifiser at `/subscriptions` viser modulkort i stil med referansebildet.
