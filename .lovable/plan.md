
## Mål
I «Veiledning fra Mynder» skal partneren kunne:
1. Skrive inn en tjeneste og se hvilke av **denne kundens** anbefalte/aktiverte regelverk den treffer.
2. Laste opp dokumentasjon (bevis) de allerede har, og få det koblet til ett eller flere av kundens regelverk.

## 1) Tjenestesøk mot kundens regelverk
- Ny komponent `CustomerServiceCoverageSearch` (i `src/components/msp/guidance/`) basert på `ServiceCoverageSearch`, men:
  - Filtrerer alle treff mot `customerFrameworkIds` (union av `recommended_frameworks` + `activeFrameworkIds`).
  - Hvis en tjeneste ikke treffer noen av kundens regelverk → vis subtil melding «Ingen treff mot kundens regelverk» + evt. hvilke andre regelverk den ellers dekker.
  - Fjerner «Opprett»-CTA i denne konteksten — kun visning, siden formålet er relevanssjekk for kunden.
- Plasseres i `MSPCustomerDetail.tsx` (guidance-tab) rett over `RegulationsStatusCard`, i et smalt kort med tittel «Sjekk en tjeneste mot kundens regelverk» og kort AI-disclaimer via eksisterende `AiMappingDisclosure` (icon-variant).

## 2) Last opp bevis fra regelverkstabellen
- Utvid `RegulationsStatusCard` med en ny handling per rad: knapp «Last opp bevis» (subtil, `Upload`-ikon) i «Handling»-kolonnen ved siden av eksisterende Bekreft/Aktiver/Se i Produkter.
- Åpner eksisterende `PartnerEvidenceUploadDialog` (fra `src/lib/partnerEvidence.ts`) med regelverket forhåndsvalgt (nytt prop `presetFrameworkIds`).
- Over tabellen: én samlet «Last opp bevis»-knapp som åpner samme dialog uten forhåndsvalg (bruker kan krysse av flere regelverk).
- Under tabellen: kompakt liste over allerede opplastede bevis for kunden (gjenbruk `PartnerEvidenceSection` med `minimal` og `hideUploadButton`), slik at partneren ser koblingen mellom bevis og regelverk uten å bytte fane.

## Tekniske detaljer
- `PartnerEvidenceUploadDialog` må ta imot valgfri `presetFrameworkIds: string[]` og forhåndsvelge disse i skjemaet (påvirker ikke lagring ellers).
- Ingen DB-endringer — `partnerEvidence` er allerede lokal demo-store.
- Ingen endring i modenhetsvisning eller baseline-kort.
- Norsk tekst, kort og subtilt design i tråd med resten av guidance-fanen.

## Filer som endres/opprettes
- Ny: `src/components/msp/guidance/CustomerServiceCoverageSearch.tsx`
- Endre: `src/components/msp/guidance/RegulationsStatusCard.tsx` (opplastningsknapper + evidence-liste)
- Endre: `src/components/msp/PartnerEvidenceUploadDialog.tsx` (støtte `presetFrameworkIds`)
- Endre: `src/pages/MSPCustomerDetail.tsx` (montér søkekortet i guidance-tab)
