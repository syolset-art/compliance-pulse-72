

## Plan: Flytt Oppfølgingsstatus (TPRM) til toppen av "Veiledning fra Mynder"

### Hva endres

Oppfølgingsstatus-modulen (`VendorTPRMStatus`) flyttes fra "Bruk og kontekst"-fanen til **toppen** av "Veiledning fra Mynder"-fanen (`VendorOverviewTab`), rett **foran** Oppgaver-kortet under seksjonen "Vårt modenhetsarbeid". Den forblir også i Bruk og kontekst for detaljer.

### Endringer

**1. `VendorOverviewTab.tsx`**
- Importere `VendorTPRMStatus`
- Plassere den øverst i `<div className="space-y-4">` (linje 198), før Tasks-kortet
- Sende nødvendige props: `assetId`, `assetName`, `vendorName`, `contactPerson`, `contactEmail` fra `asset`-objektet som allerede er tilgjengelig

**2. Ingen andre filer endres**
- `VendorUsageTab.tsx` beholder sin kopi — det gir mening å ha TPRM-status synlig begge steder
- Ingen databaseendringer nødvendig

### Resultat
Brukeren ser Oppfølgingsstatus øverst i veiledningsfanen med direkte kobling til manglende dokumenter og handlingsknapper, etterfulgt av oppgavene som gjenstår.

