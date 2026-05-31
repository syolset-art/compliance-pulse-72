## Bakgrunn

På Trust Center-aktiveringsveiviseren (`ActivateTrustProfileWizard`) er det to feil i steg 1:

1. **Lara-meldingen er feil.** Toppen viser «Lara · Steg 1 av 7», men teksten under sier «Siste steg — hvem skal få se profilen?». Det skyldes at `laraIntro`-switchen mangler en case for steg 1, så fallback for steg 7 vises.
2. **Selskapsnavnet er forhåndsutfylt og låst** til verdien fra demo-profilen («Dips Arena»). Feltet skal være tomt slik at brukeren selv skriver inn et navn, får treff fra Brreg, velger riktig organisasjon, og deretter får org.nr automatisk utfylt.

## Endringer

### 1. `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`

**Lara-melding for steg 1:** Legg til eksplisitt steg 1-tekst i `laraIntro`-switchen (linje ~677–683), f.eks.:
> «Hei! Jeg er Lara. La oss aktivere Trust Center-profilen din sammen — det tar bare et par minutter.»

**Selskapsnavn skal være valgbart fra Brreg:**
- Når kun `initialCompanyName` finnes (org.nr mangler), skal feltet ikke være låst. Sett `companyNameLocked = false` i denne situasjonen slik at brukeren kan skrive et annet navn og søke på nytt mot Brreg.
- Alternativt: ignorer `initialCompanyName` helt i steg 1 hvis `initialOrgNumber` ikke finnes, slik at feltet starter tomt og brukeren styrer hele flyten selv.
- Beholder dagens oppførsel der både navn og org.nr er kjent (vises som «bekreftet organisasjon»-sammendrag).
- Brreg-treffene rendres allerede som klikkbare kort (`pickRegistry`) som setter både navn og org.nr — denne logikken trenger ingen endring, bare at navnefeltet er redigerbart.

### Akseptansekriterier

- Steg 1 viser en passende velkomst-/intro-tekst fra Lara, ikke «Siste steg»-teksten.
- Selskapsnavn er tomt (eller redigerbart) ved start; brukeren skriver inn et navn, ser Brreg-treff, velger riktig organisasjon, og org.nr fylles inn automatisk.
- Ingen andre steg eller funksjoner endres.