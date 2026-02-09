

# Plan: PECB-Aligned ISO Readiness Journey

## Analyse av PECB-rammeverket

Basert på PECB (Professional Evaluation and Certification Board) sertifiseringsmetodikk, er reisen mot ISO-sertifisering strukturert i klare faser som følger PDCA-syklusen (Plan-Do-Check-Act).

### PECBs kompetansenivåer for hver standard:
| Nivå | Beskrivelse | Fokusområde |
|------|-------------|-------------|
| **Foundation** | Grunnleggende forståelse | Terminologi, konsepter, struktur |
| **Lead Implementer** | Implementering | Etablering og drift av styringssystem |
| **Lead Auditor** | Revisjon | Intern/ekstern audit og sertifisering |

### ISO-standarder per kontrollområde:
| Kontrollområde | Primærstandard | Støttestandarder |
|----------------|----------------|------------------|
| **Personvern** | ISO 27701 (PIMS) | GDPR 2016/679 |
| **Informasjonssikkerhet** | ISO 27001 (ISMS) | ISO 27002, NSM |
| **AI Governance** | ISO 42001 (AIMS) | EU AI Act 2024 |

---

## Foreslått informasjonsarkitektur

### 1. Sertifiseringsreisen (0 → Sertifisering)

Strukturert i 5 hovedfaser basert på PECB-metodikk:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  FASE 1          FASE 2          FASE 3          FASE 4          FASE 5    │
│  Fundament       Implementering  Drift           Intern Audit    Sertif.   │
│  ────────────    ──────────────  ──────────────  ──────────────  ──────    │
│  ▪ Kontekst      ▪ Policies      ▪ Kontroller    ▪ Internrevisjon ▪ Stage 1│
│  ▪ Scope         ▪ Risikovurd.   ▪ Dokumentasjon ▪ Mgmt Review    ▪ Stage 2│
│  ▪ Gap-analyse   ▪ Behandling    ▪ Awareness     ▪ Korrigering    ▪ Vedlik.│
│  ▪ Roller        ▪ Mål           ▪ Overvåking    ▪ Forbedring            │
│                                                                             │
│  [0-15%]         [15-40%]        [40-70%]        [70-90%]        [90-100%] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. SLA-kategorier (som i brukerens bilde)

Tre hovedkategorier for hver standard, basert på ISO Annex A struktur:

| SLA-kategori | Beskrivelse | Eksempel-kontroller |
|--------------|-------------|---------------------|
| **Systemer og prosesser** | Tekniske og prosessuelle kontroller | Tilgangskontroll, kryptering, logging |
| **Organisasjon og styring** | Styringsrammeverk og ledelse | Policies, roller, risikostyring |
| **Roller og tilgang** | Personellsikkerhet og identitet | IAM, opplæring, ansvar |

### 3. Modenhetsmodell (PECB-aligned)

5 nivåer som mapper til sertifiseringsreisen:

| Modenhetsnivå | Beskrivelse | Fase | Score |
|---------------|-------------|------|-------|
| **1 - Initial** | Ad-hoc, ingen formell struktur | Pre-fundament | 0-15% |
| **2 - Definert** | Dokumenterte policyer, grunnlag etablert | Fundament | 15-35% |
| **3 - Implementert** | Kontroller på plass og fungerer | Implementering | 35-60% |
| **4 - Målt** | KPIer, overvåking, intern audit | Drift + Audit | 60-85% |
| **5 - Optimalisert** | Kontinuerlig forbedring, sertifiseringsklare | Sertifisering | 85-100% |

---

## Ny komponentstruktur

### Hovedkomponenter

```text
src/components/iso-readiness/
├── CertificationJourney.tsx      # Horisontalt steg-visualisering
├── DomainProgressCard.tsx        # Oppdatert med SLA-kategorier  
├── MaturityGauge.tsx             # Sirkulær modenhetsmåler
├── PhaseDetailView.tsx           # Detaljer per fase
├── SLACategoryBreakdown.tsx      # Basert på SLAWidget-design
└── RequirementChecklist.tsx      # Interaktiv sjekkliste
```

