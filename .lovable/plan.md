# Bytt ut «Bekreft mandat» med Driftspartner-rollen

## Hva som endres

I «Veiledning fra Mynder» ligger det i dag en kritisk Lara-oppgave som heter «Bekreft mandat for å jobbe i kundens profil» (kategori «Mandat og fullmakt»). Den fjernes.

I stedet vises en rolig, informativ oppgave om **Driftspartner-rollen**:

- Tittel: «Driftspartner: jobb med compliance på vegne av kunden»
- Kategori: «Rolle · Driftspartner»
- Alvorlighet: medium (ikke kritisk — dette er informasjon, ikke en blokker)
- Tekst: Som driftspartner kan du utføre compliance-arbeid på vegne av kunden. Når du aktiverer et produkt eller en tjeneste hos kunden, får du mulighet til å utføre arbeidet direkte i kundens egen virksomhetsprofil.
- Knapp: «Se produkter og tjenester» — går til fanen for produkter/tjenester der aktivering skjer.

Rollen bekreftes fortsatt der den hører hjemme i dag: i avkrysningen «Skal du ha rolle som Driftpartner?» ved godkjenning av vilkår under aktivering. Ingen endring der.

## Teknisk

- `src/pages/MSPCustomerDetail.tsx`: erstatt det første elementet i `tasks`-arrayet (mandate-oppgaven) med den nye Driftspartner-oppgaven. `useMandate`, `MandateConfirmDialog` og `mandateDialogOpen` beholdes hvis de brukes andre steder på siden; ellers fjernes de sammen med importen.
- Ingen databaseendringer, ingen endring i vilkårsflyten.
