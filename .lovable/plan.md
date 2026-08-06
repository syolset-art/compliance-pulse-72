# Fullfør nivå-flyten for Leverandørmodulen hos MSP-kunden

## Problemet i dag

I kundens Produkter-fane (MSP) er "Endre nivå"-knappen på Leverandørmodul og Mynder Core ikke koblet til noe: den kaller bare en generisk oppdatering, uten dialog, bekreftelse eller kvittering. Samme knapp i Innstillinger > Produkter (Abonnement) har hele flyten: velg nivå → bekreft → kvittering med neste steg og angre.

I tillegg er bruken i kundekortet hardkodet: Leverandørmodul viser "11 leverandører" mens gratisnivået har plass til 5. Det gir nettopp situasjonen som ikke skal kunne oppstå — gratis nivå med 11 registrerte leverandører.

## Hva som bygges

### 1. Samme flyt som i Produkt-menypunktet
Kundens produktkort gjenbruker de eksisterende dialogene:
- Leverandørmodul: velg nivå (Inntil 5 gratis / 20 / 50 / 100) → bekreftelse → kvittering.
- Mynder Core: tilsvarende nivådialog.
- Oppgradering trer i kraft umiddelbart; nedgradering planlegges til neste fakturaperiode og vises som "Nedgradering til … fra <dato>" med angre-lenke, akkurat som i dag i Abonnement.
- Aktivering av en avslått modul går via nivåvalg først (aktiveringsmodus), med teksten om at tjenesten aktiveres umiddelbart og faktureres på neste faktura.

### 2. Gratis leverandørnivå er hardt begrenset til 5
- Kortet viser faktisk antall registrerte leverandører mot nivåets grense, ikke et hardkodet tall.
- Når grensen er nådd, viser kortet et tydelig varsel med neste nivå og pris, og en direkte "Oppgrader"-handling.
- Registrering av ny leverandør blokkeres når antallet har nådd nivågrensen (ikke bare gratisnivået): dialogen for å legge til leverandør åpnes ikke, i stedet åpnes nivådialogen. Dette gjelder alle steder en leverandør kan legges til, ikke bare hovedknappen på leverandøroversikten.
- Nedgradering til et nivå med færre plasser enn antall registrerte leverandører forblir sperret, med lenke til leverandørregisteret for å frigjøre plass (som i dag).

## Teknisk

- `src/components/msp/CustomerServicesAndProductsTab.tsx`: erstatt `onUpdate?.()` på `change`-handlingen med `ChangeVendorTierDialog` / `ChangeCoreTierDialog` + `ConfirmVendorTierChangeDialog` + `ModuleChangeReceiptSheet`, og bruk `setModuleTier` / `scheduleModuleTier` / `activateModule` fra `moduleActivationState.ts`. Legg til `scheduledChange`-prop på kortene.
- Fjern hardkodet `usage: { current: 11 }` / `{ current: 10 }` i `PRODUCTS` og hent faktiske tall (leverandører og systemer) fra `assets`-tabellen, med tier-grensen som `usageLimit`.
- Sentraliser grensesjekken i en liten hjelper (`vendorCapacity`) som leser gjeldende tier fra `moduleActivationState` og eksponerer `used`, `limit`, `atCap`, `nextTier` — brukes av `VendorDashboard`, `VendorPremiumBanner` og kundekortet, slik at `MAX_FREE_VENDORS = 5` ikke lever som en egen konstant.
- Ingen databaseendringer.
