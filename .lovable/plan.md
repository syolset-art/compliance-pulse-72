
## Re-tenkning av "Verifisert"

Dagens flyt ber brukeren fylle inn ekstern revisor, dato osv. som et skjema. Det er feil premiss. Riktig premiss:

- Brukeren laster opp et dokument (personvernerklæring, ISO-sertifikat, DPA, policy, SOC 2, ...).
- AI (Lara) analyserer dokumentet mot kravets artikler/punkter.
- Dekningsgraden bestemmer score, ikke om det er signert eller sertifisert.
- Signatur / uavhengig utsteder påvirker *tillitsgrad* (evidence tier), ikke score direkte.

## Ny modell

### 1. Krav får en artikkelliste

I `complianceRequirementsData.ts` (og `additionalFrameworkRequirements.ts`) legger vi til `covered_articles: string[]` per krav — konkrete artikler/punkter kravet må dekke, f.eks. `["GDPR Art. 13", "GDPR Art. 14"]` eller `["ISO 27001 A.5.1", "A.5.2", "A.5.3", "A.5.4", "A.5.5"]`. Der data ikke finnes fra før, avledes en initial liste fra eksisterende `article`/`regulation_reference`-felter, ellers står listen tom og kravet fungerer som i dag.

### 2. Dokument = dekningsanalyse, ikke skjema

`EvidenceDocument` utvides:
```ts
classification?: {
  docType: string;
  coveredArticles: string[];   // artikler AI mener dokumentet dekker
  confidence: number;
  summary?: string;
};
signature?: {
  isSigned: boolean;           // digital signatur / signert PDF
  signedBy?: string;
  signedAt?: string;
  issuer?: string;             // ekstern utsteder hvis kjent (BDO, DNV...)
};
```
`VerificationInfo` (skjema-baserte verifikatorfelter) beholdes bare som *avledet* metadata for visning — ikke som brukerinput.

### 3. Ny dialog: `AttachEvidenceDialog` (erstatter `VerifyRequirementDialog`)

Når brukeren velger "Verifisert" — eller trykker "Tilknytt dokument" — åpnes én dialog med tre steg:

```text
[1] Last opp fil       →  drag/drop, PDF/DOCX/URL
[2] Lara analyserer    →  spinner, kaller edge function
[3] Resultat           →  "Dekker 4 av 5 artikler"
                          - Liste over artikler m/ grønn/gul/rød pill
                          - Signatur oppdaget: ja/nei (påvirker tillit, ikke score)
                          - Bekreft & tilknytt / Avbryt
```
Ingen manuell "hvem verifiserte" — det leser AI ut av dokumentet (utsteder, signatur, dato, gyldig til). Brukeren kan overstyre i "detaljer"-panel etterpå hvis nødvendig.

### 4. Ny edge function: `analyze-evidence-coverage`

Input: `{ requirementId, documentText, fileName, coveredArticles: string[] }`
Output:
```json
{
  "coveredArticles": ["GDPR Art. 13", "GDPR Art. 14"],
  "missingArticles": ["GDPR Art. 15"],
  "coverageRatio": 0.67,
  "confidence": 0.82,
  "signature": { "isSigned": true, "issuer": "BDO Norge AS", "signedAt": "2026-06-01" },
  "docType": "audit_report",
  "summary": "Rapporten dekker informasjonsplikt art. 13–14, men mangler beskrivelse av innsyn (art. 15)."
}
```
Baseres på eksisterende `classify-evidence-document`, men med `covered_articles` sendt inn så AI kan gjøre eksplisitt matching.

### 5. Scoring: partial credit per artikkeldekning

I `scoringEngine.ts` og `requirementFulfillment.ts`:

- Nytt felt `documentCoverageRatio` (0–1) per krav, beregnes som andel av `covered_articles` som er dekket av minst ett tilknyttet dokument (union på tvers av dokumenter).
- Effektiv modenhet: hvis kravet er `document_required` og `covered_articles.length > 0`, ganges det siste modenhetsnivået fra bruker (0–4) med `documentCoverageRatio` før score-utregning. Eksempel: bruker sier "Implementert" (3), 4/5 artikler dekket = `3 * 0.8 = 2.4` → 60 %.
- Signatur (`signature.isSigned`) påvirker *ikke* score. Den bytter kravets `evidence` state fra `self_reported` → `attested`/`verified` (visuell tillit + evt. bidrag til Trust Score `riskExposure`-vekt, ikke `compliance`-score).

### 6. Progress = "Verifisert" krever full dekning

`ProgressStatus === "verified"` settes automatisk når `documentCoverageRatio === 1` OG minst ett dokument har `signature.isSigned` med ekstern utsteder. Hvis full dekning men uten signatur → forblir `implemented` + `evidence: attested`. Manuell "Verifisert" i dropdown gjør bare det samme som "Tilknytt dokument"-CTA: åpner `AttachEvidenceDialog`.

### 7. UI i `FrameworkRequirementsList`

- Progress-select fjerner egen `verified`-handler; velg "Verifisert" → åpner attach-dialog.
- Under hvert krav med `covered_articles`: liten "Dekning"-linje: `▓▓▓▓░ 4/5 artikler dekket` og hover viser hvilke.
- `RequirementCard` viser en "Signert" microbadge (ikke score-farge, kun tillitsindikator) når `signature.isSigned`.

### 8. Filer som endres

- `src/lib/requirementStatusModel.ts` — utvid `EvidenceDocument`, marker `VerifierType`/`VERIFIER_TYPES` som interne (kan beholdes for AI-mapping), fjern kravet om manuell input.
- `src/lib/complianceRequirementsData.ts`, `src/lib/additionalFrameworkRequirements.ts` — nytt `covered_articles` (valgfritt) + backfill fra `article`-felt der mulig.
- `src/lib/requirementFulfillment.ts` — beregn `documentCoverageRatio`.
- `src/lib/scoringEngine.ts` — effektiv-modenhet basert på dekning; dokumenter i JSDoc at signatur ikke inngår i score.
- `src/components/regulations/VerifyRequirementDialog.tsx` — erstattes av …
- `src/components/regulations/AttachEvidenceDialog.tsx` — ny.
- `src/components/regulations/FrameworkRequirementsList.tsx` — bruk ny dialog, vis dekningslinje, endre `verified`-handler.
- `src/components/regulations/RequirementCard.tsx` — dekningsbar + signert-badge.
- `supabase/functions/analyze-evidence-coverage/index.ts` — ny edge function.
- `src/hooks/useClassifyEvidence.ts` — gjenbrukes / utvides til å ta `coveredArticles`.
- `src/lib/i18n.ts` — nye tekster (Norsk/Engelsk).

## Åpne spørsmål før implementasjon

1. **Backfill av `covered_articles`:** Vil du at jeg backfyller listene automatisk fra eksisterende `article`/`regulation_reference` (best effort), eller starte tomt og la Lara foreslå per krav i en egen runde?
2. **Score-effekt av signatur:** OK at signatur kun løfter *tillit* (evidence state) og ikke gir score-bonus? Alternativet er å gi et lite tillegg (f.eks. +5 %) på Trust Score `riskExposure`-komponenten.
3. **Manuell overstyring:** Skal brukeren kunne overstyre AI-dekningen (huke av "denne artikkelen er faktisk dekket") — eller er AI-resultatet låst?
