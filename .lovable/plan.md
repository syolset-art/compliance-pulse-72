
# Plan: Husk avviste/utsatte Lara-forslag

Når brukeren trykker "Ikke nå" eller avviser et Lara-forslag forsvinner det i dag sporløst. Denne planen gjør at forslagene **huskes**, kommer **automatisk tilbake** etter snooze, og kan **finnes igjen** i Lara-innboksen.

## Brukeropplevelse

**På banneret (dashbord + leverandørsiden):**
- Knappen "Ikke nå" → endres til **"Utsett 7 dager"** (snooze). Forslaget skjules, men kommer tilbake automatisk etter 7 dager.
- Ny knapp **"Avvis"** (X-ikon) → fjerner forslaget permanent fra banneret. Lagres som "avvist".
- Liten tekst nederst: *"Utsatte og avviste forslag finner du i Lara-innboksen."*

**I Lara-innboksen (`/lara-inbox`):**
- Ny fane **"Utsatt / Avvist"** ved siden av eksisterende faner.
- Liste over alle utsatte og avviste forslag, med:
  - Tittel + leverandør/kontekst
  - Hvorfor Lara foreslo det ("Lara ser …")
  - Status: Utsatt til <dato> · Avvist <dato>
  - Handlinger: **"Hent tilbake"** (gjenåpner forslaget) og **"Slett permanent"**
- Teller-badge på sidebar-menypunkt for Lara-innboks viser antall aktive (utsatte som er forfalt + nye).

## Teknisk

**Ny tabell `lara_suggestion_states`** (via migrasjon):
- `id`, `user_id`, `created_at`, `updated_at`
- `suggestion_key` (text) — stabil nøkkel per forslag, f.eks. `dpa-{vendorId}`, `exp-{vendorId}` (samme id-er som genereres i `VendorLaraInsightsPanel`)
- `state` (text) — `snoozed` | `dismissed`
- `snoozed_until` (timestamptz, nullable)
- `context_snapshot` (jsonb) — kopi av tittel, severity, "Lara ser"-tekst, vendor-navn, kategori. Slik at forslaget kan vises i innboksen selv om kildedataen endrer seg.
- RLS: `user_id = auth.uid()` for select/insert/update/delete.

**Ny hook `useLaraSuggestionStates`:**
- `getStates()` → map fra `suggestion_key` → state-rad
- `snooze(key, days, snapshot)` 
- `dismiss(key, snapshot)`
- `restore(key)` (sletter raden)
- `purge(key)` (samme som restore — sletter raden, men med annen UI-betydning)

**Filtrering i banneret:**
- `VendorLaraInsightsPanel` og `LaraRecommendationBanner` filtrerer ut tasks der `suggestion_key` finnes som `dismissed`, eller `snoozed` med `snoozed_until > now()`.
- Forslag der `snoozed_until <= now()` dukker opp igjen automatisk (raden ryddes opp ved neste interaksjon).

**Ny komponent `LaraSuggestionsArchiveTab.tsx`** under `src/components/lara-inbox/`:
- Henter alle rader for innlogget bruker
- Grupperer på "Utsatt (aktive)", "Utsatt (forfalt — kommer tilbake)", "Avvist"
- Knapper for hent tilbake / slett

**Endringer i eksisterende filer:**
- `src/components/lara/LaraRecommendationBanner.tsx` — bytt "Ikke nå"-knapp til "Utsett 7 dager" + "Avvis", kall hooken
- `src/components/vendor-dashboard/VendorLaraInsightsPanel.tsx` — samme behandling + filtrering
- `src/pages/LaraInbox.tsx` — legg til ny fane

## Avgrensninger
- Ingen e-postvarsler når snooze utløper (kan komme senere).
- Snooze-perioden er fast 7 dager i v1; brukerstyrt periode kan komme senere.
- Funksjonen er knyttet til innlogget bruker (ikke per organisasjon) — det matcher dagens "user_tasks"-mønster.
