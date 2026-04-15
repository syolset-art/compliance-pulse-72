

## Knytt leverandører til arbeidsområder — fra porteføljen

### Problemet
Når brukeren klikker "Legg til → Leverandør" i et arbeidsområde, sendes de til en annen side. De bør i stedet kunne velge fra leverandører de allerede har i sin portefølje, direkte i en dialog.

### Hva skal bygges

**1. Ny dialog: AssignVendorDialog**
- Åpnes fra "Legg til → Leverandør" i arbeidsområdet
- Henter alle assets med `asset_type = "vendor"` fra databasen
- Filtrerer bort de som allerede har `work_area_id` satt til gjeldende arbeidsområde
- Viser en søkbar liste med checkboxes — brukeren velger en eller flere
- "Tilordne" oppdaterer `work_area_id` på valgte vendors
- Hvis porteføljen er tom: viser en tom-tilstand med "0 leverandører i porteføljen" og en knapp som lenker til `/vendors`

**2. Oppdater WorkAreas.tsx**
- Endre dropdown-elementet for "Leverandør" (linje 943) til å åpne `AssignVendorDialog` i stedet for å navigere bort
- Legg til state for `isAssignVendorDialogOpen`

**3. Vendor-filter chip viser antall**
- Allerede implementert (linje 903) — teller `allAssets.filter(a => a.asset_type === "vendor").length`

### Filer som endres
1. **Ny fil: `src/components/dialogs/AssignVendorDialog.tsx`** — dialog med porteføljeliste, søk, tom-tilstand med lenke
2. **`src/pages/WorkAreas.tsx`** — importere dialog, legge til state, koble dropdown-klikk

### Ingen databaseendringer
Bruker eksisterende `work_area_id`-kolonne på `assets`-tabellen.

