Oppgave: Endre navnet på fanen "Moduler" til "Produkter" i kundedetalj-siden.

1. **Bekreftet lokalisering** (lest):
   - `src/pages/MSPCustomerDetail.tsx` linje 329–331: `<TabsTrigger value="modules">Moduler</TabsTrigger>`
   - `src/components/msp/CustomerModulesTab.tsx` linje 135: overskriften inne i fanen er også "Moduler"

2. **Endringer**:
   - Endre teksten i `MSPCustomerDetail.tsx` fra `Moduler` til `Produkter`.
   - For konsistens endre også overskriften i `CustomerModulesTab.tsx` fra `Moduler` til `Produkter`.
   - Tab-verdien `value="modules"` beholdes uendret for å unngå å måtte oppdatere URL-parametere, tilstand og andre referanser.

3. **Verifisering**:
   - Kjør bygg/typecheck for å sikre at endringen ikke knekker noen imports/referanser.
   - Bekreft at fanen viser "Produkter" i forhåndsvisningen.