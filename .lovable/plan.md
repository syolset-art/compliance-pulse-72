

## Plan: Koble sikkerhetstjenester til Acronis-løsninger med aktiveringsflyt

### Konsept
Utvide hver sikkerhetstjenestekategori med konkrete **Acronis Cyber Protect Cloud-moduler** (pakker) som kunden kan aktivere direkte fra Trust Profile-visningen. Kunden ser hvilke Acronis-tjenester som er tilgjengelige per kategori, kan velge å aktivere dem selv, eller be MSP-partneren om hjelp.

### Endringer

#### 1. Utvide `src/lib/securityServiceCatalog.ts`
- Legg til ny `acronisModules[]` per kategori med konkrete Acronis-pakker:
  - **Backup**: `Advanced Backup`, `Disaster Recovery`
  - **Endpoint**: `Advanced Security + EDR`, `Advanced Management`
  - **Email**: `Advanced Email Security` (Perception Point)
  - **Network**: `Advanced Monitoring` (via Acronis)
  - **Awareness**: `Security Awareness Training` (Acronis-modul)
  - **SOC**: `MDR Service`, `XDR` (Acronis-partnertilbud)
  - **Compliance**: `Data Loss Prevention`, `Advanced File Sync & Share`
- Hver modul har: `id`, `name`, `acronisPackage`, `priceIndicator` (inkludert/tillegg), `description`, `isActive` (demo-flagg)

#### 2. Oppdater `SecurityServicesSection.tsx` — ny "Acronis-løsninger"-seksjon per tjenestekort
- Innenfor expanded-visningen: ny seksjon **"Tilgjengelige Acronis-løsninger"**
- Hver modul vises som kort med:
  - Navn + Acronis-pakkenavn
  - Status: "Aktiv" (grønn) / "Tilgjengelig" (blå) / "Ikke inkludert" (grå)
  - **"Aktiver"**-knapp som åpner en bekreftelsesdialog
  - **"Be MSP om hjelp"**-knapp for de som ikke vil gjøre det selv
- Aktivering oppdaterer lokal state (demo) og viser suksess-toast

#### 3. Ny komponent: `src/components/asset-profile/tabs/ActivateAcronisServiceDialog.tsx`
- Bekreftelses-dialog med:
  - Hvilken tjeneste og Acronis-modul som aktiveres
  - ISO-kontroller som dekkes
  - Estimert oppsett-tid
  - To valg: "Aktiver selv" (demo) eller "Send forespørsel til MSP"
  - Ved aktivering: oppdater katalogen lokalt, vis konfetti/suksess

#### 4. Oppdater demo-logikk i `evaluateServiceCoverage`
- Tjenester med aktive Acronis-moduler markeres automatisk som "covered"

### Filer som endres/opprettes

| Fil | Endring |
|---|---|
| `src/lib/securityServiceCatalog.ts` | Legg til `acronisModules[]` per kategori |
| `src/components/asset-profile/tabs/SecurityServicesSection.tsx` | Vis Acronis-moduler i expanded, aktiveringsknapper |
| `src/components/asset-profile/tabs/ActivateAcronisServiceDialog.tsx` | Ny — bekreftelsesdialog for aktivering |

