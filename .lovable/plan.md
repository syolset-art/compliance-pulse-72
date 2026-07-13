## Mål

Regelverksmotoren skal skille mellom krav som **må** dokumenteres med opplastet bevis, og krav som kan oppfylles på andre måter (handling, prosess, bekreftelse i flaten, vurdering, eller ikke relevant). UI-en skal tydelig vise om dokumenttilknytning er obligatorisk eller valgfri.

## Datamodell — nytt felt på hvert krav

I `src/lib/complianceRequirementsData.ts` (og `additionalFrameworkRequirements.ts`) legges det til:

```ts
export type FulfillmentType =
  | 'document_required'   // Må ha opplastet bevis (sertifikat, DPA, rapport)
  | 'document_optional'   // Dokument styrker, men er ikke påkrevd
  | 'process_confirmation'// Oppfylles ved bekreftet prosess/rutine i plattformen
  | 'attestation'         // Egenerklæring / signert bekreftelse i UI
  | 'action'              // Utført handling (f.eks. aktivert MFA, gjennomført test)
  | 'assessment'          // Vurdering/DPIA/risikoanalyse registrert
  | 'not_applicable_allowed'; // Kan enkelt markeres N/A med begrunnelse

export interface ComplianceRequirement {
  ...
  fulfillment_type: FulfillmentType;
  evidence_mandatory: boolean;      // hovedflagget UI-et lener seg på
  allowed_evidence_kinds?: string[]; // ex: ['certification','policy','attestation']
}
```

`evidence_mandatory` er kilden UI-en bruker for "obligatorisk å tilknytte dokument". `fulfillment_type` gir Lara/UI mer kontekst for å foreslå riktig oppfyllelsesvei.

Default-mapping når feltet mangler (for eksisterende krav):
- `agent_capability='manual'` + kategori `governance/legal` → `document_required`
- `sla_category='governance'` og navn matcher "policy|retningslinje|erklæring|avtale|sertifisering" → `document_required`
- Handlingskrav (MFA, backup, logging, kryptering) → `action`, `evidence_mandatory=false`
- Vurderinger (DPIA, risikovurdering) → `assessment`, `evidence_mandatory=false` (kan lages i plattformen)
- Roller/ansvar/opplæring → `process_confirmation`
- Resten → `document_optional`

Denne mappingen legges som helper `inferFulfillment(req)` i `src/lib/requirementFulfillment.ts` slik at vi kan rulle ut per-krav-overstyring gradvis uten å måtte redigere alle 700+ oppføringer på én gang.

## UI-endringer

**1. `RequirementCard` / `FrameworkRequirementsList`** — ved siden av tittelen vises en liten pille:
- `evidence_mandatory=true` → rød/oransje pille "Dokumentasjon påkrevd"
- `evidence_mandatory=false` → nøytral pille som beskriver måten (`Bekreft prosess`, `Registrer handling`, `Vurdering`, `Egenerklæring`, `Dokument valgfritt`)

**2. `LaraDataSourceExplainer`** — forklaringstekst tilpasses `fulfillment_type`:
- `action`: "Dette kravet oppfylles ved å bekrefte at handlingen er utført — ingen dokumentopplasting nødvendig."
- `process_confirmation`: "Bekreft at prosessen er på plass i Mynder. Dokumentasjon er valgfritt."
- `attestation`: "Signer egenerklæring her — teller som bevis."
- `assessment`: "Fullfør vurderingen i modulen. Rapporten genereres automatisk."
- `document_required`: eksisterende tekst.

**3. Knappen "Tilknytt dokument"** (elementet brukeren pekte på):
- `evidence_mandatory=true` → primær knapp "Last opp bevis (påkrevd)"
- `evidence_mandatory=false` → sekundær knapp "Tilknytt dokument (valgfritt)" + primær CTA som matcher `fulfillment_type` ("Bekreft utført", "Registrer vurdering", "Signer egenerklæring", "Marker som ikke relevant")

**4. Status "Verifisert"-dialogen** — kobler validitetskrav bare når `evidence_mandatory=true`. Ellers spør vi ikke om ekstern verifikator.

**5. Scoring / dokumentmotor** — `useComplianceRequirements` og `scoringEngine` sjekker `evidence_mandatory` før de flagger "mangler bevis". Krav der `evidence_mandatory=false` kan bli `completed` uten fil.

## Filer som endres

- `src/lib/complianceRequirementsData.ts` — nye typer, felt gjøres valgfritt i interfacet.
- `src/lib/additionalFrameworkRequirements.ts` — samme interface.
- `src/lib/requirementFulfillment.ts` *(ny)* — `inferFulfillment`, konstante labels EN/NO, farger.
- `src/components/compliance/RequirementCard.tsx` — pille + tilpasset CTA.
- `src/components/regulations/FrameworkRequirementsList.tsx` — bruker CTA-varianten, skjuler dokument-modal når ikke relevant.
- `src/components/regulations/LaraDataSourceExplainer.tsx` — tekstvarianter per `fulfillment_type`.
- `src/lib/scoringEngine.ts` / `src/hooks/useComplianceRequirements.ts` — respekter `evidence_mandatory` i "har bevis"-sjekk.
- i18n-nøkler i `src/lib/i18n.ts` (NO/EN) for de nye pillene og CTA-tekstene.

Ingen databaseendringer — feltet er statisk metadata på krav.

## Åpne spørsmål

1. Skal vi eksponere manuell overstyring per krav (bruker kan si "vi vil ha dokument likevel")? Foreslår ja, lagres på `requirement_status.override_evidence_required`.
2. Skal N/A-krav telle utenfor score (som i dag) eller telle som oppfylt? Foreslår utenfor score, men vises som "Ikke relevant" med begrunnelse.
