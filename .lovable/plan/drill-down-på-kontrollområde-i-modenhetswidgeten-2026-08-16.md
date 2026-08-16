# Drill-down på kontrollområde i modenhetswidgeten

## Problem

I «Modenhet per kontrollområde» (dashbord v2) går klikk på et område rett til `/reports/compliance`. Brukeren ser aldri hvilke krav som faktisk er oppfylt i området, og heller ikke hvilke sertifikater og policyer som dekker området.

## Hva som bygges

Klikk på et kontrollområde åpner et sidepanel (Sheet) for det området, med to faner:

**1. Kontroller** — alle krav som hører til området (via `sla_category` → kanonisk område).
- Gruppert/filtrert på kravkategori: **Organisasjon**, **Teknisk sikkerhet**, **Fysisk sikkerhet**, **Folk og internt** (pill-filtre + «Alle»).
- Hvert krav vises kompakt: statusikon (oppfylt / pågår / ikke påbegynt), navn, artikkel-/kravnummer og regelverk.
- Statusfilter: «Oppfylt» / «Gjenstår», slik at brukeren raskt ser hva som er oppfylt.
- Toppen av panelet viser områdets score, antall oppfylt/totalt og modenhetsnivå.

**2. Ressurser** — dokumentasjon brukeren har bekreftet: sertifikater og policyer (samt DPA/rapporter) fra Dokument hub, filtrert til dette kontrollområdet.
- Hver rad: dokumenttype-ikon, navn, type-etikett, kildemodul og status (gyldig / utløper / utløpt).
- Lenke «Se alle dokumenter» til Dokument hub, forhåndsfiltrert.
- Tom tilstand med CTA når området mangler dokumentasjon.

Bunnlinje i panelet: knapp til regelverksvisningen for videre arbeid med kravene i området.

## Plassering i riktig kontrollområde

- **Krav:** `toCanonicalArea(req.sla_category)` fra `src/lib/controlAreas.ts` (allerede kanonisk kilde).
- **Kravkategori → visningsgruppe:** `organizational`/`governance`/`legal` → Organisasjon, `technological` → Teknisk sikkerhet, `physical` → Fysisk sikkerhet, `people` → Folk og internt.
- **Dokumenter → kontrollområde:** ny mapping fra dokumenttype/typegruppe til område, f.eks. ISO 27001-sertifikat og driftsrapporter → Drift og sikkerhet, DPA/personvernerklæring → Personvern og datahåndtering, styrings- og ledelsespolicyer → Styring og ansvar, tilgangs-/MFA-policy → Identitet og tilgang, leverandøravtaler og leverandørdokumenter → Tredjepart og verdikjede. Dokumenter uten treff havner under Styring og ansvar.

## Teknisk

- Ny komponent `src/components/dashboard-v2/ControlAreaDetailSheet.tsx` (Sheet, faner Kontroller/Ressurser).
- Ny helper `src/lib/controlAreaMapping.ts`: `requirementCategoryGroup()` og `documentControlArea()` (+ etiketter NB/EN).
- `AggregatedMaturityWidget.tsx`: erstatt `navigate("/reports/compliance")` i både mobil- og desktoplisten med `setOpenArea(pillar.key)` og render sheet-en; naviger videre først fra knappen i sheet-en.
- Data: `useComplianceRequirements()` for krav (allerede i widgeten) og `useDocumentHub()` for ressurser.
- Ingen databaseendringer.
