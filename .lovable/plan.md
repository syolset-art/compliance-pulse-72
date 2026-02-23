

# Koble arshjulet til reell data

## Oversikt
Hvert element i arshjulet far en unik `statusKey` som kobles til en statusfunksjon. Funksjonen sjekker reelle data fra databasen (requirement_status, assets, vendor_documents, system_incidents, company_profile, framework_documents, selected_frameworks) og returnerer om aktiviteten er fullfort, pagaende, eller ikke startet. Ikonet endres fra gratt til gront/gult basert pa status.

## Datakoblinger per aktivitet

| Aktivitet | Datakilde | Fullfort nar |
|---|---|---|
| **Q1: Gap-analyse** | requirement_status (completed count) | >20% av krav fullfort |
| **Q1: Scope-definisjon** | selected_frameworks (is_selected) | Minst 1 rammeverk valgt |
| **Q1: Rollefordeling** | company_profile (compliance_officer, dpo_name, ciso_name) | Minst 2 av 3 roller utfylt |
| **Q1: Behandlingsprotokoll** | requirement_status for GDPR Art.30 | Art.30 er completed |
| **Q2: Risikovurdering** | process_risk_scenarios (count) | Minst 1 risikoscenario finnes |
| **Q2: Policy-utvikling** | framework_documents (document_type = 'policy') | Minst 1 policy lastet opp |
| **Q2: DPIA ved behov** | requirement_status for GDPR Art.35 | Art.35 completed eller in_progress |
| **Q2: Bevisstgjoring** | security_micro_courses (is_active count) | Minst 1 kurs aktivt |
| **Q3: Kontrollimpl.** | requirement_status (iso27001 completed) | >30% av ISO-krav fullfort |
| **Q3: Leverandorvurdering** | assets (vendor type count) + vendor_documents | Minst 1 leverandor med dokument |
| **Q3: Avvikshandtering** | system_incidents (count) | Minst 1 avvik registrert |
| **Q3: Beredskapstest** | system_incidents (category = 'test') | Minst 1 test-hendelse |
| **Q4: Internrevisjon** | requirement_status for ISO 9.2 | A.5.35 eller 9.2-krav completed |
| **Q4: Ledelsesgjennomgang** | requirement_status for ISO 9.3 | Relevant krav completed |
| **Q4: DPA oppdatering** | vendor_documents (valid_to check) | Minst 1 DPA med gyldig dato |
| **Q4: Forbedring** | tasks (status = 'completed' count) | Minst 1 oppgave fullfort |

## Teknisk plan

### 1. Ny hook: `src/hooks/useCalendarActivityStatus.ts`
- Henter data fra alle relevante tabeller i parallelle queries
- Returnerer et `Record<string, 'completed' | 'in_progress' | 'not_started'>` map
- Bruker `useQuery` med en stale time pa 60 sekunder (data endres sjelden)
- Alle 16 aktiviteter far en unik nokkel (f.eks. `q1_gap_analysis`, `q3_vendor_review`)

### 2. Oppdater `ComplianceCalendarSection.tsx`
- Legg til `statusKey` pa hvert activity-objekt i QUARTERS-arrayen
- Importer og bruk `useCalendarActivityStatus()`
- Erstatt fast `opacity-30` pa CheckCircle2 med dynamisk styling:
  - `completed`: Gront ikon, full opacity, fylt sirkel
  - `in_progress`: Gult/amber ikon, medium opacity
  - `not_started`: Gratt ikon, lav opacity (som na)

### 3. Oppdater `RiskAndCalendarSection.tsx` (dashboard-versjonen)
- Legg til `statusKey` pa hvert activity-element
- Importer og bruk samme hook
- Dynamisk farge pa CheckCircle2-ikonet
- Vis en liten fremdriftsindikator per kvartal (f.eks. "2/4")

### 4. Visuell design
- **Fullfort**: `text-emerald-500 opacity-100` + fylt CheckCircle2
- **Pagaende**: `text-amber-500 opacity-70` + halv-fylt Circle
- **Ikke startet**: `text-muted-foreground opacity-30` (eksisterende)
- Kvartalsoverskrift far en mini-badge med "2/4 fullfort"

## Filer som endres/opprettes
1. **Ny**: `src/hooks/useCalendarActivityStatus.ts` -- Hook som henter status fra DB
2. **Endres**: `src/components/widgets/ComplianceCalendarSection.tsx` -- Dynamisk ikonstatus
3. **Endres**: `src/components/dashboard-v2/RiskAndCalendarSection.tsx` -- Dynamisk ikonstatus

