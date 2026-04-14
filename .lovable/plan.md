

## Plan: Forenkle «Produkter og tjenester» til en enkel lenke

### Problem
Seksjonen «Produkter og tjenester» tar for mye plass og skaper friksjon i Trust Profile-editoren. Brukeren trenger kun å vite at muligheten finnes — ikke bli presset til å opprette noe.

### Endring

**Erstatt hele Card-seksjonen (linje 547–603) med en kompakt lenke-rad:**

- Fjern `Card` med tom-tilstand, produktliste og «Opprett»-knapp
- Erstatt med én enkel linje: ikon + tekst + lenke-knapp
- Tekst: *«Har du flere produkter eller tjenester? Du kan opprette egne Trust Profiler for disse.»*
- Knapp: *«Se produkter og tjenester →»* som navigerer til `/trust-center/products`
- Behold `Valgfritt`-badge
- Fjern `linkedProducts`-query og completeness-telling for `linked` (sett den til `done: 0, total: 0` eller fjern fra `sectionProgress`)

**Fjern «Produkter» fra quick-nav tabs** (linje 280) — det er ikke en reell seksjon lenger, bare en lenke.

### Filer som endres
- `src/pages/TrustCenterEditProfile.tsx`

