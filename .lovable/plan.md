

## Plan: Legg til dedikert MDR-kategori (Managed Detection & Response)

### Endring

Legge til en ny sikkerhetstjenestekategori **"MDR – Managed Detection & Response"** i `securityServiceCatalog.ts`, inspirert av 7 Security sin beskrivelse. Denne skilles fra den eksisterende SOC-kategorien for å gi MDR en tydelig, egen plass.

### Endringer i `src/lib/securityServiceCatalog.ts`

Ny kategori i `SECURITY_SERVICE_CATALOG`:

| Felt | Verdi |
|---|---|
| `id` | `"mdr"` |
| `name` | `"MDR – Managed Detection & Response"` |
| `description` | Kort norsk tekst basert på 7 Security: "Døgnkontinuerlig overvåking, analyse og håndtering av sikkerhetstrusler — teknologi møter ansvar" |
| `icon` | `ShieldAlert` (eller `ScanEye` fra lucide) |
| `color` | `bg-rose-600` (distinkt fra SOC sin `bg-red-500`) |
| `linkedControls` | `["A.5.24", "A.5.25", "A.5.26", "A.8.15", "A.8.16"]` |
| `mspRecommendation` | Tekst om at MDR gir proaktiv trusselhåndtering 24/7, ikke bare varsler |
| `mspProducts` | `7 Security MDR` (7 Security), `Arctic Wolf MDR` (flyttes fra SOC) |
| `acronisModules` | `MDR Service` og `XDR` (flyttes fra SOC-kategorien) |
| `implementationSteps` | 5 steg for MDR-onboarding |

Oppdatere **SOC-kategorien** til å fokusere på SIEM/logging og fjerne MDR/XDR-modulene som flyttes til ny kategori.

Legg også `"mdr"` til `DEMO_IMPLEMENTED_SERVICES` slik at den vises som "Implementert" i demo-modus.

### Filer som endres

| Fil | Endring |
|---|---|
| `src/lib/securityServiceCatalog.ts` | Ny MDR-kategori, flytt MDR/XDR-moduler fra SOC |

