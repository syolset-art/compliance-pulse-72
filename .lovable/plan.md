

# Dokumentkobling til regelverk

## Hva vi bygger
En enkel funksjon som lar brukere laste opp og koble eksisterende dokumenter (policyer, prosedyrer, retningslinjer) direkte til hvert regelverk. Dette gir full sporbarhet mellom krav og dokumentasjon -- akkurat slik en ISO-auditor forventer.

## Hvorfor dette er smart (PECB-perspektiv)
- **ISO 27001 A.5.1**: Krever dokumenterte policyer koblet til relevante krav
- **Statement of Applicability (SoA)**: Viser at hvert krav er dekket av dokumentasjon
- **Gap-identifikasjon**: Regelverk uten dokumenter = synlige gap som må lukkes
- **Audit-readiness**: Auditor kan se direkte hvilke policyer som dekker hvilke krav

## Brukeropplevelse

Inne i hver regelverkskategori (når den er utvidet), vil hvert aktivt regelverk vise:
1. En liten indikator som viser antall koblede dokumenter (f.eks. "2 dokumenter")
2. En "Last opp / Koble dokument"-knapp
3. Klikk for a se/administrere koblede dokumenter i en dialog

Dialogen lar brukeren:
- Laste opp nye filer (PDF, Word, etc.) til lagring
- Se allerede koblede dokumenter med navn, type og opplastningsdato
- Fjerne koblinger
- Merke dokumenter med type (Policy, Prosedyre, Retningslinje, SoA, Risikovurdering, etc.)

## Teknisk plan

### 1. Ny databasetabell: `framework_documents`
Kobler dokumenter til regelverk med metadata.

```sql
CREATE TABLE framework_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id TEXT NOT NULL,        -- refererer til framework.id (f.eks. 'gdpr', 'iso27001')
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,           -- path i storage bucket
  file_size INTEGER,
  document_type TEXT DEFAULT 'policy', -- policy, procedure, guideline, soa, risk_assessment, other
  notes TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Alle autentiserte brukere har tilgang (matcher eksisterende moenster)
ALTER TABLE framework_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to framework_documents" ON framework_documents FOR ALL USING (true) WITH CHECK (true);
```

### 2. Ny komponent: `FrameworkDocumentsDialog`
- Plasseres i `src/components/regulations/FrameworkDocumentsDialog.tsx`
- Viser liste over koblede dokumenter for et spesifikt regelverk
- Filopplasting via `documents` storage bucket (allerede opprettet)
- Dokumenttype-velger (Policy, Prosedyre, Retningslinje, etc.)
- Mulighet for a slette/fjerne koblinger

### 3. Oppdater `src/pages/Regulations.tsx`
- Legg til dokumentteller-badge pa hvert aktivt regelverk (f.eks. "3 dok.")
- Legg til en liten "Dokumenter"-knapp ved siden av Switch-komponenten
- Fetch dokumenttellinger per regelverk via en enkel query
- Apne FrameworkDocumentsDialog ved klikk

### 4. Dokumenttype-kategorier
Basert pa PECB/ISO best practices:
- **Policy** -- Overordnet retningslinje
- **Prosedyre** -- Detaljert fremgangsmate
- **Retningslinje** -- Veiledende dokument
- **Statement of Applicability** -- SoA (ISO 27001-spesifikk)
- **Risikovurdering** -- Dokumentert risikoanalyse
- **Rapport** -- Audit-rapport, statusrapport
- **Annet** -- Ovrig dokumentasjon

### 5. Visuell indikator pa regelverksniva
- Regelverk med 0 dokumenter: Ingen badge, bare "Legg til dokument"-lenke
- Regelverk med dokumenter: Gron badge med antall, klikk for a se
- Dette gir umiddelbar oversikt over gap (regelverk uten dokumentasjon)

## Filer som endres/opprettes
1. **Ny**: `src/components/regulations/FrameworkDocumentsDialog.tsx` -- Dokumentdialog
2. **Endres**: `src/pages/Regulations.tsx` -- Dokumentteller og knapp per regelverk
3. **Database-migrasjon**: `framework_documents`-tabell
