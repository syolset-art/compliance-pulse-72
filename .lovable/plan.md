# Kundetabell: samlet anbefaling + egen aktivert-kolonne

Kolonnene «Regelverk» og «Anbefalte produkter og tjenester» slås sammen og deles på nytt etter hva partneren faktisk trenger å se.

## Nye kolonner

```text
Kunde | Land | Bransje | Anbefalt (lilla) | Aktivert (grønn) | Modenhet
```

### Anbefalt — alt som kan selges inn
Én samlet liste med lilla piller, uansett type:
- Regelverk som bør aktiveres (GDPR, ISO 27001, NIS2 …)
- Mynder-moduler: Mynder Core, Leverandørmodul, Assets
- Partnerens egne tjenester: Penetrasjonstest, Gap-analyse, Modenhetsvurdering, Backup, Microsoft-tjenester m.m.

Hver pille er klikkbar (velg/fravelg). Viser inntil 4, resten bak «+n» som utvider raden.

### Aktivert — hva kunden allerede har
Grønne piller: aktive regelverk, aktive moduler (med nivå der det finnes) og tjenester som er levert. «—» når ingenting er aktivert.

## Få klikk til handling
Når minst én pille er valgt, dukker to knapper opp i samme celle:
- **Tilbud (n)** — åpner tilbudsdialogen forhåndsutfylt (som i dag)
- **Aktiver (n)** — åpner aktiveringsdialogen med nivåvalg og vilkår, kun for det som kan slås på (regelverk og moduler)

Rene tjenester kan bare legges i tilbud; om utvalget kun består av tjenester vises bare «Tilbud».

## Teknisk

- `src/pages/MSPDashboard.tsx`:
  - `ColumnKey` blir `customer | country | industry | recommendations | activated | score`; `frameworks` fjernes fra labels, rekkefølge, breakpoints og lagret kolonnevalg (bump `COLUMN_STORAGE_KEY` til `_v4`).
  - `deriveOfferSuggestions` utvides: tar med anbefalte regelverk (alle, ikke bare 2), moduler (core, vendors, assets) som ikke er aktive, og partnertjenester fra eksisterende `deriveNeededServices`. Grensen på 3 heves til 4 synlige + «+n».
  - Ny helper `deriveActivatedItems(c)` som slår sammen `active_frameworks`, `active_modules` (via `moduleInfo`-labels) og `deriveActiveServices`.
  - Ny «Aktivert»-celle med grønne `bg-success/10`-piller; anbefalt-piller bruker `bg-primary/10` (lilla) med tydeligere valgt-tilstand.
- Ingen endringer i datamodell eller backend. Tilbud- og aktiveringsdialogene (`MSPCreateOfferDialog`, `ActivateRecommendationsDialog`) gjenbrukes uendret.
