## Endring

I Lara-innboksen på leverandørprofilen heter knappen i dag "Godkjenn". Det er misvisende, fordi handlingen faktisk starter Laras analyse av dokumentet — først etterpå ser brukeren resultatet og hva som påvirker leverandørskoren.

## Hva som endres

Fil: `src/components/asset-profile/tabs/LaraInboxTab.tsx`

1. **Knappen i listen over inbox-elementer** (linje 250-253):
   - Tekst: "Godkjenn" → "Start analyse"
   - Ikon: `CheckCircle2` → `Sparkles` (signaliserer AI-handling)

2. **Knappen i forhåndsvisnings-modalen** (linje 420-422):
   - Tekst: "Godkjenn og koble til" → "Start analyse"
   - Ikon: `CheckCircle2` → `Sparkles`

3. **Hjelpeteksten i modal-footeren** (linje 413-415):
   - Fra: "Godkjenn for å koble dokumentet til {assetName}"
   - Til: "Start analyse for å la Lara vurdere hvordan dokumentet påvirker leverandørprofilen til {assetName}"

"Avvis"-knappen og selve `approveMutation`-logikken er uendret — kun ordlyden på CTA-en justeres.

## Ikke endret

- Ordlyden i `VendorEvidenceTab` / `VendorDocumentsTab` ("Godkjenn for å berike leverandørprofilen…") er beskrivende informasjonstekst, ikke en knapp, og beholdes som den er.
- Status-badgene "Godkjent" andre steder beholdes — det refererer til endelig status etter analyse.
