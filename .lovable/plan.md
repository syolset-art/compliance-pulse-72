

## Plan: Publiseringsklar-indikator for Trust Profile-redigering

### Problem
Den nåværende fremdriftsbaren viser bare en generisk "Total progress"-prosent uten kontekst. Brukeren vet ikke hva som mangler, hva som er "godt nok", eller når profilen er klar for publisering.

### Løsning
Erstatt den enkle prosentbaren med en **Readiness Indicator** — en sticky/persistent komponent som følger brukeren gjennom hele skjemaet og gir kontekstuell tilbakemelding.

### Design

**1. Sticky readiness-bar (toppen av innholdsområdet)**
- Vises som en kompakt bar som er synlig mens brukeren scroller
- Inneholder: score-prosent, en fargekodet statusmelding, og en visuell indikator
- Tre nivåer:
  - **< 50%**: Rød — "Ikke klar for publisering — flere kontroller må fylles ut"
  - **50–79%**: Oransje — "Nesten klar — noen områder gjenstår"  
  - **≥ 80%**: Grønn — "Klar for publisering"

**2. Seksjon-spesifikke mini-indikatorer**
- Hver seksjon (Offentlig profil, Virksomhet, Sikkerhet, Regelverk, Dokumentasjon) får en liten completeness-chip i headeren
- F.eks. "3 av 5 utfylt" eller en liten sirkulær indikator
- Beregnes basert på hva som faktisk er fylt ut i den seksjonen

**3. Readiness-sjekkliste (erstatter de generiske badges i det nåværende progress-kortet)**
- Viser konkrete sjekkliste-punkter med status:
  - ✓ Virksomhetsinformasjon utfylt
  - ✓ Kontaktperson registrert  
  - ○ Minst 70% kontroller besvart
  - ○ Minst ett regelverk valgt
  - ○ Dokumentasjon lastet opp
- Hvert punkt er klikkbart og scroller til riktig seksjon

### Tekniske endringer

**Fil: `src/pages/TrustCenterEditProfile.tsx`**
- Erstatt det statiske `Card`-et (linje 181-197) med en ny `PublishingReadiness`-komponent
- Legg til `sticky top-0 z-10` styling så baren følger med ved scrolling
- Beregn completeness per seksjon basert på eksisterende data:
  - Virksomhet: har company name, org number, kontaktperson
  - Sikkerhet: trustScore fra evaluation-hooken
  - Regelverk: frameworks.length > 0
  - Dokumentasjon: sjekk om dokumenter finnes

**Ny fil: `src/components/trust-center/PublishingReadiness.tsx`**
- Mottar trustScore, companyProfile, frameworks, linkedProducts som props
- Beregner sjekkliste-status for hver kategori
- Viser sticky bar med fargekodet melding og utfyllingsgrad
- Klikkbare sjekkliste-items som scroller til riktig seksjon

**Fil: Seksjon-headere i TrustCenterEditProfile.tsx**
- Legg til en liten completeness-badge ved siden av hver seksjons-tittel (f.eks. "2/4" eller en liten dot)

