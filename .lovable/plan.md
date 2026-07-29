## Mål
I "Legg til kunde"-wizarden skal nettsidefeltet forhåndsutfylles automatisk når agenten finner en nettside for kunden, i stedet for å alltid vises tomt. Brukeren skal fortsatt kunne rette adressen eller markere at kunden ikke har nettside.

## Endringer (kun frontend – `src/components/msp/AddMSPCustomerDialog.tsx`)

1. **Utvid BrReg-berikelsen i `handleSelectCompany`** til å plukke opp `hjemmeside` fra hoved-enheten (steg 1) og underenheter (steg 2). Feltet finnes allerede i BrReg-responsen, men brukes ikke i dag.

2. **AI-fallback for nettside** når BrReg ikke returnerer noe:
   - Utvid `suggest-company-description`-kallet (eller gjenbruk `suggest-industry`-svaret) til å ta imot et foreslått domene, ELLER legg til et lett kall til `suggest-industry` som allerede kan returnere `website`. Ingen ny edge function – vi gjenbruker eksisterende svar hvis feltet finnes; ellers hopper vi over uten feil.
   - Normaliser til `https://<domene>` og valider lett (må inneholde punktum, ingen mellomrom).

3. **Prefill form.url etter enrichment**:
   - Når `enriched.hjemmeside` (eller AI-forslag) finnes, sett `form.url` til den verdien og `form.has_website = true` idet vi går fra `verifying` → `contact`-steget.
   - Lagre kilden i en ny lokal state `websiteSource: "brreg" | "ai_suggested" | "none"` for å vise indikator.

4. **UI-oppdatering i nettside-blokken (linje ~1253–1308)**:
   - Når feltet er forhåndsutfylt av agenten, vis en liten `Sparkles`-ikon + tekst "Foreslått av Lara – bekreft eller endre" (samme mønster som bransje-feltet på linje 1242–1247).
   - Behold "Ja, har nettside" / "Har ikke nettside"-togglen uendret slik at bruker kan overstyre.
   - Behold Input-feltet som redigerbart; bare `defaultValue`/initialverdi endres.
   - Hvis brukeren manuelt endrer feltet, fjern "foreslått av Lara"-indikatoren (sett `websiteSource = "manual"`).

## Ikke i scope
- Ingen endringer i lagrings-logikken (linje 363 sender allerede `form.url`).
- Ingen nye edge functions eller DB-migreringer.
- Ingen endringer på andre steg i wizarden.
