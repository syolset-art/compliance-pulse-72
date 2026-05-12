## Mål
Når brukeren har lastet opp ett eller flere dokumenter i Trust Profile-redigering, kjører Lara en gap-analyse mot de regulatoriske rammeverkene virksomheten er pålagt (`selected_frameworks`) og vurderer om dokumentene er gode nok eller bør oppdateres.

## UI-tillegg i `DocumentationSection`
Like under dokumentlisten (kun synlig når `documents.length > 0`):

- **Gap-analyse-kort** (lilla `bg-primary/5 border-primary/20`, samme stil som Lara-anbefalingen):
  - Tittel: "Lara-analyse av dokumentasjon"
  - Underline: "Vurderer dine opplastede dokumenter mot {N} pålagte rammeverk: GDPR, ISO 27001, NIS2…"
  - CTA: **"Analyser dokumenter"** (primary). Ved klikk: spinner + "Analyserer X dokumenter mot rammeverk…"

- **Resultat-visning** (etter analyse fullført, persisteres til `asset.metadata.doc_gap_analysis`):
  - Samlet status-pill: "Tilstrekkelig" (primary) / "Forbedringer anbefales" (warning) / "Vesentlige mangler" (destructive)
  - Sammendrag (én setning fra Lara)
  - Liste med findings per dokument:
    - Dokumentnavn + matchet rammeverkskrav (f.eks. "GDPR Art. 28 — DPA")
    - Vurdering: dekningsgrad-pille + kort begrunnelse
    - Anbefaling (én linje, f.eks. "Mangler underleverandør-liste — bør legges til")
  - Liste med manglende dokumenter (krav i rammeverkene som ingen opplastet doc dekker)
  - "Kjør på nytt"-knapp + "Sist analysert {dato}"

## Backend
Ny edge function `supabase/functions/analyze-doc-gap/index.ts`:

- Input: `{ assetId }`
- Henter `vendor_documents` for asset, `selected_frameworks`, og henter signed URLs / metadata (filnavn + document_type + valid_to). Vi trekker ikke ut full PDF-tekst i denne første versjonen — vi sender filnavn, type, dato og rammeverkene til Lara og lar modellen vurdere typisk dekning. (Notert som forenkling i prototypen; full content-OCR kan komme senere via eksisterende `analyze-document`.)
- Lovable AI Gateway, modell `google/gemini-3-flash-preview`, structured output (zod-skjema):
  ```ts
  {
    overallStatus: "sufficient" | "needs_improvement" | "significant_gaps",
    summary: string,
    findings: Array<{
      documentName: string,
      coversRequirement: string,  // f.eks. "GDPR Art. 28"
      coverage: "full" | "partial" | "outdated" | "insufficient",
      recommendation: string
    }>,
    missingDocuments: Array<{
      requirement: string,        // f.eks. "ISO 27001 A.5.1 — Informasjonssikkerhetspolicy"
      framework: string,
      recommendation: string
    }>
  }
  ```
- Lagrer resultatet på `assets.metadata.doc_gap_analysis = { result, analyzed_at }` (ingen ny tabell — bruker eksisterende metadata-jsonb).

## Filer som endres / opprettes
- `supabase/functions/analyze-doc-gap/index.ts` (ny)
- `src/components/trust-center/edit/DocumentationSection.tsx` — legge til gap-analyse-kort + resultatvisning, kall til `supabase.functions.invoke("analyze-doc-gap", ...)`, mutation som invalidates asset-cachen

Ingen DB-migrering nødvendig (bruker `assets.metadata` jsonb). Ingen nye dependencies.
