

# Kvalitetssystem som fullverdig modul i Mynder

## Visjon
Kvalitetssystemet (QMS) blir en integrert del av Mynder-plattformen som kobler sammen HMS/kvalitet med eksisterende leverandorstyring, avvik, dokumentasjon og foresporsler. Dette gir Mynder en unik posisjon som leverandor av baade trust management OG kvalitetssystem -- i ett grensesnitt.

## Arkitektur: Hvordan QMS kobles til plattformen

```text
                        Kvalitetssystem (QMS)
                              |
        +---------------------+---------------------+
        |                     |                     |
   Avviksregister        Dokumenter            Leverandorer
   (system_incidents)    (uploaded_documents)   (assets)
        |                     |                     |
        +-- Kategorier:       +-- HMS-datablad      +-- Leverandor-avvik
        |   HMS, Kvalitet,    +-- SJA-rapporter     |   (7 Security feed)
        |   Miljoe, Sikkerhet +-- Internrevisjoner  +-- Leverandor-dokumenter
        |                     +-- Prosedyrer        |   (DPA, ISO-sert.)
        |                                           |
        +-------- Foresporsler (customer_requests) -+
                  Kunder kan be om:
                  - HMS-dokumentasjon
                  - Kvalitetssertifikater
                  - Internrevisjonsrapporter
```

## Hva skal bygges

### 1. Ny databasetabell: `quality_modules`
Sporer hvilke QMS-moduler kunden har aktivert, kobler til bransje og valgte undermoduler.

Kolonner:
- `id` (uuid, PK)
- `module_type` (text) -- hms-basis, hms-extended, quality-management, integrated-management
- `industry_type` (text) -- health, construction, industry, tech, general
- `selected_industry_modules` (text[]) -- pasientsikkerhet, sja-register, etc.
- `is_active` (boolean)
- `activated_at` (timestamptz)
- `created_at` (timestamptz)

### 2. Utvid avviksregisteret med QMS-kategorier
Legge til QMS-spesifikke avvikskategorier i `deviationCategories.ts`:
- HMS-avvik (personskade, nestenulykke, farlige forhold)
- Kvalitetsavvik (kundereklamasjon, prosessavvik, produktfeil)
- Miljeavvik (utslipp, avfall, forurensning)
- Sikkerhetsavvik (allerede dekket av 7 Security-integrasjonen)

Utvide avvikskortet med QMS-kontekst: kobling til SJA, utstyr, prosedyre.

### 3. Dokumentstyring for QMS
Utvide `uploaded_documents` og dokumentflyten:
- Nye dokumenttyper: `sja-report`, `hms-datasheet`, `audit-report`, `procedure`, `emergency-plan`
- QMS-dokumenter vises baade i Trust Profilen og i QMS-dashboardet
- Versjonering og godkjenningsstatus

### 4. Kobling til leverandorer
- Leverandorer med HMS-relevans (f.eks. vikarbyra, byggeleverandorer) faar QMS-fane i Trust Profilen
- Foresporsler om HMS-dokumentasjon fra leverandorer via utgaaende foresporsler
- Leverandor-avvik (fra 7 Security etc.) kategoriseres automatisk som HMS/sikkerhet

### 5. Foresporselsmodulen: QMS-utvidelse
- Nye foresporselstyper: "HMS-dokumentasjon", "Kvalitetssertifisering", "Internrevisjonsrapport"
- Kunder kan be om HMS-sertifikater via innkommende foresporsler
- Trust Profilen publiserer QMS-status som del av selvdeklaeringen

### 6. QMS Dashboard: Koble til live data
Oppgradere `QualityDashboard.tsx` fra hardkodet demo til live data:
- KPI-er hentes fra `system_incidents` (filtrert paa HMS-kategorier)
- Dokumentoversikt fra `uploaded_documents`
- Kommende oppgaver fra `tasks`
- Leverandor-hendelser fra Lara Innboks

### 7. Sidebar og navigasjon
Aktivere Quality-menypunktet i sidebaren (naa kommentert ut), betinget paa at `quality_modules` har aktive moduler.

## Posisjonering som QMS-leverandor

Modellen gir Mynder tre unike fordeler:
1. **Integrert**: HMS/kvalitet deler avvik, dokumenter og leverandorer med trust management -- ingen duplisering
2. **AI-drevet**: Lara klassifiserer avvik, foreslaar tiltak og overvaker leverandor-hendelser automatisk
3. **Leverandorkjede-synlig**: QMS-status publiseres i Trust Profilen, saa kunder og leverandorer ser det

## Teknisk gjennomforing

### Steg 1: Database
- Opprett `quality_modules`-tabell
- Utvid `deviationCategories.ts` med HMS/kvalitetskategorier
- Legg til nye dokumenttyper i systemet

### Steg 2: Aktiveringswizard
- Oppdater `QualityModuleActivationWizard.tsx` til aa faktisk lagre valg i `quality_modules`
- Koble til sidebar-visning (vis Quality-meny kun naar aktivert)

### Steg 3: QMS Dashboard med live data
- Refaktor `QualityDashboard.tsx` til aa hente fra database
- Koble avvik-widget til `system_incidents` med HMS-filter
- Koble dokumenter til `uploaded_documents`
- Vise leverandor-hendelser fra `lara_inbox`

### Steg 4: Trust Profil-integrasjon
- Ny fane/seksjon i Trust Profilen: "HMS og kvalitet"
- Vise QMS-status, siste revisjon, aktive moduler
- Publiserbar som del av selvdeklaeringen

### Steg 5: Foresporsler-utvidelse
- Legge til QMS-spesifikke foresporselstyper
- Kunder kan be om HMS-dokumentasjon direkte

### Steg 6: Syntetiske data
- Sette inn demo-avvik med HMS-kategorier
- Sette inn QMS-dokumenter
- Aktivere demo-moduler for HULT IT

