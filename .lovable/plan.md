# Gap-analyse mot Playbook v0.2

**Kilde:** Playbook «Partner etablerer og forvalter tjenestekatalog» v0.2 (Notion, 28. juli 2026)
**Målt mot:** `src/lib/serviceCatalog.ts`, `src/lib/serviceLibrary.ts`, `src/pages/MSPServiceCatalog.tsx`, `src/components/msp/MSPServiceCatalogTab.tsx`, `ServiceForm.tsx`, `CustomServiceDialog.tsx`, `ServiceLibraryBrowser.tsx`, `MSPLaraServiceWizard.tsx`.

Ingen kodeendringer er gjort — dette er kun rapport + forslag til arbeidsform.

## Verdiforslag: hvordan holde UI og Playbook i sync

1. **Spec-speil i repo.** Én kort markdown per Playbook under `playbooks/<slug>.md` som lister *akseptansekriterier med ID* (AC-01, AC-02 …) og *UI-anker* (rute + `data-testid`). Notion forblir kilden til *hvorfor*; spec-speilet er maskin-lesbart *hva*.
2. **Playwright per AC.** `e2e/<slug>.spec.ts` med én `test()` per AC-ID. CI feiler når en AC mangler test eller en test er rød.
3. **Automatisk gap-rapport.** `scripts/playbook-check.ts` genererer `playbooks/<slug>.gap.md` (Dekket / Delvis / Mangler / Avviker) fra test-resultater + statisk kodesøk.
4. **Notion-lenke i spec-speilet.** Én lenke tilbake til Playbooken; ved endring i Playbook oppdateres spec-speilet i samme PR — CI blokkerer PR uten oppdatert spec når kode berører merkede filer.

## Gap-rapport for denne Playbooken

Nummerering følger «Akseptansekriterier for produktet» (linje 409–422 i Playbook).

### Dekket

- **AC-01 – Tre innganger** *(delvis dekket, se «Delvis»)*: kuratert mal og opprett fra null finnes i `MSPServiceCatalogTab.tsx` (`ServiceLibraryBrowser`, `CustomServiceDialog`).
- **AC-02 – Normalisert tjenestekort**: `PartnerService` i `serviceCatalog.ts` + `CustomServiceDialog` dekker navn, beskrivelse, aktiviteter, prising, leveransetype, mapping til rammeverk.
- **AC-06 – Ingen kundedata kreves**: katalogsiden `/msp-service-catalog` bygger uten kundekontekst.
- **AC-07 – Ingen kundespesifikke gap**: kundespesifikk gap-analyse ligger i egen flyt (`GapAnalysisWizardDialog`), ikke i katalogen.

### Delvis

- **AC-01 – Import**: «Importer eksisterende katalog» (dokument/nettside/regneark) finnes **ikke** som inngang; kun mal + manuelt.
- **AC-04 – AI-forslag godkjennes/redigeres/avvises enkeltvis**: `MSPLaraServiceWizard` foreslår tjenester i bulk, men mangler eksplisitt aksept/rediger/avvis per forslag med sporet vedtak.
- **AC-05 – Mapping viser relasjonstype, begrunnelse, scope, kildeversjon, status**: `ServiceFrameworkMapping` har bare `frameworkId`, `frameworkLabel`, `controlIds`. Mangler alle øvrige felt Playbooken krever (relasjonstype direkte/muliggjørende/dokumenterende/vurderende, begrunnelse, scope, kildeversjon, Confidence, godkjenningsstatus, godkjenner, dato).
- **AC-08 – Skille eksisterende / foreslått / Mynder-støttet**: `ExtraService.source: "library" | "manual"` og `isMynder` finnes, men er ikke synlig som klassifisering på tjenestekortet, og «foreslått av Lara» spores ikke som egen opprinnelse.
- **AC-10 – Gjenbruk i skanner/gap/tilbud**: katalogen brukes av `GapAnalysisWizardDialog` og `MSPCreateOfferDialog`, men mangler versjons-lås («hvilken versjon av tjenesten et tilbud bygget på»).

### Mangler