### Nytt visuelt design

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ISO Readiness – Sertifiseringsreisen                                       │
│  Din vei mot ISO-sertifisering                                              │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [●] Fundament  ─── [◐] Implementering ─── [○] Drift ─── [○] Audit    │  │
│  │      ✓ 100%            45%                  0%             0%        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 🛡️ Personvern    │ │ 🔒 Info.sikkerhet│ │ 🤖 AI Governance │            │
│  │ ISO 27701        │ │ ISO 27001        │ │ ISO 42001        │            │
│  │ + GDPR           │ │ + NSM            │ │ + EU AI Act      │            │
│  │                  │ │                  │ │                  │            │
│  │ ████████░░ 72%   │ │ ██████░░░░ 45%   │ │ ███░░░░░░░ 28%   │            │
│  │ Nivå: Implementert│ │ Nivå: Definert  │ │ Nivå: Initial    │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─ PERSONVERN – ISO 27701 + GDPR ─────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  SLA-oppnåelse per kategori                 [Siste kvartal ▼]       │   │
│  │                                                                      │   │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐           │   │
│  │  │ Systemer og    │ │ Organisasjon   │ │ Roller og      │           │   │
│  │  │ prosesser      │ │ og styring     │ │ tilgang        │           │   │
│  │  │                │ │                │ │                │           │   │
│  │  │ 68% ████████░░ │ │ 37% █████░░░░░ │ │ 81% █████████░ │           │   │
│  │  │ 8/12 oppfylt   │ │ 3/8 oppfylt    │ │ 5/6 oppfylt    │           │   │
│  │  │ ↗ +23%         │ │ ↘ -15%         │ │ ↘ -5%          │           │   │
│  │  └────────────────┘ └────────────────┘ └────────────────┘           │   │
│  │                                                                      │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                      │   │
│  │  📋 Krav per fase                                                   │   │
│  │                                                                      │   │
│  │  [▼ Fase 1: Fundament] ────────────────────────── ✓ Fullført (4/4)  │   │
│  │    [✓] Art 30 – Behandlingsprotokoll                                │   │
│  │    [✓] Art 6 – Behandlingsgrunnlag dokumentert                      │   │
│  │    [✓] Art 7 – Samtykkerutiner                                      │   │
│  │    [✓] Art 37 – DPO utnevnt                                         │   │
│  │                                                                      │   │
│  │  [▼ Fase 2: Implementering] ───────────────────── 🔄 Pågår (2/6)   │   │
│  │    [✓] Art 32 – Sikkerhetstiltak                                    │   │
│  │    [✓] Art 25 – Privacy by Design                                   │   │
│  │    [ ] Art 35 – DPIA for høyrisiko-behandlinger                     │   │
│  │    [ ] Art 28 – Databehandleravtaler                                │   │
│  │    [ ] Art 5 – Prinsipper dokumentert                               │   │
│  │    [ ] Art 12-14 – Personvernerklæringer                            │   │
│  │                                                                      │   │
│  │  [▶ Fase 3: Drift] ────────────────────────────── ○ Ikke startet   │   │
│  │  [▶ Fase 4: Intern Audit] ─────────────────────── ○ Ikke startet   │   │
│  │  [▶ Fase 5: Sertifisering] ────────────────────── ○ Ikke startet   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Datamodell-utvidelser

### Ny fase-mapping i `complianceRequirementsData.ts`

Legge til `certification_phase` felt på hvert krav:

```typescript
export type CertificationPhase = 
  | 'foundation'      // Fase 1: Kontekst, scope, gap-analyse
  | 'implementation'  // Fase 2: Policies, risikovurdering, behandling
  | 'operation'       // Fase 3: Drift, overvåking, awareness
  | 'audit'           // Fase 4: Intern audit, management review
  | 'certification';  // Fase 5: Stage 1, Stage 2, vedlikehold

interface ComplianceRequirement {
  // ...eksisterende felt...
  certification_phase: CertificationPhase;
  sla_category: 'systems_processes' | 'organization_governance' | 'roles_access';
}
```

### Fasedefinisjoner

