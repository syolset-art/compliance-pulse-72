# Driftpartner-bekreftelse i vilkårssteget

Når vilkårene godtas i partnerkontekst, legges det til ett ekstra avkryssingsspørsmål: "Skal du ha rolle som Driftpartner?" med et info-ikon som forklarer rollen. Svaret logges sammen med aksepten.

## Slik blir flyten

1. Bruker huker av for vilkår og betingelser som i dag.
2. Rett under kommer én ny, like diskré linje: avkryssingsboks + teksten "Skal du ha rolle som Driftpartner?" og et lite info-ikon.
3. Info-ikonet (hover/tap) forklarer: "Som driftpartner kan du utføre arbeid på dette produktet eller tjenesten på vegne av kunden, og bekrefter at du har fått godkjenning fra kunden."
4. Driftpartner-avkryssingen er valgfri — den blokkerer ikke bekreft-knappen. Kun vilkårsboksen er påkrevd.
5. Ved bekreftelse logges svaret (ja/nei) sammen med vilkårsaksepten.

## Hvor det vises

Kun i flyter der en partner aktiverer eller kjøper på vegne av en kunde:
- `ActivateRecommendationsDialog` (aktivering fra kundeoversikt og kundekort)
- `FrameworkOrderConfirmDialog`
- `AssignLicenseDialog` og `PurchaseLicensesDialog`

Ikke i kundens egne flyter (Mynder Core-aktivering, nivåendring på egen konto), der driftpartner-rollen ikke er relevant.

## Teknisk

- Ny kolonne `operator_role boolean not null default false` på `terms_acceptances` (migrasjon; eksisterende GRANT/RLS uendret).
- `useTerms.acceptTerms(context, contextRef, options?)` utvides med `{ operatorRole?: boolean }` som skrives til kolonnen. Eksisterende kall er uendret.
- `TermsAcceptRow` får valgfrie props `showOperatorRole`, `operatorRole`, `onOperatorRoleChange`. Info-ikon via eksisterende `Tooltip`/`Popover` fra designsystemet, ingen ny styling.
- De fire partnerdialogene holder lokal `operatorRole`-state, sender den til `TermsAcceptRow` og videre til `acceptTerms`. Nullstilles når dialogen lukkes.
- `Legal.tsx` / aksepthistorikk viser "Driftpartner" som en liten merkelapp på aksepter der feltet er satt.
