# Plan: Lara-estimerte timer per kontrollpunkt i rådgivningspakker

## Mål
Erstatte det rigide «1 time per kontrollpunkt» med et grovt, variert estimat fra Lara per oppgave/kontrollpunkt — f.eks. policy 2–3 t, teknisk rapport 3–5 t. Partneren kan fortsatt overstyre alt manuelt.

## Slik er det i dag
- `buildFrameworkTasks()` i `src/lib/frameworkTaskPackage.ts` setter `hours: { min: 1, max: 1 }` på alle oppgaver.
- Sheetet `MSPFrameworkTaskPackageSheet.tsx` viser timene, partneren kan redigere per oppgave, og totaler summeres allerede som min–maks-intervaller.
- Merket «Timer foreslått av Lara» vises, men bak ligger ingen faktisk estimering.

## Endringer

### 1. Ny edge function `estimate-package-hours`
- Input (validert): regelverksnavn + oppgaveliste (navn, type leveranse, antall krav dekket, kategori).
- Kaller Lovable AI (ingen nøkkel nødvendig) og ber om grovt estimat per oppgave: `hoursMin`, `hoursMax` (hele/halve timer, realistisk spenn) + én kort begrunnelse.
- Returnerer strukturert JSON. Ved feil returneres tydelig feilmelding, og klienten faller tilbake til 1 t.

### 2. Klientstøtte i `src/lib/frameworkTaskPackage.ts`
- `buildFrameworkTasks()` beholder 1 t kun som nødfallback.
- `TaskOverride` utvides med `estimated?: boolean` for å skille Lara-estimat fra manuelle endringer.

### 3. Sheetet `MSPFrameworkTaskPackageSheet.tsx`
- Ved åpning: hvis regelverket ikke har estimater fra før, kjøres estimering automatisk (radene viser lasteindikator mens Lara regner).
- Estimatene lagres som overrides i pakke-state (`estimated: true`) — dermed huskes de per regelverk og inngår i lagret pakke.
- Oppgaver viser intervaller der de finnes («2–4 t»), med merke «Lara-estimat». Redigerer brukeren timene, byttes merket til «Endret av deg».
- Ny knapp «Estimer på nytt med Lara» for å regenerere estimater (bevarer oppgaver brukeren har endret manuelt — kun uendrede estimeres på nytt).
- Hjelpetekst ved «Timer foreslått av Lara» oppdateres til å forklare at estimatet er grovt og bør justeres etter egen erfaring.

### 4. Uendret
- `MSPFrameworkHoursTab.tsx` og totalsummeringen trenger ingen logikkendring — intervaller støttes allerede.

## Teknisk
- Edge function: `supabase/functions/estimate-package-hours/index.ts`, `verify_jwt` håndteres i kode, CORS-headers, zod-validering, modell via Lovable AI Gateway.
- Ingen databaseendringer — estimater lagres i eksisterende `state`-JSONB (msp_framework_packages) og localStorage-fallback.
- Bygg verifiseres automatisk; flyten testes i preview: åpne ISO 27001 → estimater vises → rediger én oppgave → lagre pakke.
