## Mål
Endre `ServiceCoverageSearch` slik at AI-forslag til beskrivelse ikke vises mens brukeren søker. Beskrivelsesforslaget skal først vises når brukeren har valgt treff og åpner tjenesten for redigering.

## Nåværende tilstand (bekreftet)
- `src/components/msp/ServiceCoverageSearch.tsx` viser umiddelbart et "Foreslått beskrivelse"-felt (linje 193-253) basert på `debounced` søketekst.
- `onAdd` i `ServiceCoverageSearch` legger tjenesten direkte til i katalogen uten redigeringssteg.
- `src/components/msp/CustomServiceDialog.tsx` støtter redigering av navn, beskrivelse, aktiviteter, timer, pris og mappings.

## Endringer

### 1. Fjern beskrivelsesforslag fra søkepanelet
- I `ServiceCoverageSearch.tsx`: Slett hele beskrivelsesseksjonen (linje 193-253) som viser `suggestedDescription` / `descEditing` / `descOverride`.
- Slett tilhørende tilstand: `descOverride`, `descEditing`, `suggestedDescription`, `currentDescription`, `isOverridden`.
- Slett import av `Textarea`, `Pencil`, `RotateCcw`, `Sparkles` dersom de ikke lenger brukes.

### 2. Endre "Opprett" til "Åpne for redigering"
- Bytt ut `onAdd`-proppen med `onCreate` som returnerer:
  - `name` (søketekst)
  - `selectedMappings` (de valgte kontrollpunktene)
  - `suggestedDescription` (AI-forslag hentet ved `lookupServiceDescription`)
- Knappetekst endres fra "Opprett" til "Åpne og rediger" eller lignende.
- Tjenesten legges IKKE til i katalogen før brukeren lagrer i dialogen.

### 3. Prefill `CustomServiceDialog` med forslag
- I `MSPServiceCatalogTab.tsx`: mottak `onCreate` fra `ServiceCoverageSearch`.
- Åpne `CustomServiceDialog` i create-modus med `initial` satt til:
  - `name`
  - `description` = AI-forslag
  - `mappings` = valgte mappings
  - `hours` = 0 eller sum fra valgte kontrollpunkter
  - `activities` = tom liste
- `CustomServiceDialog` viser allerede `initial.description` i beskrivelsesfeltet ved åpning (bekreftet linje 87-89).

### 4. Vis AI-forslag tydelig i dialogen
- I `CustomServiceDialog.tsx`: marker beskrivelsesfeltet med `Sparkles`-ikon og tekst "Beskrivelse foreslått av KI — kontroller før lagring" når beskrivelsen kommer fra AI-forslag.
- Behold redigeringsmuligheten som i dag.

### 5. Lagring
- Når brukeren klikker "Lagre" i `CustomServiceDialog`, legges tjenesten til i `extras` på samme måte som i dagens `handleAdd`.
- Hvis brukeren avbryter, legges ingenting til.

## Tekniske detaljer
- Filer: `src/components/msp/ServiceCoverageSearch.tsx`, `src/components/msp/MSPServiceCatalogTab.tsx`, eventuelt `src/components/msp/CustomServiceDialog.tsx`.
- Ingen database- eller backend-endringer nødvendig.
- Ingen endringer i `serviceMappingSuggester` eller `serviceDescriptionLookup`.

## Akseptansekriterier
- Brukeren ser kun regelverk/krav-tabell når de skriver i søkefeltet.
- Ingen beskrivelsesboks vises før brukeren velger treff og klikker "Åpne og rediger".
- Etter klikk åpnes `CustomServiceDialog` med AI-forslag til beskrivelse forhåndsutfylt.
- Brukeren kan redigere beskrivelsen og lagre tjenesten i katalogen.
- Avbryt lar brukeren fortsette søket uten å legge til noe.