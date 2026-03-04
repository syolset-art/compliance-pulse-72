

## Plan: NIS2-vurdering med proaktiv AI-analyse, dokumentopplasting og notater

### Oversikt
Ny fane "NIS2 Vurdering" i hardware-enhetens profil som automatisk analyserer eksisterende metadata for å gi en umiddelbar statusoversikt. Brukeren kan laste opp dokumenter og legge til notater per kravpunkt, og ser alltid total fremdrift.

### Del 1: NIS2-kravsdefinisjon
**Ny fil: `src/lib/nis2Requirements.ts`**

10 krav basert på NIS2 Art. 21(2)(a-j). Hvert krav har:
- `id`, `label`, `articleRef`, `description`, `recommendation`
- `autoCheck(metadata)` — funksjon som sjekker enhetens metadata og returnerer `pass`/`fail`/`partial` automatisk (AI-proaktiv del)
- `documentTypes` — foreslåtte dokumenttyper som kan lastes opp som evidens

Eksempel auto-sjekker:
- Kryptering (Art. 21h) → sjekker `metadata.encryption`
- Sårbarhetshåndtering (Art. 21f) → sjekker `metadata.last_patch_date < 30d`
- Backup (Art. 21c) → sjekker `metadata.backup`
- Tilgangskontroll (Art. 21i) → sjekker `metadata.mdm`
- MFA (Art. 21j) → sjekker `metadata.mfa_enabled`

Krav uten automatisk sjekk (risikoanalyse, hendelseshåndtering, opplæring, forsyningskjede, anskaffelsessikkerhet) starter som "Ikke vurdert" men kan bekreftes manuelt eller via dokumentopplasting.

### Del 2: NIS2AssessmentTab-komponent
**Ny fil: `src/components/devices/NIS2AssessmentTab.tsx`**

**Layout:**

1. **Sammendrag-kort øverst:**
   - Sirkulær fremdriftsindikator med prosent
   - "X av 10 krav oppfylt" + "Y delvis" + "Z gjenstår"
   - Lara-badge: "Lara har automatisk vurdert 5 av 10 krav basert på enhetens data"

2. **Kravliste (hvert krav er et ekspanderbart kort):**
   - Venstre: statusikon (grønn/gul/rød)
   - Midt: kravtittel + artikkelref + kort beskrivelse
   - Høyre: toggle "Oppfylt" / "Ikke oppfylt" / "Delvis"
   - Hvis auto-sjekket av Lara: liten badge "Automatisk vurdert"
   
   **Ekspandert innhold:**
   - Detaljert beskrivelse og anbefaling
   - **Notater-felt:** Textarea for fritekstnotater (lagres i localStorage per asset+krav)
   - **Dokumenter-seksjon:** Knapp "Last opp dokument" som åpner filopplasting. Viser allerede opplastede filer med navn og dato. Dokumenter lagres i `documents` storage bucket under `nis2/{assetId}/{requirementId}/`
   - Tidsstempel for siste endring

3. **Fremdriftslinje nederst** som alltid viser total NIS2-compliance i prosent

### Del 3: State-håndtering
- Kravstatus og notater lagres i enhetens `metadata.nis2_assessment`-objekt via Supabase update
- Struktur: `{ [requirementId]: { status: "pass"|"fail"|"partial"|"not_assessed", notes: string, updatedAt: string, autoChecked: boolean } }`
- Dokumenter lagres i storage bucket, filoversikt hentes via `supabase.storage.from('documents').list()`

### Del 4: Koble inn i AssetTrustProfile
- Legg til `'nis2'` i hardware-enhetens `enabledTabs`
- Ny fane-definisjon i `primaryTabDefs` for hardware
- `TabsContent` rendrer `NIS2AssessmentTab`

### Del 5: Demo-data
Oppdater 2 enheter i `demoDeviceProfiles.ts` med ferdig `nis2_assessment`-data for å vise variasjon.

### Filer

| Fil | Endring |
|-----|---------|
| `src/lib/nis2Requirements.ts` | Ny — 10 NIS2-krav med auto-sjekk |
| `src/components/devices/NIS2AssessmentTab.tsx` | Ny — komplett vurderingskomponent |
| `src/lib/demoDeviceProfiles.ts` | Legg til `nis2_assessment` for 2 enheter |
| `src/pages/AssetTrustProfile.tsx` | Ny fane i hardware-tabs |

