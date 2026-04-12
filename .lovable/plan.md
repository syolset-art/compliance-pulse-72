

## Plan: Erstatt Trust Score i header med risiko/kritikalitet/modenhet — flytt Trust Score til Veiledning fra Mynder

### Hva endres

Når en leverandør eller et system er "tatt i bruk" (status active/in_use), skal headeren **ikke** vise den sirkulære Trust Score-gaugen. I stedet vises tre kompakte indikatorer: **Risikonivå**, **Kritikalitet** og **Modenhet** (basert på organisasjonens eget arbeid). Leverandørens Trust Score flyttes til "Veiledning fra Mynder"-fanen som en del av veiledningsinformasjonen.

### Visuelt konsept — header

```text
┌──────────────────────────────────────────────────────────┐
│ [ikon] System X  │ Aktiv │ Kategori                     │
│                  │       │                               │
│                  │  ┌──────────────────────────────────┐ │
│                  │  │ Risiko: Middels  ● (gul)         │ │
│                  │  │ Kritikalitet: Høy ● (oransje)    │ │
│                  │  │ Modenhet: 72%    ████░░░          │ │
│                  │  └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Visuelt konsept — Veiledning fra Mynder

```text
┌─ Leverandørens Trust Score ──────────────────────────────┐
│  [SVG-gauge 72/100]  Trust Score                         │
│  Høy tillit  •  Sist oppdatert: 2026-03-15              │
│  Egenerklæring                                           │
│                                                          │
│  "Denne scoren reflekterer leverandørens baseline        │
│   basert på tilgjengelig dokumentasjon og kontroller"    │
└──────────────────────────────────────────────────────────┘
│                                                          │
│  Modenhet per kontrollområde ... (eksisterende panel)    │
```

### Teknisk implementering

**Fil 1: `src/components/system-profile/SystemHeader.tsx`**
- Erstatt Trust Score-gaugen (linje 200–256) med en kompakt vertikal liste med tre indikatorer:
  - Risikonivå (fra system data, fargekodede badges: rød/gul/grønn)
  - Kritikalitet (fra asset/system data)
  - Modenhet (minibar med prosent, beregnet fra trustMetrics)
- Beholder `trustMetrics`-propen for å beregne modenhet, men viser ikke Trust Score-tallet

**Fil 2: `src/components/asset-profile/AssetHeader.tsx`**
- Samme endring som SystemHeader: erstatt Trust Score-gauge med risiko/kritikalitet/modenhet
- Gjelder kun for leverandør-profiler som er "tatt i bruk" (ikke self-profiler)
- Self-profiler beholder eksisterende visning

**Fil 3: `src/components/system-profile/tabs/ValidationTab.tsx`**
- Legg til en ny `Card` øverst med leverandørens Trust Score-gauge (flyttet fra header)
- Inkluder forklaringstekst som kontekstualiserer scoren
- Vis confidence-level og sist oppdatert-dato
- Plasseres før det eksisterende TrustControlsPanel

**Fil 4: `src/components/asset-profile/tabs/VendorOverviewTab.tsx`** (eller tilsvarende)
- Samme endring: legg til Trust Score-kort øverst i "Veiledning fra Mynder"-fanen for leverandører

**Fil 5: `src/components/device-profile/DeviceHeader.tsx`**
- Samme mønster: erstatt Trust Score-gauge med risiko/kritikalitet/modenhet-indikatorer

### Logikk for visning
- Header viser Trust Score **kun** for self-profiler (organisasjonens egen profil)
- For alle leverandører/systemer som er "tatt i bruk": header viser risiko + kritikalitet + modenhet
- Trust Score flyttes til Veiledning-fanen med kontekst om at dette er leverandørens baseline-score

