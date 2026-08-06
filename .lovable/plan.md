# Fullfør flyten ved aktivering og nivåendring

Målet er at prototypen ikke stopper på en toast, men viser hva som skjer videre når brukeren aktiverer en modul eller endrer nivå — spesielt Mynder Core og Leverandørmodulen.

## Dagens tilstand (verifisert)

- `src/pages/Subscriptions.tsx` har hele kjeden: velg nivå (`ChangeCoreTierDialog` / `ChangeVendorTierDialog`) → bekreft med vilkår (`ConfirmCoreTierChangeDialog` / `ConfirmVendorTierChangeDialog`) → `setModuleTier(...)` + en toast med «Angre».
- Aktivering av en avsluttet modul går via `TermsGateDialog` → `reactivateModule()` → toast.
- Etter bekreftelse skjer ingenting mer: ingen kvittering, ingen neste steg, og en planlagt nedgradering vises ikke på modulkortet (kun oppsigelse har «Sagt opp — aktiv til …»).
- Nedgradering under dagens forbruk er blokkert i dialogen med en rød tekst, men uten vei videre.

## Det som bygges

### 1. Kvitterings- og neste steg-panel
Ny `ModuleChangeReceiptSheet` (side-panel fra høyre), åpnes automatisk etter bekreftet aktivering eller nivåendring:
- Kvittering: modul, fra-nivå → til-nivå, ny månedspris eks. mva, når det trer i kraft (umiddelbart ved oppgradering, ved neste fakturaperiode ved nedgradering), og at det faktureres på neste faktura.
- Vilkårslinje: akseptert versjon og dato.
- «Neste steg» — 2–3 konkrete handlinger tilpasset modulen:
  - Mynder Core: Gå til Systemer, Oppdag systemer (automatisk kartlegging), Se behandlingsprotokoll.
  - Leverandørmodul: Gå til Leverandører, Legg til leverandør, Send spørreskjema.
- Sekundært: «Angre endringen» og «Lukk».

### 2. Planlagt nivåendring synlig på kortet
- Nedgradering lagres som planlagt endring (nivå + dato) sammen med modulstatusen, ikke bare som ny verdi.
- `ModuleCard` får en badge/fotnote: «Nedgradering til Inntil 20 fra 1. september» med «Angre»-lenke.
- Oppgradering vises som aktiv med én gang.

### 3. Vei videre når nedgradering er blokkert
- I nivådialogen erstattes den rene feilteksten med en handling: «Du bruker 14 systemer — fjern 4 for å velge dette nivået» + lenke til Systemer (henholdsvis Leverandører) som lukker dialogen og navigerer dit.

### 4. Aktivering av Leverandørmodulen velger nivå
- Når modulen er avsluttet/inaktiv, går «Aktiver» først til nivåvalg, deretter vilkårsbekreftelse, deretter samme kvitteringspanel — i stedet for dagens direkte vilkårsdialog uten nivåvalg.

## Teknisk

- Ny komponent: `src/components/subscriptions/ModuleChangeReceiptSheet.tsx` (Sheet, side=right), drevet av en `pendingReceipt`-state i `Subscriptions.tsx`.
- `src/lib/planConstants.ts`: hjelper for effektiv dato og prisdifferanse gjenbrukes; ingen prisendringer.
- Modulstatus-lagringen (`getModuleStates` / `setModuleTier`) utvides med `scheduledTier` + `scheduledAt` slik at planlagt nedgradering overlever navigasjon; ingen databaseendringer.
- `ModuleCard` får valgfri `scheduledChange`-prop for badge og angre-lenke.
- All tekst på norsk, priser merket «eks. mva», og gjeldende fargetokens brukes (ingen hardkodede farger).
