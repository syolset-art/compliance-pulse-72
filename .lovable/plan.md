

## Plan: Berike aktivitetsloggen med sporbarhet og oppgaver per leverandør

### Problem
Aktivitetsloggen viser bare generiske hendelser uten tydelig sporbarhet (hvem, hva, når, resultat). For store offentlige aktører som Helse Vest IKT er det kritisk å se nøyaktig hvem som har utført hva, og kunne opprette oppgaver direkte knyttet til leverandøren fra aktivitetsfanen.

### Endringer

#### 1. Berike aktivitetsdata med fase, utfall og rolle (`VendorActivityTab.tsx`)
- Utvide `Activity`-interfacet med:
  - `phase`: Onboarding | Løpende oppfølging | Revisjon | Hendelseshåndtering | Avslutning
  - `outcome` / `outcomeStatus`: Hva ble resultatet (Godkjent, Avvik, Venter, Fullført)
  - `actorRole`: Rollen til personen (Leverandøransvarlig, Compliance-ansvarlig, IT-leder, etc.)
- Oppdatere alle templates med fase, utfall og rolle
- Vise fase som fargekodet badge i tidslinjen
- Vise utfall med ikon (✓ / ⚠ / ⏳) under beskrivelsen
- Vise aktørens rolle ved siden av navnet (f.eks. "Kari Nordmann, Compliance-ansvarlig")

#### 2. Statussammendrag øverst
Legge til et kompakt sammendragskort over tidslinjen:
- **Nåværende fase** (basert på siste aktivitet)
- **Siste aktivitet** med dato og ansvarlig
- **Neste planlagte handling** (f.eks. "Årlig gjennomgang — Q2 2026")

#### 3. «Ny oppgave»-knapp i aktivitetsfanen
- Legge til en «Ny oppgave»-knapp i headeren på aktivitetsloggen
- Gjenbruke `CreateUserTaskDialog` med `asset_id` forhåndsutfylt
- Integrere `useUserTasks`-hooken for å hente og vise eksisterende oppgaver knyttet til denne leverandøren
- Vise åpne oppgaver som en kompakt liste mellom sammendraget og tidslinjen

#### 4. Filtrering av aktivitetslogg
- Legge til en enkel filterrad med knapper for å filtrere på fase (Alle / Onboarding / Løpende / Revisjon / Hendelser)
- Gjør det enkelt å finne relevante aktiviteter i en lang historikk

### Filer som endres
1. **`src/components/asset-profile/tabs/VendorActivityTab.tsx`** — Alle endringer: berike data, statussammendrag, oppgaveliste, filter, fase/utfall-visning

### Ingen databaseendringer
Aktivitetsdata er demo-data. Oppgaver bruker eksisterende `user_tasks`-tabell som allerede har `asset_id`-kobling.

