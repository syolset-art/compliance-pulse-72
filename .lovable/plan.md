## Virksomhetsbeskrivelse på kundeprofilen

Legger til et felt for kort beskrivelse av virksomheten i `CustomerStatusBanner.tsx`, plassert rett under raden med bransje / ansatte / org.nr. Feltet er inline-redigerbart (samme mønster som URL og kontaktinfo) og forhåndsutfylles fra offentlige registre under onboarding.

### Hva som bygges

1. **Ny kolonne** `business_description text` på `msp_customers` (nullable), med tilhørende GRANTs.

2. **UI i `CustomerStatusBanner.tsx`**:
   - Ny rad under industri/ansatte/org.nr med ikonet `Info` og teksten som lest-visning.
   - Tomt felt viser «Legg til beskrivelse» (dashed, samme stil som «Legg til nettside»), med tooltip: «Hentes automatisk fra offentlige registre under onboarding. Kan justeres manuelt.»
   - Klikk åpner inline textarea (2–3 linjer) med Lagre / Avbryt. Maks ~500 tegn.
   - `Sparkles`-ikon vises bak teksten når beskrivelsen kommer fra registeret (uendret siden onboarding), for å indikere Lara-hentet innhold.

3. **Onboarding-forhåndsutfylling** i `AddMSPCustomerDialog.tsx`:
   - Utvider eksisterende BRreg-lookup-flyt (samme sted som industri hentes) til også å lese `aktivitet` / `beskrivelse` fra enhetsregisteret hvis tilgjengelig. Faller tilbake til AI-forslag via eksisterende `suggest-company-description` edge function (finnes allerede i prosjektet) når registerbeskrivelse mangler.
   - Verdien lagres på `msp_customers.business_description` når kunden opprettes.

4. **Ingen andre steder oppdateres** i denne runden – bare banner + onboarding-datafangst.

### Filer
- `supabase/migrations/*` – ny kolonne + GRANTs.
- `src/components/msp/CustomerStatusBanner.tsx` – ny rad + inline-edit.
- `src/components/msp/AddMSPCustomerDialog.tsx` – hent og lagre beskrivelse.
- (Reuse) `supabase/functions/suggest-company-description/` – allerede tilgjengelig.

### Ikke i scope
- Redigering fra andre kundevisninger.
- Historikk / diff av beskrivelsen.
- Bulk-oppdatering av eksisterende kunder.
