
# Plan: AI-Native Compliance Checklist med Demo-Data og Forklarende Innhold

## Nåværende Problem

Sjekklisten viser 93 ISO-kontroller, 12 GDPR-krav og 8 AI Act-krav - men **alt står som "ikke startet"** fordi:
1. Tabellen `compliance_requirements` er tom (ingen seed data)
2. Tabellen `requirement_status` er tom (ingen fremdriftsdata)
3. Brukeren ser ingen demonstrasjon av hvordan AI-agentene jobber

## AI-Native Narrativ

I stedet for bare en sjekkliste, skal dette være **"Din AI-partner for sertifisering"** som viser:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 Lara jobber for deg                                                     │
│                                                                             │
│  "Jeg har analysert dine systemer og prosesser. Av 93 ISO 27001-kontroller  │
│   kan jeg håndtere 35 autonomt, 42 med din godkjenning, og 16 krever        │
│   din direkte innsats. La oss ta det stegvis."                              │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │   🤖 35    │  │   ✨ 42     │  │   👤 16    │                         │
│  │  AI Ready   │  │   Hybrid   │  │   Manual   │                         │
│  │ 28 fullført │  │ 12 pågår   │  │ 3 starter  │                         │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Løsning: Tre Deler

### Del 1: Demo-data for Realistisk Visning

Seede `compliance_requirements` og `requirement_status` med:

**ISO 27001 (93 kontroller)**:
- 28 fullført av AI-agent
- 12 pågår (8 av AI, 4 hybrid)
- 53 ikke startet (men 35 er "AI Ready")

**GDPR (12 krav)**:
- 5 fullført (3 av agent, 2 hybrid)
- 3 pågår
- 4 ikke startet

**AI Act (8 krav)**:
- 4 fullført
- 2 pågår
- 2 ikke startet (manuelle)

### Del 2: AI-Native Introduksjonsheader

Legg til en "Lara's Insights"-seksjon øverst på siden:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✨ Intelligent Samsvarsstyring                                             │
│                                                                             │
│  Mynder bruker AI-agenter til å automatisere compliance-arbeid. Hver       │
│  kontroll er klassifisert etter hvem som kan gjøre jobben:                 │
│                                                                             │
│  🤖 AI Ready       Lara fullfører dette automatisk basert på               │
│                    dine systemer og prosesser                               │
│                                                                             │
│  ✨ Hybrid         Lara forbereder dokumentasjon og forslag -               │
│                    du godkjenner eller justerer                            │
│                                                                             │
│  👤 Manuell        Krever din direkte handling - Lara gir                   │
│                    veiledning og maler                                     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  💡 Tips: Filtrer på "Manuell" for å se hva som krever din handling først  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Del 3: "AI i Arbeid"-Widget

Vise pågående AI-arbeid:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 Lara jobber nå                                          Live           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ⏳ A.5.7 Trusseletterretning                 ▓▓▓▓▓▓▓░░░  72%              │
│     Henter data fra Snyk og 7Security...                                    │
│                                                                             │
│  ⏳ A.8.9 Konfigurasjonsstyring               ▓▓▓▓░░░░░░  45%              │
│     Analyserer GitHub-repositorier...                                       │
│                                                                             │
│  ⏳ A.5.23 Skytjeneste-sikkerhet              ▓▓▓░░░░░░░  32%              │
│     Kartlegger Azure og AWS-konfigurasjoner...                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Filer som Endres/Opprettes

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `supabase/migrations/xxx_seed_compliance_demo.sql` | **Ny** | Seede compliance_requirements + demo requirement_status |
| `src/pages/ComplianceChecklist.tsx` | **Oppdater** | Legg til AI-native intro-header og "AI i arbeid"-widget |
| `src/components/compliance/AIWorkingWidget.tsx` | **Ny** | Vise pågående AI-arbeid med live-indikatorer |
| `src/components/compliance/ComplianceIntroHeader.tsx` | **Ny** | Forklarende intro om AI-native tilnærmingen |

## Demo-Data Oversikt

### Requirement Status Eksempler

| Kontroll | Status | AI Handling | Fullført av |
|----------|--------|-------------|-------------|
| A.5.1 Policies | ✅ completed | ✅ | agent |
| A.5.7 Threat Intelligence | ⏳ in_progress (72%) | ✅ | - |
| A.5.9 Asset Inventory | ✅ completed | ✅ | agent |
| A.5.24 Incident Management | ⬜ not_started | ❌ | - (manual) |
| A.6.3 Security Awareness | ⬜ not_started | ❌ | - (manual) |
| GDPR-Art30 ROPA | ✅ completed | ✅ | agent |
| AIACT-Art6 Risk Classification | ✅ completed | ✅ | agent |

### Forventet Visuell Effekt

Etter implementering vil brukeren se:

```text
ISO 27001:2022                                         42% Ready
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░

🤖 AI: 35   ✨ Hybrid: 42   👤 Manual: 16

┌────────────────────────────────────────────────────────────────┐
│ 🤖 Lara jobber nå                                    ● Live   │
├────────────────────────────────────────────────────────────────┤
│ ⏳ A.5.7 Trusseletterretning              ▓▓▓▓▓▓▓░░░  72%    │
│ ⏳ A.8.9 Konfigurasjonsstyring            ▓▓▓▓░░░░░░  45%    │
│ ⏳ A.5.23 Skytjeneste-sikkerhet           ▓▓▓░░░░░░░  32%    │
└────────────────────────────────────────────────────────────────┘

🔴 Krever din handling (3)
─────────────────────────
⬜ A.5.24 Incident Management Planning        👤 Manual  [Start →]
⬜ A.6.3 Security Awareness                   👤 Manual  [Start →]
⬜ A.7.1 Physical Security                    👤 Manual  [Start →]

✅ Fullført (39)
─────────────────
✅ A.5.1 Information Security Policies        🤖 Agent   ✓ Completed
✅ A.5.7 Asset Inventory                      🤖 Agent   ✓ Completed
✅ A.5.15 Access Control                      🤖 Agent   ✓ Completed
+ 36 more...
```

## Implementeringssteg

### Steg 1: Database Migration for Demo-data
Opprett SQL-migrasjon som:
1. Setter inn alle 93+12+8 krav i `compliance_requirements`
2. Setter inn realistisk demo-status i `requirement_status`

### Steg 2: AI-Native Intro-komponent
Bygg `ComplianceIntroHeader` som forklarer agent-klassifiseringene

### Steg 3: AI i Arbeid-widget
Bygg `AIWorkingWidget` som viser pågående AI-arbeid med progresjonslinjer

### Steg 4: Integrer i ComplianceChecklist
Oppdater siden til å inkludere intro og AI-widget

## AI-Native Differensiering

Dette skiller Mynder fra tradisjonelle GRC-verktøy:

| Tradisjonell GRC | Mynder AI-Native |
|------------------|------------------|
| Statisk sjekkliste | Dynamisk med live AI-fremdrift |
| Manuelt arbeid | AI gjør 38% automatisk |
| Ingen veiledning | Agent forklarer hva den gjør |
| Generisk | Tilpasset basert på dine systemer |
| Reaktiv | Proaktiv - AI starter selv |

## Fordeler

1. **Umiddelbar forståelse** - Brukeren ser at dette er annerledes enn tradisjonelle verktøy
2. **Synlig AI-verdi** - Tydelig at 35+ kontroller håndteres automatisk
3. **Prioritert fokus** - Manuelle oppgaver vises først
4. **Live fremdrift** - Se at agenten faktisk jobber
5. **Transparent** - Forstå hvem (AI vs deg) som gjør hva
