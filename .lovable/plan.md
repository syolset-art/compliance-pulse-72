
# Plan: Gjøre Risikobilde og Tildelte kontroller mer intuitive

## Problemanalyse

De to widgetene "Risikobilde" og "Tildelte kontroller" er i dag for abstrakte og generelle. De viser kun:
- **Risikobilde**: Fire risikonivåer (Kritisk, Høy, Medium, Lav) uten kontekst om *hvor* risikoene befinner seg
- **Tildelte kontroller**: Enkle tall for tildelt/ikke tildelt uten innsikt i *hva* som er tildelt

Brukeren får ikke umiddelbart forståelse for hvordan dette relaterer seg til Mynders tre kontrollområder og SLA-kategorier.

## Løsning

Redesigne begge widgetene til å vise en **matrise-visning** som kombinerer:
- **X-akse (Kontrollområder)**: Personvern, Informasjonssikkerhet, AI Governance
- **Y-akse (SLA-kategorier)**: Systemer og prosesser, Organisasjon og styring, Roller og tilganger

### 1. Nytt design for Risikobilde-widget

**Navn**: "Risikobilde per kontrollområde"

**Visuell struktur**:
```text
┌──────────────────────────────────────────────────────────────────┐
│  📊 Risikobilde                                                   │
│  Fordeling av risikoer på tvers av kontrollområder               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┬────────────────┬──────────────────┐           │
│  │ 🛡️ Personvern │ 🔒 Infosikkerhet│ 🤖 AI Governance │           │
│  ├───────────────┼────────────────┼──────────────────┤           │
│  │ 🔴 2  🟠 1    │ 🔴 1  🟠 3     │ 🔴 0  🟠 1      │           │
│  │ 🟡 4  🟢 8    │ 🟡 5  🟢 4     │ 🟡 4  🟢 3      │           │
│  └───────────────┴────────────────┴──────────────────┘           │
│                                                                   │
│  Totalt: 36 risikoer  ↘ 4 færre kritiske vs forrige måned        │
└──────────────────────────────────────────────────────────────────┘
```

**Forbedringer**:
- Viser risikofordeling *per kontrollområde*
- Bruker ikoner som matcher resten av plattformen (Shield, Lock, Brain)
- Klikk på et kontrollområde kan ekspandere for å vise SLA-kategori-nedbrytning

### 2. Nytt design for Tildelte kontroller-widget

**Navn**: "Kontrollstatus per SLA-kategori"

**Visuell struktur**:
```text
┌──────────────────────────────────────────────────────────────────┐
│  ✓ Kontrollstatus                        vs. forrige måned       │
│  Hvem har ansvar for hva?                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Systemer og prosesser     ██████████░░  85%  (34/40)  ↗+3      │
│  Organisasjon og styring   ████████░░░░  67%  (24/36)  ↗+5      │
│  Roller og tilganger       ███████████░  92%  (22/24)  ↘-1      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Totalt: 80 av 100 kontroller tildelt                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Forbedringer**:
- Viser tildelingsstatus per SLA-kategori (samme struktur som SLAWidget)
- Prosentandel og absolutte tall
- Trendindikator vs forrige måned
- Fargekodet progressbar (grønn > 80%, gul > 50%, rød < 50%)

## Teknisk implementering

### Filer som endres

| Fil | Endring |
|-----|---------|
| `src/components/widgets/InherentRiskWidget.tsx` | Fullstendig redesign med kontrollområde-inndeling |
| `src/components/widgets/ControlsWidget.tsx` | Redesign til SLA-kategori basert visning |
| `src/locales/nb.json` | Nye oversettelser for widget-tekster |
| `src/locales/en.json` | Engelske oversettelser |

### Datastruktur for InherentRiskWidget

```typescript
interface DomainRisk {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  risks: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  previousTotal: number;
}
```

### Datastruktur for ControlsWidget

```typescript
interface SLACategory {
  id: string;
  name: string;
  assigned: number;
  total: number;
  previousAssigned: number;
}
```

## Brukeropplevelse

**Før**: Brukeren ser abstrakte tall uten kontekst
**Etter**: Brukeren forstår umiddelbart:
- *Hvor* risikoene er (hvilket kontrollområde)
- *Hva* som mangler tildeling (hvilken SLA-kategori)
- Sammenheng mellom widgetene og Mynders fokusområder

## Ekstra forbedring: Tooltip med forklaring

Legger til informative tooltips på begge widgetene som forklarer:
- **Risikobilde**: "Viser identifiserte risikoer fordelt på kontrollområder. Risikoer vurderes fra systemer, prosesser og AI-bruk."
- **Kontrollstatus**: "Viser hvor mange sikkerhetskontroller som har en ansvarlig person tildelt, fordelt på SLA-kategorier."
