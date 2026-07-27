# GAP-analyse for MSP-partner

Legg til en "Kjør GAP-analyse"-knapp øverst i kundelisten (`/msp-dashboard`) som åpner en 4-stegs veiviser: Regelverk → Kunder → Analyse → Rapport. Målet er å vise partneren hvilke gap kundene har, og hvilke av partnerens egne tjenester som kan dekke gapene – klart for tilbud.

## 1. Innstigning i kundelisten

Fil: `src/pages/MSPDashboard.tsx` (rundt linje 532-546, header-actions).

- Ny knapp `Kjør GAP-analyse` (variant `outline`, `ScanSearch`-ikon) plasseres til venstre for `Vis GAP-matrise` / `Legg til kunde`.
- Wrappes i `Tooltip`: "Se hvilke krav i valgte regelverk kundene mangler dekning for – og hvilke av dine tjenester som kan lukke gapene."
- Åpner ny `GapAnalysisWizardDialog` med `customers`-listen som prop.

## 2. Veiviser – ny komponent

Ny fil: `src/components/msp/GapAnalysisWizardDialog.tsx`. Bruker `Dialog` + intern `step`-state (`1..4`), samme visuelle stil som `AddMSPCustomerDialog` (sirkler + piler i header slik som bilde 2/3/4).

### Steg 1 – Regelverk
- Grid 2-kolonner med alle regelverk fra `frameworkDefinitions` (checkbox + navn + kort beskrivelse). Ingen valgt som default.
- `Neste` disabled til minst ett valgt.

### Steg 2 – Kunder (endring fra dagens flyt)
- Ingen forhåndsvalg. Toolbar øverst: `Velg alle` / `Fjern alle` + søkefelt.
- Liste med `Checkbox` per kunde (navn, bransje, TP-status). Teller "X av N valgt" nederst.
- `Neste` disabled til minst én valgt.

### Steg 3 – Analyse
- Sentrert `Kjør analyse`-knapp. Ved klikk: 2-3 sek simulert kjøring med `AnalyzingIndicator` som roterer korte statuslinjer:
  1. "Leser krav i valgte regelverk"
  2. "Matcher kundenes dokumentasjon mot krav"
  3. "Finner tjenester i din portefølje som kan dekke gap"
- Under kjøring: liten teller "N kunder · M krav · K tjenester matchet".
- Når ferdig → auto-videre til steg 4.

### Steg 4 – Rapport
- Oppsummering øverst: totalt antall gap, antall gap som matcher partnertjenester, estimert salgspotensial (bruk `formatPartnerCurrency` fra `MSPWidgetDetail.tsx` – flyttes til `src/lib/partnerCurrency.ts` for gjenbruk).
- Tabell/kort per kunde med: kunde, antall gap, top 2-3 foreslåtte tjenester (chips), estimert verdi.
- Foreslåtte tjenester hentes fra `SERVICE_LIBRARY` (`src/lib/serviceLibrary.ts`) via en enkel matcher (`matchServicesToGaps`) basert på kategori/regelverk – deterministisk demo-logikk.
- Bunn-actions: `Lukk` + primærknapp `Opprett tilbud` som åpner eksisterende tilbud-flyt (`ProposalWizardDialog` hvis finnes, ellers navigerer til `/msp-partner/sales-guide` med prefill i query-string – bekreft ved bygging).

## 3. Matcher-hjelper

Ny fil: `src/lib/gapServiceMatcher.ts`.

```ts
matchServicesToGaps(frameworkIds: string[], customer: Customer): {
  gapCount: number;
  services: { id: string; name: string; estimatedValue: number }[];
}
```

Prototype-logikk: fast mapping regelverk → tjenestenøkler (f.eks. GDPR → "Mynder Core", "Leverandørstyring"; NIS2 → "Pentest", "Backup"; ISO 27001 → "Mynder Core", "ISMS-drift"). Estimert verdi = `gapCount * avgPrice` per tjeneste.

## 4. Ingenting utover dette

- Ingen endring i database/edge-funksjoner – ren frontend-prototype.
- Beholder eksisterende `Vis GAP-matrise`-knapp og `BulkGapAnalysisDialog` uendret; ny veiviser lever ved siden av.
- Norsk tekst, kort og enkelt. Ingen nye avhengigheter.

## Tekniske detaljer

- Steg-header: gjenbrukbar liten `WizardSteps`-komponent inline i dialogen (sirkel med tall/checkmark + pil), matcher stilen i bilde 2-4.
- Analyseanimasjon: bruk mønsteret fra `AttachEvidenceDialog.tsx` (`AnalyzingIndicator` med `setInterval` og fade).
- Tooltip på hovedknappen bruker eksisterende `Tooltip`/`TooltipProvider` fra `@/components/ui/tooltip`.
