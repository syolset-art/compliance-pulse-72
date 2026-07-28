# Spec-speil: Partner etablerer og forvalter tjenestekatalog

> **Kilde (kanonisk):** [Notion Playbook v0.2](https://app.notion.com/p/Partner-etablerer-og-forvalter-tjenestekatalog-3ab979e47191819dbf76c550904418c3)
> **Playbook-versjon speilet:** v0.2 (28. juli 2026)
> **Produktområde:** Partner Workspace
> **Eier:** Daniella (produkt), Vilde (fag), Sue Janne (kommersiell), Synnøve (produktlead)

Denne filen er maskin-lesbart *hva*. Notion eier *hvorfor*. Ved konflikt vinner Notion —
oppdater dette speilet i samme PR som endrer Playbooken eller berører merket kode.

## UI-anker

| Rute | Skjerm | data-testid (foreslått) |
| --- | --- | --- |
| `/msp-service-catalog` | Katalog-oversikt | `service-catalog-root` |
| `/msp-service-catalog` (tab: `catalog`) | Tjenestekort-liste | `service-card-list` |
| `/msp-service-catalog` (tab: `settings`) | Innstillinger | `service-settings` |
| `/msp-service-catalog` (tab: `how-it-works`) | Forklaring av flyt | `service-how-it-works` |
| Katalog → «Legg til» | Inngangsvalg | `service-add-entry` |
| Katalog → «Legg til» → Import | Filimport | `service-add-import` |
| Katalog → «Legg til» → Mal | Mal-bibliotek | `service-add-template` |
| Katalog → «Legg til» → Fra null | Skjema | `service-add-blank` |
| Tjenestekort | Detaljvisning | `service-card-{id}` |
| Tjenestekort → Kravkoblinger | Mapping-liste | `service-mappings-{id}` |
| Kravkobling → godkjenn/avvis | Aksjonsknapper | `mapping-approve-{id}`, `mapping-reject-{id}` |
| Aktiver tjeneste | Aktiveringsknapp | `service-activate-{id}` |
| Lara-forslag i wizard | Forslagsliste | `lara-suggestion-{id}` |

`data-testid`-verdier er kontrakten mellom Playwright-testene og UI-et.
Endring krever samtidig oppdatering av `e2e/partner-etablerer-tjenestekatalog.spec.ts`.

## Kildefiler i prototypen

- `src/pages/MSPServiceCatalog.tsx`
- `src/components/msp/MSPServiceCatalogTab.tsx`
- `src/components/msp/CustomServiceDialog.tsx`
- `src/components/msp/ServiceLibraryBrowser.tsx`
- `src/components/msp/ServiceForm.tsx`
- `src/components/msp/MSPLaraServiceWizard.tsx`
- `src/lib/serviceCatalog.ts`
- `src/lib/serviceLibrary.ts`

## Akseptansekriterier

Direkte speilet fra Playbookens seksjon «Akseptansekriterier for produktet».
Én ID per krav — brukes av Playwright-testene og gap-rapporten.

| ID | Kriterium | Test-status |
| --- | --- | --- |
| AC-01 | Partner kan importere, velge mal eller opprette tjeneste fra null | delvis (import mangler) |
| AC-02 | Partner kan se og redigere ett normalisert tjenestekort | dekket |
| AC-03 | Alle aktive tjenester har minst én godkjent kobling til konkret krav, artikkel eller kontrollpunkt | mangler |
| AC-04 | AI-forslag kan godkjennes, redigeres og avvises enkeltvis | delvis |
| AC-05 | Hver mapping viser relasjonstype, begrunnelse, scope, kildeversjon og status | delvis (kun `controlIds` finnes) |
| AC-06 | Ingen kundedata kreves for å bygge katalogen | dekket |
| AC-07 | Systemet viser ikke kundespesifikke gap i katalogflyten | dekket |
| AC-08 | Partner kan skille eksisterende, foreslåtte og Mynder-støttede tjenester | delvis |
| AC-09 | En ny tjenestemulighet viser nødvendige kapabiliteter før partneren kan aktivere den | mangler |
| AC-10 | Aktiv katalog kan gjenbrukes direkte i tjenesteskanner, gap-analyse og tilbud | delvis (mangler versjons-lås) |
| AC-11 | Endringer er versjonerte, søkbare og reversible | mangler |
| AC-12 | RBAC og tenant-isolasjon er testet | mangler |
| AC-13 | Lagring, feiltilstander og audit trail er verifisert — ikke bare UI | mangler |

Gap-detaljer, avvik og prioritering: se `partner-etablerer-tjenestekatalog.gap.md`.

## Datamodell-touchpoints (fra Playbook)

**Tjenestekort:** navn, beskrivelse, status (`draft`/`review`/`active`/`inactive`),
opprinnelse (`existing`/`suggested`/`mynder_supported`/`third_party`), tjenesteeier,
tjenestetype (`one_off`/`recurring`/`advisory`/`subscription`), målgruppe, forutsetninger
(kompetanse, sertifisering, verktøy, kapasitet), scope + utenfor scope, aktiviteter,
leveranse og bevis, frekvens/varighet/SLA, prislogikk, Mynder-avhengighet (`core`/`vendor`/`none`),
kravkoblinger, versjon og gyldighet.

**Kravkobling (eget objekt, versjonert, mange-til-mange):** tjeneste-ID + versjon,
regelverk/standard, konkret krav/artikkel/kontrollpunkt, kildeversjon + gyldighet,
relasjonstype (`direct`/`enabling`/`documenting`/`assessing`), begrunnelse, avgrenset
scope, forventet leveranse/bevis, opprinnelse (`curated`/`ai_suggested`/`manual`),
Confidence + grunnlag, status (`proposed`/`approved`/`rejected`/`needs_review`),
navngitt godkjenner + dato, historikk, berørte katalog-/tilbudsversjoner.

## Safety-guards som må håndheves i UI/kopi

- Standardformulering: «støtter dette kravet». Ordet «dekker» bare med tydelig scope.
- Aldri «garanti for etterlevelse / sertifisering / risikofrihet».
- Aktivering blokkeres når kilde er utløpt, erstattet eller i konflikt.
- Aktivering blokkeres når nødvendige kapabiliteter mangler.
- Kundespesifikke gap skal ikke genereres i katalogflyten.

## Endringslogg for speilet

- 2026-07-28: opprettet fra Playbook v0.2. Ingen kodeendringer utført.
