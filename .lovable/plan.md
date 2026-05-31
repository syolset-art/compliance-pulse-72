
## Mål
Bytte demo-bedriften fra «Framdrift Innovasjon AS» (rådgivning) til «DIPS Arena AS» — en realistisk helseaktør — slik at investor-demoen treffer riktig bransje. Alle felter (bransje, beskrivelse, e-poster, domener, dokumenter, kontaktpersoner) oppdateres så Lara-kartleggingen og Trust Profile fremstår troverdig.

## Ny demo-profil (helse)

- Navn: DIPS Arena AS
- Org.nr: 936431127 (uendret — fiktivt for demo)
- Bransje: Helse og omsorg
- Brreg-bransje: Helsetjenester / Programvareutvikling for helsesektoren
- Beskrivelse: «DIPS Arena AS leverer digitale helseløsninger til sykehus, kommuner og spesialister i Norge. Vi behandler pasientopplysninger og særlige kategorier av personopplysninger på vegne av helsevirksomheter.»
- Domene: dipsarena.no
- Ansatte: 11–50 (brreg_employees: 25) — mer troverdig for helseaktør enn 5
- Region/land: Vestland, Norge (beholdt)
- Kontakt / DPO / Compliance: Marte Solberg → byttes til realistisk helse-navn, f.eks. Kari Lien (compliance) og Henrik Dahl (DPO)
- E-poster: marte@framdrift.no → kari.lien@dipsarena.no, personvern@dipsarena.no, hei@dipsarena.no, sikkerhet@dipsarena.no
- Personvernerklæring URL: https://dipsarena.no/personvern
- Sensitive data: «extensive» (helseopplysninger) i stedet for «limited»
- Use cases: ["gdpr", "iso27001", "nsm_grunnprinsipper"] (legger til NSM som er relevant for helse)

## Filer som endres

1. `src/lib/demoSeedTrustProfile.ts`
   - `FRAMDRIFT_PROFILE` → `DIPS_ARENA_PROFILE` (eller bare oppdatere feltene): navn, bransje, domene, ansatte, kontakt, DPO, e-poster, sensitive_data, use_cases.
   - `SELF_ASSET`: navn, beskrivelse, kontakt, e-post, url.
   - Behold org_number, geografisk scope, evidence-checks-strukturen.

2. `src/lib/demoTrustActivation.ts`
   - `FRAMDRIFT` `LaraScanResult` → `DIPS_ARENA`: company name, description, alle e-poster (primary, dpo, support, security), policyUrl, dokumenter-URLer.
   - `normalized.includes("framdrift")` → `normalized.includes("dips")` (matcher domene/navn ved Lara-oppslag).
   - Oppdater eventuelle subProcessors/leverandørreferanser så de passer en helseaktør (f.eks. Microsoft Azure Health Data Services, Norsk Helsenett som driftspartner).

3. `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`
   - Linje 846: placeholder «F.eks. Framdrift Innovasjon AS» → «F.eks. DIPS Arena AS».

4. `src/components/msp/AddMSPCustomerDialog.tsx`
   - Linje 484: CSV-placeholder oppdateres til «936431127;DIPS Arena AS;Kari Lien;kari.lien@dipsarena.no».

## Ikke i scope

- Ingen endring i databaseskjema eller migreringer — dette er ren demo-/seed-data og UI-placeholders.
- Logikk for kartlegging, modenhetsspørsmål og auto-utfylling endres ikke. Kun innholdet (navn/bransje/e-post/dokumenter) byttes ut.
- Eksisterende seedet rad i Supabase oppdateres automatisk neste gang `seedDemoTrustProfile()` kjøres (koden gjør upsert via update på eksisterende id).

## Verifikasjon

- Åpne `/trust-center/profile` → bedriftsnavn, bransje og beskrivelse viser «DIPS Arena AS» / helse.
- Kjør Aktiver Trust Profile-wizard → Lara-kartlegging matcher mot dipsarena.no og pre-utfyller helse-relevant data.
- Sjekk MSP «Legg til kunde»-dialog → ny placeholder vises.