- **AC-03 – Minst én godkjent kravkobling før aktivering**: ingen aktiveringsgate. `publishedToCustomers` er en boolean uten validering av at mapping finnes/er godkjent.
- **AC-09 – Nødvendige kapabiliteter før aktivering av ny tjenestemulighet**: ingen kapabilitetsmodell på `PartnerService`; forutsetninger fra Playbookens tjenestekort (kompetanse, sertifisering, verktøy, kapasitet) mangler helt.
- **AC-11 – Versjonert, søkbart, reversibelt**: ingen versjons-/historikk-modell på tjeneste eller mapping. Ingen «må vurderes» ved regelverksendring.
- **AC-12 – RBAC og tenant-isolasjon testet**: MSP Owner/Admin-skille er ikke håndhevet i katalog-UI; ingen test dekker det.
- **AC-13 – Lagring, feiltilstander og audit trail verifisert**: katalog holdes i minne/localStorage-lignende state — ingen persistert audit trail (opprettet/importert/endret/godkjent/deaktivert av hvem, når, hvilken versjon).
- **Arkitekturprinsipp – felles Mynder-bibliotek + private partnerkataloger**: `SERVICE_LIBRARY` er statisk import i klienten. Ingen versjonert forslags-flyt fra global mal til partnervariant, ingen «endring i global mal → versjonert forslag til partner».
- **Kravkobling som eget objekt**: mapping er innebygd tekst-array (`controlIds: string[]`) på tjenesten. Playbook krever eget, versjonert objekt m/ mange-til-mange-relasjon og full metadata.
- **KCP-forankring for AI-forslag**: `MSPLaraServiceWizard` returnerer ikke faktiske krav-/artikkel-ID-er fra en versjonert KCP-kilde med Confidence + kildeversjon; forslagene er tekstbaserte tjenester, ikke validerbare mappings.
- **Safety-guards**: ingen sperre mot ordet «dekker», ingen tvunget standardformulering «støtter dette kravet», ingen stopp ved kildekonflikt.
- **Steering-tabell / fullmaktskart**: aktiveringspunktene i UI mangler eksplisitte godkjenner-roller (tjenesteeier vs fagansvarlig vs MSP Owner) og «etterkontroll vs før aktivering»-logikk.
- **Feil-, usikkerhets- og unntaksflyt**: ingen «må vurderes»-status, ingen håndtering av utløpt/erstattet kilde, ingen sperre mot aktivering uten kapasitet.
- **Evidence/audit trail**: ingen logg over hva som er importert, foreslått av AI, godkjent, endret eller avvist, med Playbook- og katalogversjon.

### Avviker (bevisst avgjørelse trengs)

- **Aktivering vs publisering.** Playbook: `Aktiv`-status ≠ synlig for kunder. Prototype: én boolean `publishedToCustomers`. Beslutning: enten splitte til `status: "draft" | "review" | "active" | "inactive"` + separat `visibleToCustomers`, eller endre Playbooken.
- **`priceModel: "hourly" | "per-user"`** finnes i prototypen men er ikke nevnt i Playbookens tjenestekort. Sannsynligvis greit å beholde; noter i spec-speilet.
- **`SERVICE_LIBRARY` som statisk TS-fil.** Ok for MVP, men strider mot «versjonert felles bibliotek». Marker som teknisk gjeld.

## Foreslått pilot-leveranse (neste steg, kun spec — ingen kodeendringer)

```text
playbooks/
  partner-etablerer-tjenestekatalog.md      ← spec-speil (AC-01…AC-13, UI-anker)
  partner-etablerer-tjenestekatalog.gap.md  ← denne gap-rapporten, versjonert
e2e/
  partner-etablerer-tjenestekatalog.spec.ts ← stub-tester per AC, .skip inntil implementert
```

Etter piloten bruker vi det som fungerte for å skrive `playbooks/_template.md` og `scripts/playbook-check.ts`, og ruller ut samme mønster på resten av Playbookene.

## Anbefalt prioritering for utvikling (basert på Mangler)

1. Kravkobling som eget, versjonert objekt m/ relasjonstype + status + Confidence + kildeversjon (fjerner grunnlaget under flere andre AC).
2. Status-modell `draft/review/active/inactive` + aktiveringsgate som krever ≥1 godkjent mapping.
3. Godkjenner-roller (tjenesteeier / fagansvarlig / MSP Owner) og persistert audit trail.
4. Import-inngang (dokument/regneark) — enkleste vei: CSV/Excel med Lara-strukturering til utkast.
5. Versjonering av tjeneste og mapping + «må vurderes» ved kildeendring.

## Neste steg

Vil du at jeg oppretter `playbooks/partner-etablerer-tjenestekatalog.md` (spec-speil) + `.gap.md` (denne rapporten) + Playwright-stub som filer i repoet? Da har du malen konkret å reagere på før vi standardiserer resten.
