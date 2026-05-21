## Mål

Gjøre om `/mynder-admin/dashboard` fra et MRR-fokusert ark til et **eier­perspektiv** som svarer på to spørsmål:

1. **Partnerkanal:** Hvor mange partnere har vi? Hvor mange kunder har hver partner, og hvilke moduler/regelverk bruker de?
2. **Direktesalg:** Hvilke kunder har vi solgt til selv, og hva har de kjøpt?

Tilgang strammes inn til **Daglig leder** og **Superbruker**.

## Tilgangskontroll

- Wrap `MynderAdminDashboard` i en `AdminRouteGuard` som leser fra `useUserRole()`.
- Tillatte roller: `super_admin`, `daglig_leder`.
- Andre roller (inkl. demo-roller) får et tomt skall med melding *"Denne siden er forbeholdt ledelsen i Mynder."* og knapp tilbake til `/`.
- Skjul også sidebar-lenken hvis brukeren ikke har rollene (sjekk hvor `/mynder-admin` lenkes inn fra).

## Datamodell (demo)

Utvid `CustomerRow` i `MynderAdminDashboard.tsx`:

- `salesChannel: "direct" | "partner"` — hvem solgte kunden.
- `partnerId?: string` — hvilken partner kunden tilhører (når `salesChannel = "partner"`).
- Eksisterende `isPartner` flagger som *kunden selv er partner* — beholdes, men er separat fra salgskanal.

Ny `PartnerRow` (demo):

```ts
interface PartnerRow {
  id: string;
  name: string;            // f.eks. "Bouvet", "Sopra Steria"
  type: "MSP" | "MSSP" | "Konsulent" | "Reseller";
  country: string;
  since: string;
  contactEmail: string;
  commissionPct: number;   // demo
}
```

Seed ~4–5 partnere og fordel kundene fra dagens demo-array slik at noen får `salesChannel: "partner"` med en `partnerId`, resten blir `direct`.

## Ny sidestruktur

```text
[Header: Mynder innstillinger – Dashbord]   [Eksporter]

[Hero KPI-rad — 4 kort, kompakt, store tall]
  Partnere · Partnerkunder · Direktekunder · MRR totalt

[Tabs: «Partnerkanal» | «Direktesalg»]

—— Tab: Partnerkanal ——————————————————————————
[Partnerliste — kort eller tabell]
  • Partnernavn · type · land · # kunder · sum MRR · provisjon
  • Klikk → utvider rad og viser kundene under denne partneren:
      Kundenavn · plan · moduler · regelverk · brukere · MRR · status

—— Tab: Direktesalg ———————————————————————————
[KPI-strip: # direktekunder, snitt MRR, topp bransje]
[Bransjefordeling — kompakt donut + topp 5]
[Plan-fordeling — minihistogram]
[Kundetabell, kun direkte kunder]
  Kunde · land · bransje · plan · moduler · regelverk · brukere · MRR · faktura
```

MRR-vs-budsjett-hero og budsjett-popover fjernes fra hovedview (flyttes evt. til en egen «Økonomi»-fane senere — utenfor scope nå).

## Visuell stil

Følger nåværende dashbord-uttrykk: små store tall, slanke rader, minimal tekst (samme retning som styrebordet vi nettopp strammet inn). Bruk eksisterende `MetricCard` for KPI-rad og semantiske tokens.

## Tekniske detaljer

- Fil: `src/pages/MynderAdminDashboard.tsx` skrives om. Ingen DB-endringer (kun demo-data utvides in-place).
- Ny komponent: `src/components/mynder-admin/AdminRouteGuard.tsx` (liten, leser `useUserRole`).
- Ny komponent: `src/components/mynder-admin/PartnerChannelView.tsx` og `DirectSalesView.tsx` for å holde hovedfilen lesbar.
- Tabs via eksisterende `@/components/ui/tabs`.
- Ingen endringer i ruter; `/mynder-admin` og `/mynder-admin/dashboard` peker fortsatt til samme side.
- Sidebar-lenken til Mynder admin (lokaliser via søk i `src/components/Sidebar.tsx`) skjules når rollen ikke er `super_admin`/`daglig_leder`.

## Utenfor scope

- Ekte database-tabell for partnere (kommer når vi vet hva som skal persisteres).
- Provisjon-/faktureringslogikk mot partner.
- MRR-budsjett-modul (fjernes fra view, kan reintroduseres som egen fane senere).
