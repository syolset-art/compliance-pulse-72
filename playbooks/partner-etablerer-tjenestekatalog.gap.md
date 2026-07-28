# Gap-rapport: Partner etablerer og forvalter tjenestekatalog

**Rapportert:** 2026-07-28
**Playbook-versjon:** v0.2 ([Notion](https://app.notion.com/p/Partner-etablerer-og-forvalter-tjenestekatalog-3ab979e47191819dbf76c550904418c3))
**Spec-speil:** `playbooks/partner-etablerer-tjenestekatalog.md`
**Metode:** manuell kodelesning + statisk søk. Playwright-stubbene i
`e2e/partner-etablerer-tjenestekatalog.spec.ts` er `.skip` inntil AC-01…AC-13 kan
verifiseres automatisk.

## Sammendrag

| Bøtte | Antall AC |
| --- | --- |
| Dekket | 3 |
| Delvis | 5 |
| Mangler | 5 |
| Avviker (krever avgjørelse) | 3 (arkitektur, ikke AC) |

## Dekket

- **AC-02 – Normalisert tjenestekort.** `PartnerService` i `src/lib/serviceCatalog.ts:12`
  + `CustomServiceDialog` dekker navn, beskrivelse, aktiviteter, prising, leveransetype,
  rammeverksmapping.
- **AC-06 – Ingen kundedata kreves.** `/msp-service-catalog` (`src/pages/MSPServiceCatalog.tsx`)
  laster uten kundekontekst.
- **AC-07 – Ingen kundespesifikke gap i katalogflyten.** Kundegap ligger separert i
  `src/components/msp/GapAnalysisWizardDialog.tsx` og trigges kun fra kundekontekst.

## Delvis

- **AC-01 – Tre innganger.** Kuratert mal (`ServiceLibraryBrowser`) og «fra null»
  (`CustomServiceDialog`) finnes i `MSPServiceCatalogTab.tsx`. **Import mangler helt.**
- **AC-04 – AI-forslag enkeltvis.** `MSPLaraServiceWizard.tsx` foreslår tjenester,
  men mangler eksplisitt aksept/rediger/avvis per forslag med sporet vedtak +
  begrunnelse.
- **AC-05 – Mapping-metadata.** `ServiceFrameworkMapping` (`serviceCatalog.ts:1-4`)
  har kun `frameworkId`, `frameworkLabel`, `controlIds`. Mangler relasjonstype,
  begrunnelse, scope, kildeversjon, Confidence, godkjenningsstatus, godkjenner, dato.
- **AC-08 – Skille opprinnelse.** `ExtraService.source: "library" | "manual"` og
  `isMynder` finnes i `MSPServiceCatalogTab.tsx:29-38`, men vises ikke som
  klassifisering på tjenestekortet. «Foreslått av Lara» spores ikke som egen kategori.
- **AC-10 – Gjenbruk i skanner/gap/tilbud.** Katalogen brukes av
  `GapAnalysisWizardDialog` og `MSPCreateOfferDialog`. Mangler versjons-lås så
  tilbud husker hvilken tjenesteversjon det bygget på.

## Mangler

- **AC-03 – Aktiveringsgate.** `publishedToCustomers: boolean` (`serviceCatalog.ts:30`)
  er eneste kontroll. Ingen validering av at ≥1 kravkobling er godkjent.
- **AC-09 – Kapabilitetsvalidering.** Ingen kapabilitetsmodell på `PartnerService`.
  Forutsetninger (kompetanse, sertifisering, verktøy, kapasitet) mangler både i
  typen og i UI-et.
- **AC-11 – Versjonering + reversibilitet.** Ingen versjon/historikk på tjeneste
  eller mapping. Ingen «må vurderes»-status ved regelverksendring.
- **AC-12 – RBAC og tenant-isolasjon testet.** MSP Owner/Admin vs bidragsyter er
  ikke håndhevet i katalog-UI, og ingen automatisk test dekker det.
- **AC-13 – Persistert audit trail.** Katalogen holdes i minne/localStorage-lignende
  state — ingen logg over opprettet/importert/endret/godkjent/deaktivert med hvem,
  når, hvilken versjon.

Utover AC-listen mangler også:

- **Arkitekturprinsipp: felles Mynder-bibliotek + private partnerkataloger.**
  `SERVICE_LIBRARY` (`src/lib/serviceLibrary.ts`) er statisk import. Ingen versjonert
  forslags-flyt fra global mal til partnervariant, ingen «endring i global mal →
  versjonert forslag til partner».
- **Kravkobling som eget objekt.** Mapping er innebygd tekst-array (`controlIds: string[]`)
  på tjenesten. Playbook krever eget, versjonert objekt m/ mange-til-mange-relasjon.
- **KCP-forankring for AI-forslag.** `MSPLaraServiceWizard` returnerer ikke faktiske
  krav-/artikkel-ID-er fra en versjonert KCP-kilde med Confidence + kildeversjon.
- **Safety-guards.** Ingen sperre mot ordet «dekker», ingen tvunget standardformulering
  «støtter dette kravet», ingen stopp ved kildekonflikt.
- **Steering / fullmaktskart.** Aktiveringspunktene i UI mangler eksplisitte godkjenner-roller
  (tjenesteeier vs fagansvarlig vs MSP Owner) og «etterkontroll vs før aktivering»-logikk.
- **Feil-/unntaksflyt.** Ingen «må vurderes»-status, ingen håndtering av utløpt/erstattet
  kilde, ingen sperre mot aktivering uten kapasitet.

## Avviker (bevisste avgjørelser trengs)

- **Aktivering vs publisering.** Playbook: `Aktiv` ≠ synlig for kunder. Prototype:
  én boolean `publishedToCustomers`. Beslutning: enten splitte til
  `status: "draft" | "review" | "active" | "inactive"` + separat `visibleToCustomers`,
  eller endre Playbooken.
- **Prismodeller.** `priceModel: "hourly" | "per-user"` finnes i prototypen men er
  ikke nevnt i Playbookens tjenestekort. Sannsynligvis greit å beholde; noter i speilet.
- **`SERVICE_LIBRARY` som statisk TS-fil.** Ok for MVP, men strider mot «versjonert
  felles bibliotek». Marker som teknisk gjeld inntil biblioteket flyttes til backend.

## Anbefalt prioritering

1. Kravkobling som eget, versjonert objekt m/ relasjonstype + status + Confidence
   + kildeversjon. Løsner grunnlaget under AC-03, AC-05, AC-10, AC-11.
2. Status-modell `draft/review/active/inactive` + aktiveringsgate som krever
   ≥1 godkjent mapping. Dekker AC-03 og halvparten av AC-10.
3. Godkjenner-roller (tjenesteeier / fagansvarlig / MSP Owner) + persistert audit trail.
   Dekker AC-12 og AC-13.
4. Import-inngang (CSV/Excel + Lara-strukturering til utkast). Dekker resten av AC-01.
5. Versjonering av tjeneste og mapping + «må vurderes» ved kildeendring. Fullfører AC-11.
