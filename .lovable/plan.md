# Leverandørmodulen skal vises i menyen når den er aktivert

## Hva som er galt i dag

Produkter-siden (Innstillinger → Produkter) og sidemenyen leser to forskjellige kilder for om Leverandørmodulen er aktiv:

- Produkter-siden skrur modulen av/på via modulstatus (`activateModule("vendors")` / avvikling med status `inactive` eller `pending_cancellation`).
- Sidemenyen viser modulen bare hvis `hasRegistriesAccess` er sann, og den bygger på et annet lager (`module-vendors` i listen over aktiverte tjenester) eller på hva som ble valgt i onboarding.

Resultat: modulen kan stå som aktivert i Produkter, mens menypunktet «Leverandører» ikke vises. Avvikling fungerer derimot (deaktiverte moduler skjuler punktet).

## Slik skal det fungere

- Modulen er aktiv i Produkter → «Leverandører» vises i sidemenyen som eget toppnivå-punkt, rett under Mynder Core-seksjonen (slik det allerede er plassert i koden).
- Modulen er under avvikling → punktet blir stående til avviklingen trer i kraft ved periodeslutt.
- Modulen er avviklet/inaktiv → punktet forsvinner fra menyen.
- Endringen slår inn umiddelbart uten refresh (modulstatus sender allerede ut en `modules:changed`-hendelse som menyen kan lytte på).

## Teknisk

1. `src/hooks/useSubscription.ts`: gjør `hasRegistriesAccess` til én sannhetskilde basert på modulstatus for `vendors`:
   - aktiv hvis status er `active` eller `pending_cancellation` (ikke utløpt), eller hvis tjenesten/onboarding-valget indikerer aktivering,
   - alltid usann når modulen ligger i `getDeactivatedModules()`.
   Bruk `getModuleStates()`/`getModuleStatus` fra `src/lib/moduleActivationState.ts` med samme `modules:changed`-lytter som allerede finnes i hooken.
2. `src/components/Sidebar.tsx`: `showVendorsNormal` bygger videre på `hasRegistriesAccess` (uendret logikk), men fjerner avhengigheten til `selectedRegistriesAtOnboarding` som eneste kilde, slik at avvikling alltid vinner.
3. Kontroller at «Registre»-seksjonen (Systemer/Eiendeler) ikke også styres av samme flagg på en måte som skjuler systemer når leverandørmodulen avvikles — Systemer hører til Mynder Core og skal bli stående.
4. Merk endringen i koden med en kort `// v1.1` -kommentar der logikken endres, slik utvikler ser at dette er en justering.

## Verifisering

Aktiver Leverandørmodulen i Produkter → menypunktet dukker opp umiddelbart. Avvikle den → punktet forsvinner (eller står til periodeslutt ved planlagt avvikling), mens Mynder Core og Systemer er uendret.