```typescript
export const CERTIFICATION_PHASES = [
  {
    id: 'foundation',
    name_no: 'Fundament',
    name_en: 'Foundation',
    description_no: 'Etabler kontekst, scope og gap-analyse',
    description_en: 'Establish context, scope and gap analysis',
    percentageRange: [0, 15],
    activities: ['Kontekstanalyse', 'Scope-definisjon', 'Gap-analyse', 'Rollefordeling']
  },
  {
    id: 'implementation',
    name_no: 'Implementering',
    name_en: 'Implementation',
    description_no: 'Utvikle policies, risikovurdering og kontrolltiltak',
    description_en: 'Develop policies, risk assessment and control measures',
    percentageRange: [15, 40],
    activities: ['Policy-utvikling', 'Risikovurdering', 'Risikobehandling', 'Målsetting']
  },
  {
    id: 'operation',
    name_no: 'Drift',
    name_en: 'Operation',
    description_no: 'Implementer kontroller, dokumentasjon og opplæring',
    description_en: 'Implement controls, documentation and training',
    percentageRange: [40, 70],
    activities: ['Kontrollimplementering', 'Dokumentasjon', 'Awareness-trening', 'Overvåking']
  },
  {
    id: 'audit',
    name_no: 'Intern Audit',
    name_en: 'Internal Audit',
    description_no: 'Internrevisjon, ledelsesgjennomgang og korrigering',
    description_en: 'Internal audit, management review and corrective actions',
    percentageRange: [70, 90],
    activities: ['Internrevisjon', 'Ledelsesgjennomgang', 'Korrigerende tiltak', 'Forbedring']
  },
  {
    id: 'certification',
    name_no: 'Sertifisering',
    name_en: 'Certification',
    description_no: 'Stage 1 og Stage 2 audit, vedlikehold',
    description_en: 'Stage 1 and Stage 2 audit, maintenance',
    percentageRange: [90, 100],
    activities: ['Stage 1 Audit', 'Stage 2 Audit', 'Sertifikat', 'Vedlikehold']
  }
];
```

---

## Tekniske endringer

### Filer som opprettes

| Fil | Beskrivelse |
|-----|-------------|
| `src/lib/certificationPhases.ts` | Fasedefinisjonar og hjelpefunksjoner |
| `src/components/iso-readiness/CertificationJourney.tsx` | Horisontal fasevisualisering |
| `src/components/iso-readiness/SLACategoryBreakdown.tsx` | 3-kortsvisning per SLA-kategori |
| `src/components/iso-readiness/PhaseChecklist.tsx` | Krav gruppert etter fase |

### Filer som endres

| Fil | Endring |
|-----|---------|
| `src/components/tasks/ISOReadinessView.tsx` | Refaktoreres til ny struktur med faser |
| `src/lib/complianceRequirementsData.ts` | Legge til `certification_phase` felt |
| `src/locales/nb.json` | Nye oversettelser for faser |
| `src/locales/en.json` | Nye oversettelser for faser |

### Nye oversettelsesnøkler

```json
{
  "isoReadiness": {
    "journey": {
      "title": "Sertifiseringsreisen",
      "subtitle": "Din vei mot ISO-sertifisering"
    },
    "phases": {
      "foundation": {
        "name": "Fundament",
        "description": "Etabler kontekst, scope og gap-analyse"
      },
      "implementation": {
        "name": "Implementering", 
        "description": "Utvikle policies og risikovurdering"
      },
      "operation": {
        "name": "Drift",
        "description": "Kontroller og dokumentasjon"
      },
      "audit": {
        "name": "Intern Audit",
        "description": "Revisjon og forbedring"
      },
      "certification": {
        "name": "Sertifisering",
        "description": "Stage 1, Stage 2 og vedlikehold"
      }
    },
    "slaCategories": {
      "systems_processes": "Systemer og prosesser",
      "organization_governance": "Organisasjon og styring",
      "roles_access": "Roller og tilgang"
    },
    "maturity": {
      "initial": "Initial",
      "defined": "Definert",
      "implemented": "Implementert",
      "measured": "Målt",
      "optimized": "Optimalisert"
    }
  }
}
```

---

## Oppsummering

Denne planen transformerer ISO Readiness-modulen fra en flat kravliste til en strukturert **sertifiseringsreise** som:

1. **Følger PECB-metodikk** med 5 klare faser (Fundament → Sertifisering)
2. **Viser SLA-oppnåelse** per kategori (Systemer, Organisasjon, Roller) – som i brukerens screenshot
3. **Mapper til ISO-standarder** (ISO 27701, ISO 27001, ISO 42001)
4. **Gir modenhetsnivå** basert på fremdrift
5. **Grupperer krav etter fase** for tydelig prioritering

