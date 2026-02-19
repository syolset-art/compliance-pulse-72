

# Duplikatsjekk ved leverandortillegging og Trust Profile-synlighet

## Oversikt
Tre endringer:
1. Fjerne duplikaten "LINK UTVIKLING AS" fra databasen
2. Legge til automatisk duplikatsjekk nar bruker soker/legger til leverandor -- slik at eksisterende leverandorer vises tydelig og ikke kan legges til pa nytt
3. Vise tydelig om en leverandor har en "ekte" Trust Profile (selvregistrert innhold) vs. en AI-generert profil nar den velges i soket

## Hva som endres

### 1. Slett duplikat fra databasen
- Fjern en av de to "LINK UTVIKLING AS"-radene fra `assets`-tabellen via SQL-migrering

### 2. Duplikatsjekk i AddVendorDialog
- Nar bruker trykker "Sok", kjor parallelt et oppslag mot `assets`-tabellen (i tillegg til BrReg/CVR) for a sjekke om leverandoren allerede finnes
- Matching basert pa: org_number (eksakt match) ELLER navn (case-insensitive ILIKE)
- Eksisterende leverandorer vises i sokeresultatene med tydelig "Allerede registrert"-badge og kan ikke legges til pa nytt
- Ved manuell registrering: sjekk mot eksisterende for brukeren bekreftes til neste steg
- I `handleManualConfirm`: asynkron sjekk mot database for brukeren gar videre

### 3. Trust Profile-badge i sokeresultater
- Nar en eksisterende leverandor vises, vis en av to badges:
  - **"Verifisert Trust Profile"** (gronn, med Shield-ikon): Leverandoren har selv registrert og forvalter sin compliance-profil (publish_mode !== 'private' ELLER har vendor_documents med visse typer)
  - **"AI-generert profil"** (lilla, med Sparkles-ikon): Profilen er auto-generert av Mynder/Lara og ikke verifisert av leverandoren selv
- Klikk pa en eksisterende leverandor navigerer til Trust Profile i stedet for a opprette duplikat

### 4. Berikelse av sokeresultater med eksisterende data
- Nar bruker soker i BrReg og vi finner en match i var database (basert pa org_number), merk resultatet som "allerede registrert" med link til profilen
- Vis compliance_score og antall dokumenter for eksisterende leverandorer

## Tekniske detaljer

### Database-migrering
- `DELETE FROM assets WHERE id = 'b7278e1d-3b5b-469f-bded-29db1c43b0be'` (fjerner duplikat LINK UTVIKLING AS)

### Filer som endres

**`src/components/dialogs/AddVendorDialog.tsx`**:
- Ny funksjon `checkDuplicates(name, orgNumber?)`: spor mot `assets`-tabellen
- I `handleSearch`: etter BrReg-resultater, kryss-sjekk mot eksisterende via org_number
- I `handleManualConfirm`: async sjekk for navnet, vis advarsel med knapp "Ga til eksisterende" eller "Legg til likevel"
- I sokeresultat-rendering: vis Trust Profile-status (verifisert vs AI-generert) for eksisterende leverandorer
- Ny visuell komponent for "Denne leverandoren finnes allerede"-advarselsboks med:
  - Leverandornavn og compliance-score
  - Badge for Trust Profile-type
  - Knapp "Apne Trust Profile" som navigerer til `/assets/[id]`
  - Knapp "Legg til likevel" (skjult bak en bekreftelse)

**`src/hooks/useVendorLookup.ts`**:
- Utvid `searchInternal` til a returnere `compliance_score`, `publish_mode`, og antall dokumenter
- Utvid `VendorSearchResult`-interfacet med `complianceScore?`, `publishMode?`, `documentCount?`
- Etter BrReg-sok: automatisk kryss-sjekk mot interne assets basert pa org_number for a flagge duplikater

### Flyt etter endring

```text
Bruker soker "Link Utvikling"
      |
      v
BrReg returnerer resultat (org.nr 920 420 866)
      |
      v
System sjekker: finnes org.nr i assets-tabellen?
      |
  JA: Vis resultatet med:
      - "Allerede registrert"-badge
      - Trust Profile-type (Verifisert / AI-generert)
      - Compliance-score
      - Knapp: "Apne Trust Profile"
      - Kan IKKE legges til pa nytt
      |
  NEI: Normal flyt -> Kategoriser -> Kontakt -> Bekreft -> Lagre
```

