## Endre regelverk fra Moduler-fanen

Åpne `EditActiveFrameworksDialog` (samme sheet som brukes i Regelverk-fanen) når partneren klikker knappen på Regelverk-kortet i Moduler-fanen på kundeprofilen.

### Endringer

**1. `src/components/msp/CustomerModulesTab.tsx`**
- Endre knapp-etikett fra «Legg til regelverk» → **«Endre regelverk»** (samme knapp brukes for aktiver/deaktiver).
- Legg til lokal `useState` for `editOpen`.
- Rendre `<EditActiveFrameworksDialog>` med:
  - `activeFrameworkIds` som `Set` av `activeFrameworkIds`-propen
  - `title="Endre regelverk — {customerName}"`
  - `description="Aktiver eller deaktiver regelverk for denne kunden."`
  - `onToggle` som oppdaterer `msp_customers.active_frameworks` i Lovable Cloud og kaller ny `onUpdate?()`-callback så forelder re-fetcher.
  - `updatingId` styrt av lokal state under lagring.
- Utvid `CustomerModulesTabProps` med `onUpdate?: () => void`.

**2. `src/pages/MSPCustomerDetail.tsx`**
- Send `onUpdate={refreshCustomer}` (bruk eksisterende refresh-funksjon) til `<CustomerModulesTab>` slik at kortet, telleren og prisen oppdateres etter endring.

### Ute av scope
- Ingen endringer i selve `EditActiveFrameworksDialog`.
- Ingen ny bestillingsflyt — direkte toggle (samme oppførsel som deaktivering i Regelverk-fanen). Kan utvides senere om partneren skal bekrefte bestilling ved aktivering.
