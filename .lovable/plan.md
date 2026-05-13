## Mål

Når brukeren legger til et nytt system i `AddSystemDialog`, skal Mynder undersøke om det allerede finnes en leverandør i registeret som er «mor»/eier av systemet (f.eks. Microsoft → Teams, Google → Workspace). Hvis ja, vises et kontekstuelt kort der brukeren kan koble systemet til leverandøren med ett klikk, med tydelig forklaring av fordelen.

## Brukeropplevelse

Nytt mellomtrinn **«Leverandør»** legges til mellom *Bekreft* og *Kategori* i wizarden. Trinnet vises kun hvis vi har funnet kandidater — ellers hoppes det automatisk over (ingen ekstra friksjon).

Tre tilstander:

1. **Eksakt match funnet** (f.eks. `formData.vendor` = "Microsoft" og leverandør «Microsoft AS» finnes i registeret)
   - Kort med leverandørens logo, navn, kategori og risikoscore
   - Primær-CTA «Koble til [Leverandør]» (mynder-blue, pille-form)
   - Sekundær «Hopp over»
   - Forklaringsboks: «Når systemet er koblet til leverandøren arver det leverandørens TPRM-status, dokumenter (DPA, ISO 27001, SOC 2) og overvåkning. Du slipper å laste opp samme dokumentasjon to ganger, og varsler om utløp eller hendelser hos leverandøren treffer automatisk dette systemet.»

2. **Sannsynlig match** (fuzzy/AI-forslag, f.eks. brukeren skrev «Teams» og Lara gjenkjenner Microsoft som mor)
   - Samme kort, men med «Lara foreslår»-badge og lavere visuell vekt
   - CTA «Bekreft kobling» + «Det er en annen leverandør»

3. **Ingen leverandør i registeret, men kjent mor finnes** (Lara vet at Teams = Microsoft, men Microsoft er ikke registrert)
   - Banner: «Microsoft er ikke i leverandørregisteret ditt enda»
   - CTA «Legg til Microsoft som leverandør og koble» (oppretter leverandør + kobling i én operasjon)
   - Sekundær «Bare lagre systemet»

Etter valg går wizarden videre til *Kategori*.

## Teknisk

**Datakilde for kandidater**

- Eksakt/fuzzy: `select id, name, logo_url, vendor_category, risk_score, tprm_status from assets where asset_type='vendor' and (lower(name) ilike %vendor% or lower(name) ilike %parent_brand%)`
- Mor-utledning: bruk eksisterende `webResult.vendor` fra `lookup-system` edge function. Utvid prompten til å returnere `parent_vendor` (offisielt morselskap, f.eks. Teams → "Microsoft Corporation"). Denne brukes som søkenøkkel mot `assets`.

**Lagring av koblingen**

- Bruk eksisterende `asset_relationships` (source=system, target=vendor, relationship_type=`provided_by`).
- Sett også `assets.vendor` (tekstfeltet) på systemraden for visning i lister.

**Komponenter**

- Ny `src/components/dialogs/VendorLinkStep.tsx` — håndterer de tre tilstandene over.
- Ny hook `src/hooks/useVendorMatch.ts` — tar `{ vendorName, parentVendor }`, returnerer `{ exact, suggested, parentKnown, isLoading }`.
- `AddSystemDialog.tsx` — legg til `WizardStep = "vendor"`, kall hook etter «Bekreft», skip step hvis tom respons. Ved kobling: opprett rad i `asset_relationships` etter `insert` på systems.

**Edge function**

- `lookup-system`: utvid JSON-skjema med `parent_vendor: string | null` og `parent_vendor_reason: string`.

## ASCII-flyt

```text
Søk → Bekreft → [Leverandør?] → Kategori → Risiko → Kontakt
                    │
        ┌───────────┼────────────┐
   eksakt match  Lara-forslag  ukjent → tilby å opprette
```

## Avgrensninger

- Ingen endringer i leverandør-onboarding eller TPRM-logikk i denne iterasjonen — kun kobling.
- Mynder-blue `#4F51B6` på primær-CTA, pille-form, Mulish-font (eksisterende design-tokens).
- Hvis brukeren hopper over, lagres systemet uten kobling og Lara legger forslaget i innboksen for senere.
