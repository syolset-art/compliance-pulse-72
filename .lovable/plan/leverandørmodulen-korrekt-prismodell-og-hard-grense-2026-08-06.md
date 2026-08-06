# Leverandørmodulen: korrekt prismodell og hard grense

## Problemet

Kortet viser «26 av 5 leverandører i bruk». Årsaken er bekreftet i koden: antall leverandører hentes fra faktiske data i databasen, mens nivået leses fra lokal modulstatus som står på gratis (inntil 5) så lenge ingen har valgt et nivå. De to kildene er ikke koblet sammen, så kortet kan vise et forbruk som er høyere enn grensen.

## Hva som endres

1. **Nivået kan aldri være lavere enn faktisk bruk.** Kapasitetslogikken får en «påkrevd nivå»-beregning: minste nivå som rommer dagens antall leverandører (5 / 20 / 50 / 100). Hvis lagret nivå er lavere enn påkrevd nivå, løftes det automatisk til påkrevd nivå og lagres. Da vises «26 av 50», aldri «26 av 5».

2. **Hard sperre ved full kapasitet.** Når antall leverandører har nådd nivåets grense, kan man ikke registrere flere: knappen «Legg til leverandør» blir deaktivert med forklaring, og klikk åpner nivådialogen i stedet. Dette gjelder både leverandøroversikten og alle andre steder en leverandør kan registreres.

3. **Nedgradering blokkeres når bruken er for høy.** I nivådialogen markeres nivåer under dagens antall leverandører som utilgjengelige, med tekst om hvor mange leverandører som må fjernes først.

4. **Tydelig status på modulkortet.** Ved full kapasitet vises en kort linje: «Grensen er nådd — endre nivå for å legge til flere», og hovedknappen blir «Endre nivå». Samme visning i Innstillinger > Produkter og i partnerens Produkter-fane for kunden.

## Teknisk

- `src/lib/vendorCapacity.ts`: ny `getRequiredVendorTierId(used)` og `resolveVendorCapacity(used)` som synkroniserer lagret nivå (`setModuleTier("vendors", ...)`) opp til påkrevd nivå og returnerer kapasitet.
- `src/pages/VendorDashboard.tsx`: bruker `resolveVendorCapacity`, deaktiverer legg-til-knappen ved `atCap` og ruter til nivådialogen.
- `src/components/dialogs/AddVendorDialog.tsx`: sikkerhetssjekk mot kapasitet ved lagring, slik at grensen ikke kan omgås.
- `src/components/subscriptions/ChangeVendorTierDialog.tsx`: nivåer under `used` deaktiveres med begrunnelse.
- `src/pages/Subscriptions.tsx` og `src/components/msp/CustomerServicesAndProductsTab.tsx`: henter nivå og grense fra samme kapasitetsfunksjon i stedet for rå lagret nivå.
- `src/components/subscriptions/ModuleCard.tsx`: legger til «grense nådd»-visning når forbruk = grense.

Ingen databaseendringer.
