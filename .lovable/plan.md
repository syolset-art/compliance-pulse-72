

## Plan: Legg til «Registrer aktivitet»-knapp med støtte for manuelle aktiviteter

### Hva bygges
En «Registrer aktivitet»-knapp i aktivitetsloggens header som åpner en dialog der brukeren kan logge manuelle aktiviteter (f.eks. e-postdialog med kunde, telefonsamtale, møte). Aktiviteten inkluderer type, beskrivelse, utfall og fase — og vises i tidslinjen sammen med automatiske hendelser.

### Endringer

#### 1. Ny komponent: `RegisterActivityDialog.tsx`
Opprette `src/components/asset-profile/RegisterActivityDialog.tsx` med:
- Dialog med skjema for å registrere manuell aktivitet
- Felter:
  - **Aktivitetstype** (select): E-postdialog, Telefonsamtale, Møte, Annet
  - **Tittel** (input): Kort beskrivelse av hva som ble gjort
  - **Beskrivelse** (textarea): Detaljer om samtalen/hendelsen
  - **Fase** (select): Onboarding / Løpende / Revisjon / Hendelse
  - **Utfall** (select): Godkjent / Avvik / Venter svar / Informert / Annet
  - **Utfallsstatus** (auto-mapped fra utfall): success/warning/info
  - **Dato** (date picker, default i dag)
- Knappen plasseres ved siden av «Ny oppgave»-knappen i aktivitetsloggens header

#### 2. Utvide aktivitetsdata-modellen (`vendorActivityData.ts`)
- Legge til nye `ActivityType`-verdier: `"email"`, `"phone"`, `"meeting"`, `"manual"`
- Legge til farger og ikoner for de nye typene (Mail, Phone, Users, PenLine)

#### 3. Lokal state for manuelle aktiviteter (`VendorActivityTab.tsx`)
- Legge til `useState` for manuelle aktiviteter
- Merge manuelle aktiviteter med demo-aktiviteter i tidslinjen (sortert etter dato)
- Importere og rendre `RegisterActivityDialog` i headeren
- Oppdatere `ACTIVITY_ICONS`-mappingen med nye ikoner

### Filer som endres
1. **`src/components/asset-profile/RegisterActivityDialog.tsx`** — Ny fil
2. **`src/utils/vendorActivityData.ts`** — Nye typer, farger
3. **`src/components/asset-profile/tabs/VendorActivityTab.tsx`** — Integrasjon av dialog og manuelle aktiviteter

### Ingen databaseendringer
Manuelle aktiviteter lagres i lokal state (demo). Kan enkelt kobles til database senere.

