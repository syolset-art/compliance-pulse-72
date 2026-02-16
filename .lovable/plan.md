

# Forbedret "Finn din virksomhet" -- automatisk oppslag og eierskapsverifisering

## Hva endres
Steget "Finn din virksomhet" i Leverandordemo-flyten (`VendorResponseDemo.tsx`) redesignes fullstendig. I stedet for at brukeren manuelt skriver inn org.nr., bruker vi konteksten fra foresporselen (vi vet allerede hvilket firma som ble kontaktet) til aa automatisk soke opp virksomheten. Brukeren bekrefter, og vi henter styreleder og daglig leder fra Brreg for eierskapsverifisering.

## Ny brukerreise

```text
Steg 1: E-post (uendret)
  Vi vet: firmanavn, kontaktperson, e-post
          |
          v
Steg 2: Landingsside (uendret)
          |
          v
Steg 3: Finn din virksomhet (NYTT)
  - Firmanavnet fra e-posten er pre-fylt i sokefeltet
  - Automatisk oppslag mot Brreg (NO) / demo-data (SE/DK)
  - Brukeren ser en liste med treff og velger riktig virksomhet
  - Bekrefter valget
          |
          v
Steg 4: Bekreft ledelse (NYTT)
  - Henter roller fra Brreg: styreleder + daglig leder
  - Viser navn og rolletype i kort-layout
  - Brukeren oppgir e-post til styreleder og/eller daglig leder
  - Sender (simulert) verifiserings-e-post til en av dem
          |
          v
Steg 5: Venter paa bekreftelse (NYTT)
  - Statusside: "Venter paa bekreftelse fra [styreleder/daglig leder]"
  - Viser hvem som har fatt e-post og status per person
  - Brukeren kan ikke gaa videre for en av dem har bekreftet
  - Demo: "Simuler bekreftelse"-knapp
  - Varsling: "Du faar beskjed naar bekreftelsen er mottatt"
          |
          v
Steg 6: Trust Profil (eksisterende, med justeringer)
  - Brukeren kan na fortsette med selvdeklarering
```

## Tekniske detaljer

### Brreg Roller-API
Brreg har et eget endepunkt for roller: `https://data.brreg.no/enhetsregisteret/api/enheter/{orgnr}/roller`

Returnerer rollegrupper med typer som:
- "Daglig leder/adm.direktor" -- inneholder daglig leder
- "Styre" -- inneholder styrets leder, nestleder, styremedlemmer

Vi lager en ny funksjon `fetchRoller` i `useBrregLookup.ts` som henter og parser dette.

### Endringer i `useBrregLookup.ts`
- Legge til interface `BrregRolle` med navn, foedselsdato, rolletype
- Legge til interface `BrregRolleGruppe` med type og roller-liste
- Ny funksjon `lookupRoller(orgNumber)` som kaller roller-endepunktet
- Returnerer filtrert liste: kun "Daglig leder" og "Styrets leder"

### Endringer i `VendorResponseDemo.tsx`
Nye steg og state:

**Ny state:**
- `vendorCompanyName` -- pre-fylt fra "e-posten" (hardkodet "Acme Consulting AS" e.l.)
- `searchResults` -- liste med Brreg-treff for navnesok
- `selectedCompany` -- valgt virksomhet fra listen
- `companyRoles` -- styreleder og daglig leder hentet fra Brreg
- `roleEmails` -- objekt med e-post per rolle (fylt inn av brukeren)
- `verificationSent` -- hvilke roller som har fatt e-post
- `verificationConfirmed` -- om bekreftelse er mottatt

**Nye step-typer:**
- `"trust-org"` -- redesignet: viser pre-fylt sok med resultatliste
- `"trust-roles"` -- nytt steg: viser styreleder/daglig leder, be om e-post
- `"trust-pending"` -- nytt steg: venter paa bekreftelse
- `"trust-contact"` -- fjernes (erstattes av trust-roles)
- `"trust-verify"` -- fjernes (erstattes av trust-pending)

**trust-org (redesignet):**
- Firmanavn fra e-post-konteksten er pre-fylt i sokefeltet
- Automatisk sok ved innlasting (useEffect)
- Resultatliste med radioknapper eller klikkbare kort
- Hvert kort viser: navn, org.nr, bransje, sted
- "Bekreft"-knapp som henter roller og gaar videre

**trust-roles (nytt):**
- Overskrift: "Bekreft ledelsen i [Firmanavn]"
- Kort for styreleder og daglig leder med navn og rolle
- E-postfelt under hvert kort
- Info-tekst: "En av disse maa bekrefte at du representerer selskapet"
- "Send verifisering"-knapp

**trust-pending (nytt):**
- Statusvisning med ikon per person (venter/bekreftet)
- Tekst: "Vi har sendt en e-post til [navn]. Naar de bekrefter, kan du fortsette."
- "Du faar varsel paa e-post naar bekreftelsen er mottatt"
- Demo-knapp: "Simuler bekreftelse" som setter confirmed = true
- Naar bekreftet: "Fortsett til Trust Profil"-knapp aktiveres

### Demo-data for Sverige og Danmark
For SE/DK (som ikke har Brreg) legger vi til mock-roller i demo-dataen:
- Spotify: CEO Daniel Ek, Styreleder (mock)
- Novo Nordisk: CEO Lars Fruergaard Jorgensen, Styreleder (mock)

### Filendringer
- **Endret**: `src/hooks/useBrregLookup.ts` -- ny `lookupRoller`-funksjon og roller-interfaces
- **Endret**: `src/pages/VendorResponseDemo.tsx` -- redesignet trust-org, nye steg trust-roles og trust-pending, fjernet trust-contact og trust-verify

### Ingen databaseendringer
Hele flyten forblir en klientside-demo. Ingen migrasjoner.

