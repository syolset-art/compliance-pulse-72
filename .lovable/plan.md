
# Kvalitetssystem som tilleggsmodul i Mynder

## Overordnet konsept

Kvalitetssystemet tilbys som en konfigurerbar modul som kunden aktiverer via en guidet aktiveringsflyt. Basert på kundens bransje, regelverk og virksomhetsprofil settes modulen opp med relevant innhold og struktur. Dette sikrer at kunden får et skreddersydd kvalitetssystem som føles integrert i Mynder-pakken.

## Arkitektur og modularitet

```text
┌─────────────────────────────────────────────────────────────┐
│                    KVALITETSSYSTEM-MODUL                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │  HMS-KJERNE     │  │  BRANSJE-       │  │  STYRINGS-   ││
│  │  (Obligatorisk) │  │  TILPASNING     │  │  SYSTEM      ││
│  ├─────────────────┤  ├─────────────────┤  ├──────────────┤│
│  │ - Avviksreg.    │  │ - Helse:        │  │ - ISO 9001   ││
│  │ - Risiko (SJA)  │  │   Pasient-      │  │ - ISO 14001  ││
│  │ - Kompetanse    │  │   sikkerhet,    │  │ - ISO 45001  ││
│  │ - Dokumenter    │  │   Legemidler    │  │ - OHSAS      ││
│  │ - Varsling      │  │ - Bygg/Anlegg:  │  │ - Internkon- ││
│  │                 │  │   SHA, SJA      │  │   troll      ││
│  └─────────────────┘  │ - Industri:     │  └──────────────┘│
│                       │   Stoffkartotek,│                   │
│                       │   Utstyr        │                   │
│                       └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Guidet aktiveringsflyt

### Steg 1: Velg kvalitetssystem-type

Kunden velger hovedtype basert på behov:

| Type | Beskrivelse | Målgruppe |
|------|-------------|-----------|
| **HMS-basis** | Grunnleggende internkontroll etter forskrift | Alle virksomheter |
| **HMS-utvidet** | HMS + bransjesspesifikke krav | Bygg, industri, energi |
| **Kvalitetsledelse** | ISO 9001-basert kvalitetsstyring | Sertifiserte bedrifter |
| **Integrert ledelsessystem** | HMS + Kvalitet + Miljø | Store virksomheter |

### Steg 2: Bransjetilpasning

Basert på `company_profile.industry` vises relevante moduler:

**Helse:**
- Pasientsikkerhet og meldeplikt
- Legemiddelhåndtering
- Smittevern og hygiene
- Medisinsk utstyr

**Bygg og anlegg:**
- SHA-plan (Sikkerhet, Helse, Arbeidsmiljø)
- SJA-register (Sikker Jobb Analyse)
- Utstyrsregister med sertifikater
- Stoffkartotek

**Industri:**
- Stoffkartotek med HMS-datablad
- Utstyrsregister og vedlikeholdslogg
- Produksjonskontroll
- Miljøovervåking

**Tech/SaaS:**
- Informasjonssikkerhet (ISO 27001)
- Kontinuerlig forbedring
- Hendelseshåndtering
- Endringsledelse

### Steg 3: Regelverkstilknytning

Systemet kobler automatisk til aktive regelverk fra `selected_frameworks`:

```text
Dine aktive regelverk:
☑ HMS-lovgivningen (obligatorisk)
☑ Arbeidsmiljøloven
☑ Internkontrollforskriften
☐ ISO 9001 (anbefalt for din bransje)
☐ ISO 14001 (miljøledelse)
```

### Steg 4: Oppsummering og aktivering

Viser hva som aktiveres:
- Nye menyvalg i sidepanelet
- Automatiske arbeidsområder
- Genererte sjekklister og oppgaver
- Månedlig tilleggspris

## Nye komponenter/sider

### 1. Kvalitetsoversikt (Dashboard-widget)
- KPI-er for kvalitet og HMS
- Avvik-trender
- Kommende revisjoner
- Forbedringsprosjekter

### 2. SJA-register (Sikker Jobb Analyse)
- Mal-bibliotek basert på bransje
- Digital signering
- Historikk per arbeidsområde

### 3. Stoffkartotek
- HMS-datablad med utløpsdato
- Faremerking og risikovurdering
- Kobling til arbeidsområder og lokasjoner

### 4. Utstyrsregister
- Sertifikater og godkjenninger
- Vedlikeholdsintervaller
- Kalibreringslpgg
- Varsler ved utløp

### 5. Kompetanseoversikt
- Kurs og sertifiseringer per ansatt
- Utløpsvarsler
- Kompetansekrav per rolle

### 6. Varslingsplaner
- Beredskapsrutiner
- Varslingslister
- Øvelseslogg

## Database-utvidelser

Nye tabeller som opprettes ved aktivering:

```text
quality_modules (id, company_id, module_type, activated_at, config)
sja_templates (id, industry, name, steps, hazards)
sja_records (id, work_area_id, template_id, performed_by, signed_at)
chemical_registry (id, company_id, name, cas_number, hazard_class, sds_url)
equipment_registry (id, company_id, name, type, certification_expiry, last_service)
competency_records (id, user_id, certification_type, issued_date, expiry_date)
emergency_plans (id, company_id, plan_type, content, last_reviewed)
```

## Prismodell

| Modul | Pris |
|-------|------|
| HMS-basis | Inkludert i alle planer |
| HMS-utvidet | +490 kr/mnd |
| Kvalitetsledelse (ISO 9001) | +790 kr/mnd |
| Integrert ledelsessystem | +1290 kr/mnd |

## Integrasjon med eksisterende funksjonalitet

### Gjenbruk av eksisterende:
- **Avviksregistrering** - Utvides med HMS-kategorier
- **Risikovurdering** - Kobles til SJA og stoffkartotek
- **Dokumentanalyse** - Brukes for HMS-datablad
- **Arbeidsområder** - Kobles til kompetanse og utstyr
- **Oppgaver** - Genererer vedlikeholdsoppgaver

### Lara AI-assistanse:
- Foreslår SJA-maler basert på arbeidstype
- Analyserer HMS-datablad og foreslår tiltak
- Varsler om utløpende sertifikater
- Genererer revisjonsrapporter

## Implementeringsrekkefølge

### Fase 1: Grunnstruktur
1. Opprette `QualityModuleActivationWizard` komponent
2. Utvide `AddModuleDialog` med kvalitetssystem-valg
3. Database-migrasjoner for nye tabeller
4. Sidebar-integrasjon med dynamiske menyvalg

### Fase 2: HMS-kjerne
5. SJA-register med mal-bibliotek
6. Stoffkartotek-modul
7. Utstyrsregister med vedlikeholdslogg
8. Kompetanseoversikt

### Fase 3: Bransjetilpasning
9. Bransjespesifikke SJA-maler
10. Industri-spesifikke sjekklister
11. Helse-spesifikke moduler

### Fase 4: Integrasjon
12. Kobling til eksisterende avvikssystem
13. Dashboard-widgets for kvalitet
14. Rapporter og statistikk
15. Lara-integrasjon for AI-assistanse

## Tekniske detaljer

### Ny fil: `src/lib/qualityModuleDefinitions.ts`
Definerer alle kvalitetsmodul-typer, bransjetilpasninger og krav.

### Ny fil: `src/components/quality/QualityModuleActivationWizard.tsx`
Multi-steg wizard som følger samme mønster som `DomainActivationWizard`.

### Ny fil: `src/pages/QualityDashboard.tsx`
Hovedside for kvalitetssystemet med oversikt og navigasjon.

### Oppdatert: `src/components/Sidebar.tsx`
Dynamiske menyvalg basert på aktiverte kvalitetsmoduler.

### Oppdatert: `src/lib/frameworkDefinitions.ts`
Legge til kvalitetsrelaterte rammeverk (ISO 9001, ISO 14001, ISO 45001).

## Brukeropplevelse

Når kunden klikker "Legg til tilleggsmodul" og velger Kvalitetssystem:

1. **Velkomstskjerm** - Forklarer verdien av et strukturert kvalitetssystem
2. **Bransje bekreftes** - Viser kundens bransje og foreslår relevant oppsett
3. **Modul-valg** - Kunden velger hvilke deler de trenger
4. **Regelverk-kobling** - Automatisk tilknytning til relevante standarder
5. **Pris og bekreftelse** - Transparent kostnadsoversikt
6. **Aktivering** - Modulen aktiveres og Lara guider videre oppsett

Resultatet er at kunden opplever et sømløst integrert kvalitetssystem som en naturlig del av Mynder-pakken, tilpasset deres spesifikke bransje og behov.
