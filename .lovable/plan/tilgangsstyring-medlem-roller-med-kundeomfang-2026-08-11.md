# Tilgangsstyring: medlem + roller med kundeomfang

## Modellen

Alle som inviteres blir **Medlem** — det er grunntilgangen og kan ikke fjernes. Roller legges oppå, og en bruker kan ha begge:

```text
Medlem (alltid)
  └── Kundeansvarlig  (valgfri)  → portefølje, tilbud, meldinger
  └── Driftspartner   (valgfri)  → jobber i kundens compliance-profil
                                   ├── Tilgang: Lese / Lese og skrive
                                   └── Omfang:  Alle kunder / Valgte kunder
```

- **Medlem**: ser partnerdelen (kundeoversikt på lesenivå), men jobber ikke inne hos kundene.
- **Kundeansvarlig**: eier kunderelasjonen — tilbud, behovsanalyse, meldinger.
- **Driftspartner**: eneste rollen som gir tilgang inn i kundens virksomhetsprofil. Derfor er lese/skrive og kundeomfang bare relevant for denne rollen.

## Endringer i Tilgangsstyring

Radene i brukerlista blir:

- Navn/e-post + fast «Medlem»-merke.
- To brytere: Kundeansvarlig og Driftspartner.
- Når Driftspartner er på, vises to felt på raden: tilgangsnivå (Lese / Lese og skrive) og omfang (Alle kunder / Valgte kunder). Ved «Valgte kunder» åpnes en liten kundevelger med avkryssing, og raden viser «3 kunder».
- Kort oppsummering under lista som forklarer de tre nivåene.

Inviter-dialogen får samme struktur: navn, e-post, «blir medlem»-notis, de to rollebryterne, og driftspartner-feltene når rollen er valgt. Bekreftelses-toast oppsummerer rolle, tilgang og omfang.

## Konsekvenser andre steder

- Driftspartner-merket på kundekort/banner vises for brukere hvis omfang dekker den kunden (alle kunder, eller kunden er valgt).
- Der Driftspartner-rollen godkjennes i vilkårsdialogen (globalt vs. per kunde) beholdes dagens valg — det speiler samme omfangsbegrep, og vi bruker nå samme ordlyd: «Alle kunder» / «Valgte kunder».

## Teknisk

- `src/lib/partnerTeam.ts`: `PartnerTeamMember` endres fra `role: PartnerRole` + `access` til:
  `roles: PartnerRole[]` (kan være tom = kun medlem), `access: PartnerAccess`, `scope: "all" | "selected"`, `customerIds: string[]`. Legger til labels/beskrivelser for medlem og omfang, samt hjelperen `canOperateCustomer(member, customerId)`.
- `src/pages/MSPPartnerSettings.tsx`: rad-UI og invite-dialog bygges om etter modellen over; drift-feltene rendres betinget.
- Kundevelger bruker eksisterende demo-kundeliste (samme kilde som MSP-dashbordet).
- Oppdaterer kallsteder som leser `member.role` (bl.a. driftspartner-merket i `CustomerStatusBanner`) til å bruke `roles`/`canOperateCustomer`.
- Fortsatt demo-data i localStorage; ingen databaseendring i dette steget.
