# Vilkår ved endring av nivå

Når brukeren bekrefter en nivåendring på et aktivert produkt, må vilkårene godtas i samme steg — uten et ekstra dialogsteg.

## Slik blir flyten

1. Bruker klikker "Endre nivå" og velger nytt nivå (uendret).
2. Bekreftelsesdialogen viser pris/tidspunkt som i dag, og får én diskré linje nederst: avkrysningsboks + lenke til vilkår og betingelser (med versjonsnummer).
3. Bekreft-knappen er deaktivert til boksen er huket av. Har brukeren allerede godtatt gjeldende versjon, er den forhåndsavkrysset, slik at flyten føles uendret.
4. Ved bekreftelse logges godkjenningen (kontekst = lisenskjøp, referanse = valgt nivå) før nivået endres.

Kun oppgraderinger og nedgraderinger av Mynder Core-nivå berøres. Ingen ny dialog, ingen ekstra klikk for de som allerede har godtatt siste versjon.

## Teknisk

- `ConfirmCoreTierChangeDialog.tsx`: legg inn `TermsAcceptRow` + `useTerms` (`hasAcceptedCurrent` som startverdi), disable bekreft-knapp til avhuket, og kall `acceptTerms("license_purchase", nextTierId)` før `onConfirm()`. Nullstill lokal avkryssing når dialogen lukkes.
- Ingen endringer i `Subscriptions.tsx` utover eventuell async-håndtering av `handleCoreTierConfirm`.
- Samme mønster brukes allerede i `TermsGateDialog` ved aktivering — ingen ny datamodell eller migrasjon.
