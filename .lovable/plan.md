

## Pre-fill kontaktperson fra databasen i forespørsler

### Problem
Når du sender en forespørsel fra en leverandørprofil, må du manuelt skrive inn e-post til mottakeren -- selv om denne informasjonen allerede finnes i databasen for alle demo-leverandører.

### Losning
Hente `contact_person` og `contact_email` fra asset-dataene og pre-fylle mottakerfeltet automatisk. Feltet vises som ferdig utfylt og kan fortsatt redigeres om nødvendig.

### Endringer

**1. `RequestUpdateDialog.tsx`**
- Legg til `contactPerson` og `contactEmail` som valgfrie props
- Bruk `contactEmail` som default-verdi for `recipientEmail`-state
- Vis kontaktpersonens navn ved siden av e-postfeltet slik at det er tydelig hvem som mottar forespørselen
- Feltet er redigerbart, men allerede fylt ut for demo-leverandører

**2. `AssetHeader.tsx`**
- Send `contact_person` og `contact_email` fra asset-objektet videre til `RequestUpdateDialog` som props

### Teknisk detalj

```text
AssetHeader
  |-- asset.contact_person ("Compliance Team")
  |-- asset.contact_email ("compliance@vippsmobilepay-demo.no")
  |
  v
RequestUpdateDialog
  |-- contactPerson={asset.contact_person}
  |-- contactEmail={asset.contact_email}
  |
  v
  recipientEmail = contactEmail || "" (pre-filled)
  Viser: "Mottaker: Compliance Team <compliance@...>"
```

Resultatet er at under demoen trenger du aldri å skrive inn kontaktinfo for leverandører som allerede er registrert. For nye leverandører uten lagret kontaktinfo forblir feltet tomt som før.

