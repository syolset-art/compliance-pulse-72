

# Leverandør-sammenligning: Compliance-modenhet

## Bakgrunn
Organisasjoner som Helse Vest IKT har mange leverandorer og trenger a sammenligne dem side-ved-side pa compliance-modenhet for a prioritere oppfolging, identifisere svake ledd, og dokumentere forsvarlig leverandorstyring.

## Losning: Ny "Sammenlign"-fane i leverandoroversikten

### Brukerflyt

1. Brukeren gar til Leverandorer-siden og velger den nye fanen **"Sammenlign"**
2. Brukeren velger 2-5 leverandorer fra en soksbar liste med avkrysningsbokser
3. Sammenligningsvisningen viser:
   - **Sammenstillingstabell** med rad per dimensjon (overall score, sikkerhet, datahandtering, personvern, tilgjengelighet, risikoniva, DPA-status, GDPR-rolle)
   - **Radarkart** (Spider chart) som overlegger alle valgte leverandorer i ett diagram
   - **Fargekodede celler** (gront/gult/rodt) for rask visuell scanning
   - **Eksporter til PDF/Excel**-knapp for rapportering

### Datadimensjoner som sammenlignes

| Dimensjon | Kilde |
|-----------|-------|
| Samlet compliance-score | `assets.compliance_score` |
| Risikoniva | `assets.risk_level` |
| GDPR-rolle | `assets.gdpr_role` |
| Leverandorkategori | `assets.vendor_category` |
| Land/region | `assets.country` |
| DPA-status | Utledet fra `vendor_documents` |
| Sikkerhet-score | `vendor_analyses.category_scores.security` |
| Datahandtering-score | `vendor_analyses.category_scores.data_handling` |
| Personvern-score | `vendor_analyses.category_scores.privacy` |
| Tilgjengelighet-score | `vendor_analyses.category_scores.availability` |
| AI-analyse totalscore | `vendor_analyses.overall_score` |
| Utdaterte dokumenter | Telt fra `vendor_documents` |

### Teknisk implementasjon

**Nye filer:**
- `src/components/vendor-dashboard/VendorCompareTab.tsx` -- Hovedkomponent med velger + visning
- `src/components/vendor-dashboard/CompareRadarChart.tsx` -- Radarkart med flere leverandorer
- `src/components/vendor-dashboard/CompareTable.tsx` -- Tabell med fargekodede celler

**Endrede filer:**
- `src/pages/Assets.tsx` -- Legg til "Sammenlign"-fane i TabsList
- `src/locales/nb.json` / `src/locales/en.json` -- Oversettelsesnokkler

**Hovedlogikk:**
1. Brukeren velger leverandorer via checkbokser i en `ScrollArea`-liste med sok
2. For valgte leverandorer hentes `vendor_analyses` (siste per asset) via en `useQuery`
3. Data flates ut til en matrise og rendres som tabell + radarkart
4. Radarkart bruker `recharts` (allerede installert) med en `Radar` per leverandor
5. Eksport bruker `jspdf` + `jspdf-autotable` (allerede installert) eller `xlsx` for Excel

**Ingen databaseendringer nodvendig** -- all data finnes allerede i `assets` + `vendor_analyses` + `vendor_documents`.

### UI-skisse

```text
+-----------------------------------------------------------+
| Leverandorer                                               |
| [Oversikt] [Alle] [Kart] [Forsyningskjede] [Sammenlign]  |
+-----------------------------------------------------------+
| Velg leverandorer (2-5):                                   |
| [Sok...]                                                   |
| [x] Microsoft Azure    72%                                 |
| [x] Visma              85%                                 |
| [x] TietoEvry          61%                                 |
| [ ] Basefarm           44%                                 |
+-----------------------------------------------------------+
| Radarkart                          | Samlet   |           |
|    Sikkerhet                       | Azure 72 |           |
|   /        \                       | Visma 85 |           |
| Tilgj.   Datah.                    | Tieto 61 |           |
|   \        /                       |          |           |
|    Personvern                      |          |           |
+-----------------------------------------------------------+
| Dimensjon       | Azure | Visma | TietoEvry |             |
| Compliance      |  72%  |  85%  |    61%    |             |
| Sikkerhet       |  80   |  90   |    55     |             |
| Datahandtering  |  65   |  82   |    70     |             |
| Personvern      |  70   |  88   |    58     |             |
| Tilgjengelighet |  75   |  80   |    62     |             |
| Risiko          | Med.  |  Lav  |   Hoy     |             |
| DPA             |  Ja   |  Ja   |   Nei     |             |
| GDPR-rolle      | Datab.| Datab.| Under-db  |             |
+-----------------------------------------------------------+
| [Eksporter PDF]  [Eksporter Excel]                        |
+-----------------------------------------------------------+
```

### Implementasjonsrekkefolge
1. Opprett `VendorCompareTab` med leverandorvelger
2. Opprett `CompareTable` med fargekodede celler
3. Opprett `CompareRadarChart` med multi-leverandor overlay
4. Integrer i `Assets.tsx` som ny fane
5. Legg til PDF/Excel-eksport
6. Legg til oversettelser

