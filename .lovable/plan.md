

# Plan: Demo-data for Framdrift Innovasjon AS i Trust Profile

## Bakgrunn

Dere skal vise demo for Framdrift Innovasjon AS (Bergen). Per nå er det "Mynder AS" som vises i plattformen via `company_profile`-tabellen og `assets` med `asset_type = "self"`. Vi lager en dedikert demo-seed-funksjon som setter opp Framdrift Innovasjon AS som den aktive virksomheten, med realistisk compliance-data i Trust Profilen.

## Selskapsinformasjon (fra offentlige kilder)

| Felt | Verdi |
|---|---|
| Navn | Framdrift Innovasjon AS |
| Org.nr | 936 431 127 |
| Adresse | Jahnebakken 6, 5007 Bergen |
| Bransje | Bedriftsrådgivning (NACE 70.200) |
| Ansatte | ~5 (nyetablert 2025) |
| Domain | framdrift.no |

## Endringer

### 1. Ny fil: `src/lib/demoSeedTrustProfile.ts`

Oppretter `seedDemoTrustProfile()` og `deleteDemoTrustProfile()`:

- **company_profile**: Upsert med Framdrift Innovasjon AS-data (navn, org.nr, bransje "Rådgivning", domain, compliance_officer, osv.)
- **self-asset**: Upsert `assets` med `asset_type = "self"`, `name = "Framdrift Innovasjon AS"`, `compliance_score = 62`, `publish_mode = "public"`, realistic metadata
- **selected_frameworks**: Sørge for at GDPR og ISO 27001 er valgt
- **evidence_checks**: Legge inn ~8-10 demo evidence checks knyttet til self-asset (governance, security, privacy, third-party) med blanding av `fresh`, `stale`, `missing` statuser
- **vendor_documents**: 3-4 demo-dokumenter (DPA, personvernerklæring, informasjonssikkerhetspolicy) med `visibility = "published"`
- **Delete-funksjon**: Rydder opp og tilbakestiller til tomt

### 2. Oppdater `src/components/Sidebar.tsx`

Legge til "Sett opp Framdrift-demo" og "Slett Framdrift-demo" i virksomhets-dropdown (der demo reset allerede finnes), eller erstatte eksisterende demo-knapper med dette.

### 3. Alternativt: Legge til i eksisterende demo-meny

Hvis det allerede er en demo-meny i sidebaren, legge til Trust Profile-demo der.

## Teknisk

- `company_profile` har ingen foreign key constraints, så vi kan upsert direkte
- Self-asset opprettes allerede av Sidebar.tsx hvis det mangler — vi overskriver den
- Evidence checks bruker `asset_id` + `control_key` for å matche trust controls
- Ingen DB-migrasjoner nødvendig — alle tabeller eksisterer

## Filer

| Fil | Endring |
|---|---|
| `src/lib/demoSeedTrustProfile.ts` | Ny — seed/delete Framdrift-data for Trust Profile |
| `src/components/Sidebar.tsx` | Legge til demo-knapp i company dropdown |

