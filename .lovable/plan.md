

# Demo-leverandorprofiler med Trust Profiles

## Oversikt
Legger til 11 norske/nordiske demo-leverandorer med realistiske syntetiske Trust Profiles som kan seeds inn i databasen med en knapp, og slettes individuelt eller samlet. Leverandorene far varierende compliance-scorer, dokumenter, sertifiseringer og publish_mode for a vise bredden i Trust Profile-funksjonaliteten.

## Demo-leverandorer med syntetiske data

| Leverandor | Kategori | Land | Compliance | Risk | Publish | Trust Profile-type |
|---|---|---|---|---|---|---|
| Floyen AS | Consulting | NO | 72 | medium | public | AI-generert |
| YouWell AS | SaaS (helse) | NO | 85 | low | public | Verifisert |
| Vipps MobilePay AS | SaaS (betaling) | NO | 96 | low | public | Verifisert |
| Ulriken 643 AS | Facilities | NO | 45 | high | private | AI-generert |
| BankID BankAxept AS | Infrastructure | NO | 98 | low | public | Verifisert |
| Mynder AS | SaaS (compliance) | NO | 91 | low | public | Verifisert |
| DIPS AS | SaaS (helse-IT) | NO | 88 | low | public | Verifisert |
| CheckWare AS | SaaS (helse) | NO | 78 | low | public | AI-generert |
| Connect Vest AS | IT Operations | NO | 62 | medium | private | AI-generert |
| Altinn (Digitaliseringsdirektoratet) | Infrastructure | NO | 94 | low | public | Verifisert |
| NAV (Arbeids- og velferdsdirektoratet) | Infrastructure | NO | 90 | low | public | Verifisert |

## Hva som endres

### 1. Ny fil: `src/lib/demoVendorProfiles.ts`
Inneholder komplett definisjon av alle 11 leverandorer med:
- Asset-data (navn, org_number, land, kategori, compliance_score, risk_score, publish_mode, etc.)
- Tilhorende dokumenter per leverandor (DPA, SOC2, ISO 27001, pentest etc. med varierende gyldighet)
- Funksjon `seedDemoVendorProfiles()` som inserter leverandorer + dokumenter
- Funksjon `deleteDemoVendorProfiles()` som fjerner alle demo-profilene (via en `metadata`-markering `is_demo_profile: true`)

### 2. Oppdater `src/pages/Assets.tsx`
- Legg til en "Seed demo-leverandorer" knapp i headeren (kun synlig i demo-modus eller alltid tilgjengelig)
- Legg til en "Slett demo-leverandorer" knapp
- Knappene kaller `seedDemoVendorProfiles()` / `deleteDemoVendorProfiles()` og invaliderer queries

### 3. Demo-dokumenter per leverandor
Hver leverandor far 2-5 syntetiske dokumenter i `vendor_documents`-tabellen med realistiske datoer:
- Verifiserte profiler: har DPA, ISO 27001, SOC2, noen har pentest
- AI-genererte profiler: har farre dokumenter, noen utgatt

## Tekniske detaljer

### `src/lib/demoVendorProfiles.ts`
- Array med komplett asset-data for alle 11 leverandorer
- Hvert objekt inkluderer `metadata: { is_demo_profile: true }` for enkel identifisering/sletting
- Dokumenter genereres med `valid_from` og `valid_to` basert pa dokumenttype
- `seedDemoVendorProfiles()`:
  1. Sjekker om demo-profiler allerede finnes (via metadata-flagg)
  2. Inserter assets med `asset_type: "vendor"`
  3. Inserter tilhorende `vendor_documents` for hver leverandor
  4. Returnerer antall opprettet
- `deleteDemoVendorProfiles()`:
  1. Henter alle assets med `metadata->is_demo_profile = true`
  2. Sletter tilhorende `vendor_documents`, `lara_inbox`, `asset_relationships`
  3. Sletter asset-radene
  4. Returnerer antall slettet

### `src/pages/Assets.tsx`
- Ny "Demo-data" dropdown-knapp i headeren med to valg:
  - "Last inn demo-leverandorer" -- kaller seed-funksjonen
  - "Fjern demo-leverandorer" -- kaller delete-funksjonen
- Begge invaliderer `["assets"]` query etter fullfort operasjon
- Toast-meldinger bekrefter handling

### Eksempel pa en leverandorprofil (Vipps):
```text
name: "Vipps MobilePay AS"
org_number: "918713867"
country: "NO"
region: "Europa"
vendor: "Vipps MobilePay AS"
vendor_category: "saas"
gdpr_role: "databehandler"
compliance_score: 96
risk_score: 8
risk_level: "low"
criticality: "high"
publish_mode: "public"
contact_person: "Compliance Team"
contact_email: "compliance@vippsmobilepay.no"
metadata: { is_demo_profile: true, certifications: ["PCI DSS", "ISO 27001", "SOC 2 Type II"] }
description: "Norges ledende betalingslosning..."

Dokumenter:
- DPA (gyldig, +2 ar)
- ISO 27001 (gyldig, +3 ar)
- SOC 2 Type II (gyldig, +1 ar)
- PCI DSS (gyldig, +1 ar)
```

