# Fiks flimrende leverandørvalg

## Problem
I `VendorRowCard` (steg 5 i aktiveringswizarden) ligger `<Input>` inne i `<PopoverTrigger asChild>`. Radix Popover er bygget for klikk-trigger, ikke for et tekstfelt som skriver kontinuerlig:

- Hver tastetrykk trigger `setOpen(true)` + re-render, og Popover åpner/lukker i portal med fokus-håndtering → tekstfeltet mister og får tilbake fokus → synlig flimring og «ustødig» oppførsel.
- `PopoverContent` rendres i en portal og posisjoneres på nytt ved hver render, som forsterker hoppet.

## Løsning
Bytt ut Radix `Popover` med en enkel, lokalt posisjonert dropdown rett under input — ingen portal, ingen fokus-trap. Brukeren skriver fritt og velger fra listen som dukker opp.

### Endringer i `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`

1. **Fjern Popover-wrapping** rundt navne-inputen i `VendorRowCard`.
2. **Ny markup**: `<div className="relative">` med `<Input>` + en betinget `<ul className="absolute z-50 ...">` som vises når:
   - inputen har fokus, og
   - `query.length > 0`, og
   - `suggestions.length > 0`, og
   - valgt navn ikke matcher eksakt et forslag (skjul etter valg).
3. **Fokus-håndtering**:
   - `onFocus` → `setOpen(true)`
   - `onBlur` med liten timeout (≈120 ms) før `setOpen(false)`, slik at klikk på et listeelement registreres før listen fjernes. Bruk `onMouseDown` (ikke `onClick`) på listeelementene for å unngå at blur skjer først.
4. **Behold logikk**: `selectVendor`, `findVendorSuggestions`, prefill av access-chips og DPA-status uendret.
5. **Importrydding**: fjern `Popover`, `PopoverContent`, `PopoverTrigger` fra denne filen hvis de ikke brukes andre steder i samme fil (sjekkes — brukes kanskje også andre steder; behold importen i så fall).

Ingen endringer i datamodell, vendorCatalog eller andre filer.

## Resultat
- Tekstfeltet beholder fokus mens man skriver.
- Forslagslisten gli inn/ut uten å reposisjonere portal-overlay.
- Valg via mus (eller Enter senere hvis ønsket) fungerer stabilt.
