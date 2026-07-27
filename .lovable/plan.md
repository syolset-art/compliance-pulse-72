## Mål
Når en ny kunde legges til, skal bransje automatisk hentes fra offentlig register (BrReg) — med fallback til AI-forslag når hovedenheten mangler bransje. «Uoppgitt» skal ikke lenger vises som endelig verdi.

## Bakgrunn
BrReg søke-endepunktet returnerer ofte `naeringskode1.beskrivelse = "Uoppgitt"` på hovedenheter fordi den reelle bransjekoden ligger på **underenheten** (f.eks. filial/avdeling). I dag brukes kun søkeresultatet direkte, og «Uoppgitt» skrives til `msp_customers.industry`.

## Endringer

### 1. Berik BrReg-data ved valg (`handleSelectCompany`)
Når en bruker velger en virksomhet:
1. Hent full detalj på hovedenhet: `GET /enhetsregisteret/api/enheter/{orgnr}` (bekrefter navn, adresse, ansatte).
2. Hvis `naeringskode1` mangler eller `beskrivelse === "Uoppgitt"`:
   - Hent underenheter: `GET /enhetsregisteret/api/underenheter?overordnetEnhet={orgnr}&size=10`
   - Velg første underenhet med gyldig `naeringskode1` (ikke «Uoppgitt»).
   - Bruk den bransjen på kunden.
3. Hvis fortsatt tomt → gå til AI-fallback (steg 2).

### 2. AI-fallback via edge function
Ny edge function `suggest-industry`:
- Input: `{ name, org_number, country_code }`
- Bruker Lovable AI (`google/gemini-3.6-flash`) med kort prompt: «Foreslå NACE-lignende bransjebeskrivelse på norsk basert på virksomhetsnavn. Returner kun én kort setning, maks 60 tegn.»
- Returnerer `{ industry, source: "ai_suggested", confidence: "low"|"medium" }`.
- Kalles kun når BrReg (hovedenhet + underenhet) ikke gir bransje.

### 3. UI-oppdateringer i `AddMSPCustomerDialog.tsx`
- I verifiseringssteget: vis en linje til i eksisterende progress-indikator:
  - «Henter bransje fra register» → «Sjekker underenheter» → «AI foreslår bransje» (kun de stegene som faktisk kjøres).
- På bekreftelsessteget: hvis bransjen kommer fra AI, vis liten `Sparkles`-indikator med tooltip «Foreslått av Lara – kan endres».
- Behold mulighet for å redigere bransje manuelt i «Registrer manuelt»-flyten (uendret).

### 4. Persistens
- Skriv `industry` som før i `msp_customers.industry`.
- Ingen skjemaendring nødvendig — vi lagrer kun den beste verdien vi finner. AI-flagg holdes i minne under wizard, ikke lagret.

## Ikke inkludert
- Ingen endring i onboarding-flyten for egen organisasjon (`Onboarding.tsx`, `CompanyInfoForm.tsx`).
- Ingen ny kolonne for «industry_source» i databasen (kan legges til senere hvis nødvendig).
- Ingen endring av «Uoppgitt»-verdier på eksisterende kunder (kan gjøres via egen backfill-oppgave).

## Tekniske detaljer
- Filer som endres: `src/components/msp/AddMSPCustomerDialog.tsx`
- Ny fil: `supabase/functions/suggest-industry/index.ts`
- Ingen migreringer, ingen nye secrets (bruker eksisterende `LOVABLE_API_KEY`).