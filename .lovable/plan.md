## Forslag: skille **Kritikalitet** (bruker-satt) fra **Risiko** (avledet)

### Bakgrunn / observasjon
I dag bruker vi `risk_level` (low/medium/high) overalt — både på leverandører, systemer og assets — som om det var én ting. Men i praksis brukes feltet som "hvor kritisk er dette for oss", noe brukeren selv setter. Det skaper forvirring fordi:

- **Vendors**-tabellen har allerede *både* `criticality` og `risk_level` (+ `risk_score`, `risk_grade`) — vi blander dem i UI.
- **Assets/Systems** har et `risk_level`-felt som i realiteten er en kritikalitetsvurdering (f.eks. valgt i `VendorUsageTab`).
- Reell **risiko** bør være avledet fra data: TPRM-signaler, dokumentasjon (DPA/ISO/SOC2), tredjepartseksponering, sikkerhetshendelser, geografi, modenhetsscore osv.

### Foreslått begrepsmodell

| Begrep | Hvem setter | Hvor lagres | Brukes som |
|---|---|---|---|
| **Kritikalitet** (Lav / Middels / Høy / Kritisk) | Bruker (Work Area-eier / Vendor Manager) | `criticality` (finnes allerede på vendors og assets) | Forretningsverdi — "hvor mye skader det oss om dette feiler / lekker?" |
| **Risiko** (Lav / Moderat / Høy) | Avledet av Mynder/Lara | `risk_score` + `risk_grade` (finnes allerede på vendors) | Sannsynlighet × konsekvens basert på data |
| **Modenhet** | Avledet (compliance_score) | Eksisterende | Hvor godt kontrollene er etablert |

### Endringer i prototypen

1. **Språk i UI** — bytt etiketten der `risk_level` brukes som bruker-input:
   - `Systems.tsx`: kolonne "Risiko" → **"Kritikalitet"**, labels `Lav/Moderat/Høy kritikalitet`. Tooltip: *"Hvor kritisk dette systemet er for virksomheten — du setter dette selv."*
   - `VendorUsageTab.tsx` (asset-profil): "Risikonivå" select → **"Kritikalitet"**.
   - `WorkAreas.tsx`, `Assets.tsx`, `AssetSummaryWidget`, `AssetSummaryDashboard`: erstatt "Høy/Lav risiko" med "Høy/Lav kritikalitet" der verdien stammer fra brukerinput.
   - `nb.json` / `en.json`: nye nøkler `criticality.low|medium|high|critical`.

2. **Innfør avledet "Risiko"-visning** (kun lesing) på leverandørkortet:
   - Bruk eksisterende `risk_grade` / `risk_score` på vendors.
   - Liten Lara-badge i `VendorStatusRow` ved siden av modenhetsdonut: `Risiko: Moderat • beregnet av Lara`. Tooltip lister hvilke signaler som teller (manglende DPA, høy-kritikalitet bruk, leverandørland, åpne avvik …).
   - På systemkort: Risiko **avledes** fra (a) systemets kritikalitet, (b) leverandørens risk_grade, (c) compliance_score. Vises som sekundær pille; selve "Kritikalitet" blir hovedvalg brukeren styrer.

3. **Datamodell** (ingen migrasjon nødvendig nå — kun semantisk justering):
   - Behold `risk_level`-feltet i DB, men *behandle det som synonymt med `criticality`* i koden via en hjelper `getCriticality(entity)` som leser `criticality ?? risk_level`.
   - Reserver `risk_score` / `risk_grade` for avledede verdier. Lag `src/lib/derivedRisk.ts` med `computeRisk({criticality, complianceScore, vendorRiskGrade, openDeviations, hasDPA, ...})` → `{ grade: "low"|"medium"|"high", reasons: string[] }`.
   - (Senere migrasjon kan legge `criticality` på `systems` og fase ut `risk_level` der — utenfor denne runden.)

4. **Designsystem-konsistens (Mynder)**:
   - Kritikalitet → nøytral grå/blå pille (brukervalg, ikke alarm).
   - Risiko → statusfarger (grønn/orange/rød) — fordi den signaliserer noe Mynder/Lara faktisk har vurdert.
   - Tydelig visuell forskjell hjelper brukeren å skille "valg jeg har tatt" fra "vurdering Mynder har gjort".

### Filer som berøres
- `src/pages/Systems.tsx` (kolonne, label, tooltip, hjelpetekster)
- `src/components/systems/SystemStatusRow.tsx` (kritikalitet-pille + avledet risiko-pille)
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`
- `src/components/vendor-dashboard/VendorStatusRow.tsx` (vise avledet risiko fra Lara)
- `src/pages/WorkAreas.tsx`, `src/pages/Assets.tsx`, `AssetSummaryWidget`, `AssetSummaryDashboard`, `ContentViewer.tsx`
- `src/lib/derivedRisk.ts` *(ny)* — `computeRisk()` med begrunnelser
- `src/lib/criticality.ts` *(ny)* — labels, farger, `getCriticality(entity)`
- `src/locales/nb.json`, `src/locales/en.json` — nye nøkler

### Out of scope (kan tas senere)
- DB-migrasjon av `systems.risk_level` → `systems.criticality`.
- Backfill av `risk_score` for alle leverandører via en ekte beregning (nå: demo-verdier).
- Egen "Risiko-historikk"-tab på leverandørprofil.

Spør meg gjerne hvis du heller vil at vi *kun* gjør språkendringen først (steg 1) og holder den avledede risikoen til en senere iterasjon.