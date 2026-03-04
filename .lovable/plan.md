

## Plan: Dummy-data for Enheter + ISO 27001-tilpasset Trust Profile for hardware

### Del 1: Seed 8 demo-enheter

Opprette en `seedDemoDevices()` og `deleteDemoDevices()` funksjon i en ny fil `src/lib/demoDeviceProfiles.ts`, etter samme mønster som `demoVendorProfiles.ts`.

**Demo-enheter:**

| Enhet | Type | OS | Status | Risiko | Metadata |
|-------|------|----|--------|--------|----------|
| DESK-FIN-01 | workstation | Windows 11 Pro | protected | low | Kryptering: BitLocker, Antivirus: aktiv |
| DESK-HR-02 | workstation | Windows 11 Pro | warning | medium | Kryptering: BitLocker, Antivirus: utgått |
| LAPTOP-DEV-03 | workstation | macOS Sonoma | protected | low | Kryptering: FileVault, MDM: aktiv |
| LAPTOP-SALG-04 | workstation | Windows 11 Home | critical | high | Kryptering: ingen, Antivirus: mangler |
| SRV-DC-01 | server | Windows Server 2022 | protected | medium | Plassering: Serverrom A, Backup: daglig |
| SRV-APP-02 | server | Ubuntu 24.04 LTS | warning | medium | Plassering: Azure, Patching: 45 dager siden |
| MOB-CEO-01 | mobile | iOS 18 | protected | low | MDM: aktiv, Kryptering: standard |
| NAS-ARKIV-01 | nas | Synology DSM 7.2 | warning | high | RAID: 5, Kryptering: nei, Backup: ukentlig |

Hver enhet lagres i `assets`-tabellen med `asset_type: "hardware"` og `metadata: { is_demo_device: true, device_type, os, hostname, status, encryption, antivirus, mdm, location, backup, ... }`.

### Del 2: Koble seed/slett til Assets-siden

Utvide Demo-data-dropdown i `Assets.tsx` med to nye menypunkter: "Last inn demo-enheter" og "Fjern demo-enheter".

### Del 3: ISO 27001-tilpasset Trust Profile for hardware

Basert på ISO 27001:2022 Annex A kontrollene som er relevante for fysiske eiendeler (A.7 Physical security, A.8 Asset management), tilpasse fanestrukturen i `AssetTrustProfile.tsx` for `asset_type === "hardware"`:

**Relevante ISO 27001-kontroller for enheter:**
- **A.8.1** Brukerens endepunktenheter — policy, kryptering, MDM
- **A.7.9** Sikkerhet for eiendeler utenfor virksomheten
- **A.7.10** Lagringsmedier — kryptering, sletting
- **A.7.13** Vedlikehold av utstyr
- **A.7.14** Sikker avhending/gjenbruk
- **A.8.7** Beskyttelse mot skadevare (antivirus)
- **A.8.8** Håndtering av tekniske sårbarheter (patching)
- **A.8.9** Konfigurasjonsstyring
- **A.8.32** Endringsstyring

**Ny fane-spesifikk visning for hardware-profilen:**

I stedet for den generelle ValidationTab (som viser GDPR/NIS2/CRA/AIAACT), lage en ny `DeviceComplianceTab` som viser en ISO 27001-sjekkliste med disse kontrollpunktene:

| Kontrollpunkt | Kilde | Feltnavn i metadata |
|---------------|-------|---------------------|
| Diskkryptering aktivert | A.8.1, A.7.10 | `encryption` |
| MDM/endpoint management | A.8.1 | `mdm` |
| Antivirus/EDR aktiv | A.8.7 | `antivirus` |
| OS oppdatert (patch < 30 dager) | A.8.8 | `last_patch_date` |
| Backup konfigurert | A.8.13 | `backup` |
| Fysisk plassering dokumentert | A.7.9 | `location` |
| Ansvarlig person tilordnet | A.8.1 | `asset_manager` |
| Livssyklusstatus definert | A.7.14 | `lifecycle_status` |

**Ny komponent:** `src/components/devices/DeviceComplianceTab.tsx`
- Viser ISO 27001-sjekklisten basert på enhetens metadata
- Beregner compliance-score dynamisk (grønn/gul/rød)
- Viser anbefalinger for manglende kontroller

**Endring i `AssetTrustProfile.tsx`:**
- Når `asset_type === "hardware"`: vis `DeviceComplianceTab` som første fane i stedet for standard ValidationTab
- Begrens faner til: Compliance, Risiko, Hendelser, Dokumenter

### Filer

| Fil | Endring |
|-----|---------|
| `src/lib/demoDeviceProfiles.ts` | Ny — seed/slett-funksjoner for 8 demo-enheter |
| `src/components/devices/DeviceComplianceTab.tsx` | Ny — ISO 27001-sjekkliste for hardware |
| `src/pages/Assets.tsx` | Legg til seed/slett enheter i demo-dropdown |
| `src/pages/AssetTrustProfile.tsx` | Tilpass fanestruktur for hardware-eiendeler |

