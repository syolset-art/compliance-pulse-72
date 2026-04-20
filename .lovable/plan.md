

## Plan: Erstatt "Datatyper" og "Prosesser" med fritekst + AI-forslag

I "Bruk og kontekst"-fanen på leverandørprofilen skal de to seksjonene under de fire toppboksene bli redigerbare tekstfelt med AI-assistanse i stedet for lister/badges.

### 1. "Datatyper som behandles" → fritekstfelt

**Fil:** `src/components/asset-profile/tabs/PersonalDataCard.tsx` (skrives om)

Erstatt dagens badge-liste + AddDataCategoryDialog med:

- **Textarea** (min 4 rader, auto-grow) der brukeren skriver fritt hvilke personopplysninger leverandøren behandler
- **"Foreslå med AI"-knapp** (Sparkles-ikon) over textarea-en til høyre
  - Kaller edge function `suggest-vendor-data-types` som bruker Lovable AI (`google/gemini-2.5-flash`) med kontekst: leverandørnavn, kategori, beskrivelse, eksisterende personvernerklæring-URL hvis tilgjengelig
  - Returnerer foreslått tekst (maks ~600 tegn) som settes inn i textarea (overskriver hvis tom, ellers spør om append/replace)
  - Loading-state med spinner i knappen
- **"Lagre"-knapp** nederst som lagrer til `assets.metadata.personal_data_text` (ny nøkkel i eksisterende JSONB-felt — ingen schema-endring)
- Tidsstempel: "Sist oppdatert {dato}" hentes fra `assets.metadata.personal_data_updated_at`
- Beholder kort-rammen og `ShieldCheck`-ikonet i headeren

### 2. "Prosesser som bruker denne leverandøren" → fritekstfelt

**Fil:** `src/components/asset-profile/tabs/UsageTab.tsx` (Processes-kortet, linje 109–138)

Erstatt prosess-listen med:

- Samme mønster som over: textarea + "Foreslå med AI" + "Lagre"
- Edge function: `suggest-vendor-processes` med kontekst: leverandørnavn, kategori, bransje fra `company_profile`
- Lagres til `assets.metadata.processes_text` + `assets.metadata.processes_updated_at`
- Beholder `Workflow`-ikonet i headeren

### 3. Nye edge functions

**`supabase/functions/suggest-vendor-data-types/index.ts`** og **`supabase/functions/suggest-vendor-processes/index.ts`**

- Tar imot `{ vendorName, vendorCategory, vendorDescription, vendorUrl?, industry? }`
- Bruker `LOVABLE_API_KEY` mot Lovable AI Gateway (`google/gemini-2.5-flash`)
- System-prompt på norsk: foreslå konkrete, realistiske kategorier/prosesser basert på hva slags leverandør dette er. Maks 5 punkter, kompakt liste-format.
- Returnerer `{ suggestion: string }`
- CORS headers + 402/429 håndtering med tydelige meldinger

### 4. Felles UX-detaljer

- Empty state når feltet er tomt: muted placeholder "Skriv inn eller la AI foreslå…"
- Toast-bekreftelse ved lagring og ved AI-forslag
- Hvis textarea har ulagrede endringer: "Lagre"-knappen blir primary, ellers ghost
- Responsiv: textarea fyller bredden, knapper stables på mobil

### Filer som endres / opprettes

**Endres:**
- `src/components/asset-profile/tabs/PersonalDataCard.tsx`
- `src/components/asset-profile/tabs/UsageTab.tsx`

**Opprettes:**
- `supabase/functions/suggest-vendor-data-types/index.ts`
- `supabase/functions/suggest-vendor-processes/index.ts`

**Slettes (eller beholdes ubrukt):**
- `src/components/asset-profile/tabs/AddDataCategoryDialog.tsx` — ikke lenger referert. Slettes.

### Ut av scope

- Migrering av eksisterende `asset_data_categories`-rader til ny tekst (gamle data forblir i tabellen, men vises ikke lenger i denne fanen)
- Endring av `ProcessDataTypesTab.tsx` (system/process-visningen) — den fortsetter med strukturert data
- Andre faner i leverandørprofilen

