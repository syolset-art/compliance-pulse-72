# Bransjevelger med NACE/SN2007-mapping

Erstatter det frie tekstfeltet "Bransje" i `CompanyInfoForm` med en søkbar combobox basert på en kuratert liste over vanlige bransjer i Norge, Norden og Europa. Hver bransje mappes valgfritt til NACE Rev. 2 / SN2007-kode for fremtidig rapportering og benchmarking. Visningen lagres fortsatt som fritekst – mapping ligger ved siden av.

## Endringer

### 1. Ny fil: `src/lib/industries.ts`
Eksporterer `INDUSTRY_OPTIONS` med felt:
- `id` (stabil nøkkel)
- `label_nb` / `label_en` (visning + lagret tekstverdi)
- `naceCode` (f.eks. `62` for IT/programvare, `64-66` for finans/forsikring)
- `naceSection` (A–S)

Pluss hjelpere:
- `findIndustryByLabel(label)` – matcher tekst til en kjent bransje
- `getNaceCodeForIndustry(label)` – returnerer NACE-kode eller `null` for egendefinerte verdier

Liste på ~40 bransjer dekker NACE-seksjonene A–S, inkludert moderne kategorier som Cybersikkerhet, E-handel, Medtech, Fornybar energi.

### 2. `src/components/company/CompanyInfoForm.tsx` – Bransje-feltet (ca. linje 564–570)
Bytt `<Input>` ut med en `Popover` + `Command` (cmdk) combobox:
- Trigger-knapp viser valgt bransje + liten NACE-badge når mappet (`NACE 62`).
- `CommandInput` filtrerer listen mens man skriver.
- `CommandList` viser matchende `CommandItem`s; valgt verdi får ✓.
- `CommandEmpty` viser en «Bruk "{input}"»-handling for egendefinert tekst (lagres som fritekst, NACE = null).
- Locale-aware via eksisterende `isNb` – viser `label_nb` eller `label_en`.
- Read-only modus (`!isEditing`) viser teksten + eventuell NACE-badge.

Eksisterende `form.industry`-state holdes som `string` – ingen schema-/DB-endring.

## Ute av scope
- Ingen DB-migrasjon. NACE lagres ikke i database nå; det utledes fra `industry`-teksten via `getNaceCodeForIndustry()` ved behov. (Kan legges til som egen kolonne `industry_nace_code` senere.)
- Ingen endringer på andre felter eller onboarding.
- Ingen offisiell validering mot Brønnøysund-registeret.

## Tekniske detaljer
- Bruker eksisterende shadcn-komponenter (`Popover`, `Command`) – ingen nye avhengigheter.
- WCAG: combobox-trigger får `aria-expanded`, list-items er tastaturnavigerbare via cmdk.
- Tekstskala følger eksisterende `text-sm` standard i skjemaet.
