# Fullfør flytene: endre nivå, avbestille og aktivere moduler

Produkter-siden (Innstillinger → Produkter) har alle dialogene på plass, men tre flyter stopper på halvveien. Denne planen lukker dem.

## Det som mangler i dag

1. **Endre nivå lagres ikke.** Valgt nivå for Mynder Core og Leverandørmodul ligger bare i komponent-state. Ved refresh faller alt tilbake til standardnivået, og prisen i totalsummen nullstilles.
2. **Nedgradering under faktisk bruk stoppes ikke.** Har kunden 22 systemer, kan de fortsatt velge nivået med plass til 10 uten noen advarsel eller konsekvens.
3. **Avbestilling skjer umiddelbart.** Bekreftelsen sier «trer i kraft ved neste faktureringsperiode», men kortet blir inaktivt og prisen settes til 0 med en gang. Det finnes ingen «sagt opp – aktiv til dato»-tilstand og ingen måte å angre oppsigelsen på.
4. **Aktivering mangler kvittering.** Etter vilkårsgodkjenning aktiveres modulen, men brukeren får ingen bekreftelse på hva som skjer med fakturering, og Core kan ikke avbestilles/aktiveres i det hele tatt (den er grunnmodulen — det er riktig, men det bør stå tydelig).

## Slik løses det

### Endre nivå
- Nivåvalg for Core og Leverandørmodul lagres lokalt sammen med modulstatus, slik at nivået overlever refresh og vises riktig i totalsummen.
- Bekreftelsesdialogen viser tydelig: fra-nivå → til-nivå, ny månedspris, prisdifferanse, og når endringen gjelder fra (oppgradering straks, nedgradering ved neste periode).
- Nedgradering til et nivå med mindre plass enn dagens bruk blokkeres med en forklarende melding om hvor mange enheter som må fjernes først.
- «Angre»-handlingen i toasten beholdes, og angring ruller også tilbake den lagrede verdien.

### Avbestille
- Ny tilstand «Sagt opp» i stedet for umiddelbar deaktivering: modulen forblir aktiv og brukbar fram til periodeslutt, kortet får en nøytral merking «Aktiv til {dato}», og prisen telles fortsatt med i totalen inneværende periode.
- Kortet får «Angre oppsigelse» som gjenoppretter modulen uten ny vilkårsgodkjenning.
- Bekreftelsesdialogen for oppsigelse viser hva kunden mister og fra hvilken dato, samt at data beholdes.
- Mynder Core får ingen oppsigelsesknapp, men en kort forklaring om at grunnmodulen ikke kan sies opp separat.

### Aktivere
- Etter godkjente vilkår vises en kvittering i toasten med hva som aktiveres og fra når fakturering starter.
- Modulen blir umiddelbart tilgjengelig i menyen (samme «modules:changed»-signal som i dag).
- En modul som står som «Sagt opp» aktiveres via «Angre oppsigelse» og går ikke gjennom vilkårsdialogen på nytt.

## Teknisk

- Utvid `src/lib/moduleActivationState.ts` til å lagre et objekt per modul: `{ status: "active" | "pending_cancellation" | "inactive", cancelAt?: string, tierId?: string }`, med bakoverkompatibel lesing av dagens liste over deaktiverte moduler. Behold `modules:changed`-eventet.
- `src/components/subscriptions/ModuleCard.tsx`: ny `status`-verdi `pending_cancellation` med nøytral «Aktiv til …»-merking og «Angre oppsigelse»-knapp.
- `src/pages/Subscriptions.tsx`: bytt `deactivatedModules: Set<string>` mot den nye modulstatusen, initier `coreTierId`/`vendorTierId` fra lagret verdi og lagre ved bekreftelse, beregn `totalMonthly` slik at oppsagte moduler telles ut først etter periodeslutt.
- `ConfirmCoreTierChangeDialog.tsx` / `ConfirmVendorTierChangeDialog.tsx`: vis differanse og ikrafttredelsesdato; `ChangeCoreTierDialog.tsx` / `ChangeVendorTierDialog.tsx`: deaktiver nivåer under dagens bruk med forklaring.
- Oppsigelsesdialogen (`AlertDialog` i Subscriptions) oppdateres med dato og konsekvensliste.
- Ingen databaseendringer i dette steget — statusen holdes lokalt som i dag, slik at flytene kan ferdigstilles uten skjemaendring.
