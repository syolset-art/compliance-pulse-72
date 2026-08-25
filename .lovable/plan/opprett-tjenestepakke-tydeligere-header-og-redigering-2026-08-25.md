# Opprett tjenestepakke — tydeligere header og redigering

## Mål
Panelet skal presentere seg som "Opprett tjenestepakke" for det regelverket brukeren allerede har valgt, og gjøre det tydelig at pakken kan redigeres: fjerne krav/oppgaver, legge til egne aktiviteter, sette pris og se sluttsum.

## Endringer

### 1. Header
- Fast tittel: **Opprett tjenestepakke**.
- Under tittelen: valgt regelverk som ren tekst (ikke valgbart), f.eks. "Regelverk: ISO 27001".
- Pakkenavn flyttes fra tittelfeltet til et eget, obligatorisk navnefelt rett under headeren, med standardverdi «{regelverk} rådgivning» (kan endres).
- Info-ikonet beholdes med kort forklaring av hva som kan gjøres.

### 2. Redigering av pakken
- Krav/oppgaver: hver rad kan hukes av/på (allerede mulig) — legg til tydelig «Fjern»-handling og en liten hjelpetekst øverst i listen om at avhukede krav ikke tas med i pakken.
- «Legg til egen aktivitet» gjøres synlig både øverst og nederst i listen, ikke bare i tom-tilstand.
- Per rad: mulighet til å overstyre pris i kroner i tillegg til timer (bruker eksisterende `priceOverride`), slik at brukeren kan sette fastpris på en aktivitet.

### 3. Sluttsum
- Oppsummeringsboksen beholdes, men merkes tydelig som **Sluttsum** med linjene: aktiveringspris, oppgaver/timer, og total.
- Total inkluderer prisoverstyringer per aktivitet.

## Teknisk
- Alt skjer i `src/components/msp/MSPFrameworkTaskPackageSheet.tsx`.
- Prisoverstyring bruker feltet `priceOverride` som allerede finnes i `src/lib/frameworkTaskPackage.ts`; ingen databaseendring nødvendig.
- Navn lagres videre via `customName` i pakkestate som i dag.
