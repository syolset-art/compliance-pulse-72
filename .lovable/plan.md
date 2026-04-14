

## Plan: Kontrollstatus-widget med reelle data og intervallvelger

### Oversikt
Oppgraderer ControlsWidget til å vise faktiske kontrolldata fra compliance requirements, gruppert per kontrollområde (SLA-kategori). Legger til en intervallvelger slik at brukeren kan se endringer over siste dag, uke, måned osv.

### Hva endres

**`src/components/widgets/ControlsWidget.tsx`** — full omskriving:

1. **Reelle data fra compliance-hook**: Bruker `useComplianceRequirements()` for å hente krav og `stats.byDomainArea` for å få score per kontrollområde (governance, operations, identity_access, supplier_ecosystem, privacy_data).

2. **Kontrollområder med telling**: Hvert område viser:
   - Navn (norsk/engelsk)
   - Antall vurderte vs. totalt (`assessed/total`)
   - Prosent-score
   - Endring siden valgt intervall (delta-verdi med pil)
   - Fargekode progress bar

3. **Intervallvelger**: En `Select`-dropdown i headeren med alternativene:
   - Siste dag
   - Siste uke
   - Siste måned
   - Siste kvartal
   - Siste år

   Erstatter den statiske «vs. forrige måned»-teksten. Siden historiske data ikke lagres i databasen ennå, vil delta-verdiene vises som simulerte/dummy-verdier per intervall, med en kommentar i koden for fremtidig kobling til faktisk historikk.

4. **Summering nederst**: Viser totalt antall vurderte kontroller av totalt antall.

### Tekniske detaljer
- Bruker `useComplianceRequirements()` hook som allerede beregner `byDomainArea` via scoring engine
- `ScoreResult` inneholder `score`, `assessed`, `total`, `avgMaturity` per domene
- Intervallvelgeren bruker shadcn `Select`-komponent
- Domene-labels gjenbruker eksisterende `FOCUS_AREA_LABELS` mønster fra DashboardV2

