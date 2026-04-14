

## Plan: Tydeliggjør flyten i Trust Profile-redigering

### Problem
Siden `/trust-center/edit` spør om «Leverandørprofil» (tjenestekategorier), «Virksomhetsbruksområder» og «Din rolle i datahåndtering» uten å forklare *hvorfor*. Brukeren forstår ikke sammenhengen mellom disse valgene og Trust Profilen sin.

### Tilnærming
Klargjøre narrativet: **Organisasjonen først, produkter etterpå**. Hver seksjon får kontekstuell forklaring som kobler valget til hva det betyr for Trust Profilen.

### Endringer i `src/pages/TrustCenterEditProfile.tsx`

**1. Slå sammen «Virksomhetsbruksområder» og «Leverandørprofil» til én seksjon**
- Nytt navn: **«Hva leverer din virksomhet?»** / «What does your company deliver?»
- Ny intro-tekst: *«Dette hjelper kunder og partnere forstå hva dere gjør. Informasjonen vises i din offentlige Trust Profile og brukes til å tilpasse kontrollspørsmål.»*
- Tjenestekategoriene (SaaS, Konsulent osv.) vises først som primærvalg
- Virksomhetsbruksområder vises under som «Hvilke fagområder dekker dere?» med forklaring: *«Brukes til å vise relevante kontroller og regelverk»*

**2. Flytt «Din rolle i datahåndtering» opp i virksomhetsseksjonen**
- Plasser den rett etter tjenestekategorier, med ny intro: *«Din rolle bestemmer hvilke personvernkrav som gjelder i Trust Profilen din»*
- Fjern den fra «Koblede profiler»-seksjonen

**3. Omnavngi «Koblede profiler» til «Produkter og tjenester»**
- Ny undertekst: *«Du kan legge til individuelle produktprofiler senere. Din organisasjonsprofil fungerer selvstendig.»*
- Vis en liten info-badge: «Valgfritt» ved siden av seksjonstittelen
- Fjern completeness-badge (0/1) som skaper press

**4. Legg til kontekstuell info-boks øverst på siden**
- Under page header, kort forklaring: *«Trust Profilen er din virksomhets digitale tillitserklæring. Start med å beskrive organisasjonen — du kan legge til produktprofiler når som helst.»*

### Filer som endres
- `src/pages/TrustCenterEditProfile.tsx` — omstrukturering og nye forklaringstekster

