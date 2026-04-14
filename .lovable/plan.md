

## Plan: Demo-knapp med dummy-data for Dokumentasjon & Evidens

### Oversikt
Legger til en subtil «Fyll demo-data»-knapp ved siden av «Legg til»-knappen. Knappen seeder vendor_documents-tabellen med realistiske norske retningslinjer, sertifiseringer og dokumenter knyttet til self-asseten.

### Dummy-data som seedeS

**Retningslinjer (6 stk):**
- Personvernpolicy (verified, published)
- Informasjonssikkerhetspolicy (verified, published)
- Akseptabel bruk-policy (verified, visible)
- Hendelseshåndteringsplan (draft, hidden)
- Databeskyttelsespolicy (verified, published)
- Generell IT-policy (pending, visible)

**Sertifiseringer (3 stk):**
- ISO 27001:2022 (verified, expiry +300 dager)
- SOC 2 Type II (verified, expiry +180 dager)
- Cyber Essentials Plus (expiring, expiry +20 dager)

**Dokumenter (4 stk):**
- Databehandleravtale (agreement, verified)
- Risikovurderingsrapport Q1 (report, verified)
- Penetrasjonstestrapport (evidence, pending)
- Beredskapsplan (other, draft)

### Filer som endres

| Fil | Endring |
|-----|---------|
| `src/pages/TrustCenterEvidence.tsx` | Legg til seed-funksjon og subtil «Demo»-knapp (ghost variant, liten størrelse, Database-ikon) ved siden av «Legg til» |

### UI-detaljer
- Knappen bruker `variant="ghost" size="sm"` med et `Database`-ikon og teksten «Demo» / «Demo data»
- Ved klikk: sjekker om det allerede finnes data, seeder, og invaliderer queryen
- Viser toast ved suksess

