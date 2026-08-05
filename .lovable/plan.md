# Fullfør Trust Center-flyten

Trust Center har ingen nivåer — kunden får ett Trust Center. Kortet skal derfor si «Aktiver», aktiveringen skal vise samme informasjon som de andre aktiveringene, og etter aktivering skal partneren se hvor i oppsettet kunden står.

## Produktkortet

- CTA på Trust Center-kortet er **Aktiver** når produktet er inaktivt (ingen «Endre nivå» — det finnes ingen nivåer).
- Når produktet er aktivt viser kortet en statuspille med hvor i prosessen kunden er, og CTA blir **Åpne veiledning**.
- Statusene:

```text
Ikke aktivert
Aktivert – claim ikke sendt
Claim sendt – venter på kunden
Claimet av kunden
Trust Center publisert
```

- Under statuspillen: én kort linje med neste steg, f.eks. «Neste: send claim-e-post til kunden».

## Aktiveringsdialogen

- Samme informasjonsnivå som de andre aktiveringene: «490 kr per måned eks. mva. Alle priser er eks. mva. Tjenesten aktiveres umiddelbart, og faktureres på neste faktura.»
- Steg 1 vilkår + driftspartner-rolle (uendret), steg 2 praktisk oppsett med claim-valg (uendret), steg 3 avsluttes med to valg: **Åpne veiledning** (åpner panelet) eller **Bli her**. «Jobb med Trust Profilen» flyttes inn i veiledningen.

## Veiledningspanel fra høyre

Nytt Sheet-panel (side="right") som forklarer stegene og viser fremdrift. Kan åpnes fra kortet og rett etter aktivering.

1. **Trust Center aktivert** — hakes av automatisk ved aktivering.
2. **Send claim til kunden** — viser mottaker (kundens e-post), knapp «Send claim-e-post» / «Send på nytt», og dato for sist sendt. Anbefaling om 55 % modenhet vises her.
3. **Kunden claimer profilen** — venter på kunden; knapp «Marker som claimet» for manuell registrering.
4. **Fyll ut Trust Profilen** — knapp «Jobb med Trust Profilen» som bytter til kundens organisasjon (samme kontekstbytte som i dag).
5. **Publiser Trust Center** — knapp «Marker som publisert».

Hvert steg viser status (ferdig / pågår / venter), kort forklaring på én til to linjer, og bare det aktive steget har knapp fremhevet.

## Teknisk

- Ny `src/lib/trustCenterStatus.ts`: status-enum, lesing/skriving av stegstatus per kunde (bygger videre på dagens `claimSentKey` i localStorage, samme mønster som `moduleActivationState`), `trustCenterStatusFor(customerId, isActive)` og labels.
- Ny `src/components/msp/TrustCenterGuideSheet.tsx`: Sheet fra høyre med de fem stegene, knapper for send claim / marker claimet / marker publisert / jobb med Trust Profilen (gjenbruker `enterCustomerOrg` + `entryRouteFor` fra `ActivateTrustCenterDialog`).
- `ActivateTrustCenterDialog.tsx`: skriver steg-status ved aktivering og claim-sending; steg 3 får «Åpne veiledning» i stedet for direkte kontekstbytte.
- `CustomerServicesAndProductsTab.tsx`: for `trust`-produktet settes `ctaOverride` til «Aktiver» / «Åpne veiledning», `footer` viser statuspille + neste steg, og klikk åpner enten aktiveringsdialogen eller veiledningspanelet.
- Ingen databaseendringer; stegstatus lagres lokalt inntil Trust Center-produktet får egne felt.
