

# Tommel opp/ned-tilbakemelding pa AI-konfidensgrad

## Oversikt
Legger til tommel opp/ned-knapper ved AI-konfidensgrad-indikatoren i dokument-opplastingsdialogen. Tommel opp bekrefter at klassifiseringen er riktig. Tommel ned apner et lite skjema der brukeren kan angi riktig dokumenttype og eventuelt en kommentar, slik at tilbakemeldingen kan brukes til a forbedre agenten.

## Hva som endres

### 1. Ny databasetabell: `ai_classification_feedback`
Lagrer tilbakemeldinger for fremtidig agentforbedring:
- `id` (uuid, PK)
- `asset_id` (uuid, nullable) -- hvilken leverandor dokumentet tilhorer
- `file_name` (text) -- filnavnet som ble klassifisert
- `ai_suggested_type` (text) -- hva AI foreslo
- `ai_confidence` (numeric) -- AI-konfidensgraden
- `feedback` (text) -- "positive" eller "negative"
- `correct_document_type` (text, nullable) -- hva brukeren mener er riktig (kun ved negativ)
- `user_comment` (text, nullable) -- valgfri kommentar
- `created_at` (timestamptz)

RLS: open access (som ovrige tabeller i prosjektet).

### 2. Oppdater `src/components/asset-profile/UploadDocumentDialog.tsx`
- Legg til ThumbsUp og ThumbsDown ikoner fra lucide-react
- Ved AI-konfidensgrad-seksjonen (linje ~440-466), legg til to sma knapper:
  - Tommel opp: lagrer positiv tilbakemelding direkte til `ai_classification_feedback`, viser kort bekreftelse (sjekk-ikon)
  - Tommel ned: ekspanderer en liten seksjon under med:
    - Select for "Hva slags dokument er dette egentlig?" (gjenbruker eksisterende DOC_TYPES)
    - Valgfritt tekstfelt for kommentar
    - "Send tilbakemelding"-knapp som lagrer til databasen
- Etter innsending skjules feedback-skjemaet og det vises en "Takk for tilbakemeldingen"-melding
- State: `feedbackGiven` (null | "positive" | "negative"), `feedbackExpanded` (boolean), `correctType` (string), `feedbackComment` (string)

### Visuell plassering
Knappene plasseres til hoyre for konfidensgrad-prosenten, inline med "AI-konfidensgrad"-raden. Nar tommel ned trykkes, glir et kompakt skjema ut under progresjonslinjen.

## Tekniske detaljer

### Database-migrering
```sql
CREATE TABLE public.ai_classification_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid,
  file_name text NOT NULL,
  ai_suggested_type text NOT NULL,
  ai_confidence numeric NOT NULL,
  feedback text NOT NULL,
  correct_document_type text,
  user_comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_classification_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ai_classification_feedback"
  ON public.ai_classification_feedback FOR ALL USING (true) WITH CHECK (true);
```

### Komponent-endringer i UploadDocumentDialog.tsx
- Nye state-variabler for feedback-flow
- Ny `handleFeedback`-funksjon som inserter til `ai_classification_feedback`
- ThumbsUp/ThumbsDown-knapper ved konfidensgrad-indikatoren
- Betinget rendering av korreksjons-skjema under indikatoren ved negativ feedback
- Nar brukeren velger en riktig dokumenttype i feedback, oppdateres ogsa den valgte typen i hovedskjemaet automatisk (sa brukeren slipper a gjore det manuelt)

