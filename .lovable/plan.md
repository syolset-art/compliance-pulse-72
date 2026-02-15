

# Leverandorkategorisering - Forbedret typeinndeling

## Problemet i dag
Alle leverandorer lagres med `asset_type: "vendor"` uten underkategorisering. Microsoft 365, en renholdsleverandor og en advokatfirma vises pa samme mate. Det mangler ogsa skille mellom "system" (systemoversikt) og "vendor" (leverandoroversikt), selv om dette i praksis overlapper.

## Hva rammeverk og konkurrenter gjor

### ISO 27001 (Annex A 5.19)
Krever klassifisering av leverandorer etter:
- **Tilgangstype**: Tilgang til data, systemer, fysisk tilgang, eller ingen direkte tilgang
- **Kritikalitet**: Kritisk / Viktig / Standard
- **Tjenesteomrade**: IT, Kontor, Radgivning, osv.

### GDPR (Art. 28/30)
Krever dokumentasjon av:
- **Rolle**: Databehandler / Underdatabehandler / Felles behandlingsansvarlig
- **Overforingsgrunnlag**: EU/EOS, Adequacy, SCC, BCR

### Openli (dansk konkurrent)
- Leverandorer tagges som **Subprocessor** (ja/nei toggle)
- Filtrering pa **Properties** (egendefinerte tags), **DPA-status**, **Business Owner**
- Enkel, flat liste med smarte filtre - ikke komplekse kategorier

### RISMA Systems (dansk konkurrent)
- Fokus pa **kontraktstyring** koblet til leverandorer
- Risikoklassifisering og compliance-scoring per leverandor
- Kategorisering etter tjenesteomrade

## Forslag: To-dimensjonal kategorisering

### Dimensjon 1: Leverandortype (hva de leverer)
| Type | Beskrivelse | Eksempel |
|------|-------------|----------|
| SaaS / Skytjeneste | Software-as-a-Service | Microsoft 365, Slack, HubSpot |
| Infrastruktur / IaaS | Hosting, sky-infrastruktur | AWS, Azure, Hetzner |
| Radgivning | Konsulenter, advokater, revisorer | PwC, Deloitte |
| IT-drift | Driftspartner, managed services | Atea, Basefarm |
| Kontor og fasiliteter | Renhold, kantine, kontorrekvisita | ISS, Sodexo |
| Annet | Alt som ikke passer over | - |

### Dimensjon 2: GDPR-rolle (hvordan de behandler data)
| Rolle | Beskrivelse |
|-------|-------------|
| Databehandler | Behandler personopplysninger pa vegne av dere (krever DPA) |
| Underdatabehandler | Brukes av en av deres databehandlere |
| Ingen persondata | Ingen tilgang til personopplysninger |

## Teknisk implementasjon

### 1. Databaseendring
Legg til to nye kolonner pa `assets`-tabellen:
- `vendor_category` (text, nullable) - SaaS, Infrastruktur, Radgivning, IT-drift, Kontor, Annet
- `gdpr_role` (text, nullable) - databehandler, underdatabehandler, ingen

### 2. AddVendorDialog - nytt steg
Etter sokeresultat-valg, for kontaktinfo-steget, legg til et kort steg:
- **Leverandortype**: 6 knapper med ikoner (som land-velgeren i dag)
- **GDPR-rolle**: 3 radioknapper med korte forklaringer

### 3. VendorListTab - filtrering
Legg til to nye filter-dropdowns i verktoylinjen:
- **Type**: SaaS, Infrastruktur, Radgivning, osv.
- **GDPR-rolle**: Databehandler, Underdatabehandler, Ingen

Vis type og GDPR-rolle som badges pa VendorCard og i listevisningen.

### 4. VendorOverviewTab - gruppering
Vis en liten oversikt over fordelingen per type (f.eks. "12 SaaS, 3 Infrastruktur, 2 Radgivning") som klikkbare badges som filtrerer listen.

### Endrede filer
- `src/pages/Assets.tsx` - Minimale endringer (props)
- `src/components/dialogs/AddVendorDialog.tsx` - Nytt steg for type/rolle
- `src/components/vendor-dashboard/VendorListTab.tsx` - Nye filter-dropdowns + badges
- `src/components/vendor-dashboard/VendorCard.tsx` - Vis type/rolle-badges
- `src/components/vendor-dashboard/VendorOverviewTab.tsx` - Fordelingsoversikt
- Database-migrasjon for nye kolonner

### Forholdet mellom Systemer og Leverandorer
Systemoversikten (`/systems`) og leverandoroversikten (`/assets`) forblir separate sider, men SaaS-leverandorer kan kobles til systemer via eksisterende `asset_relationships`-tabellen. Dette er allerede stottet i koden.

