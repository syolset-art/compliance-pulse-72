# Kryssmapping av kontrollpunkter i tilbud

Et kontrollpunkt treffer ofte flere regelverk samtidig (f.eks. NIS2 Art.21 ≈ ISO A.8.8 ≈ GDPR Art.32). I dag vises kontrollpunkter kun under sitt eget regelverk i tilbudet, så partneren/kunden ser ikke at samme tiltak også dekker andre krav. Vi legger til en lett kryssreferanse-indikator — UI-only, ingen endring i datamodell eller logikk.

## Hva som endres

**1. Ny kryssmapping-tabell (`src/lib/controlCrosswalk.ts`)**
- Statisk demo-mapping fra `(frameworkId, controlId)` → liste over relaterte `(frameworkId, controlId)` i andre regelverk.
- Helper `getRelatedControls(frameworkId, controlId)` returnerer relaterte punkter (tom liste hvis ingen).
- Dekker de mest brukte kryssene fra `serviceControlLabels.ts`:
  - NIS2 Art.21 ↔ ISO A.8.8, A.8.7, A.5.24; GDPR Art.32
  - NIS2 Art.23 ↔ ISO A.5.24, A.5.26; GDPR Art.33
  - NIS2 Art.20 ↔ ISO A.5.1, A.6.3
  - ISO A.8.13 ↔ NIS2 Art.21; DORA Art.5
  - GDPR Art.28 ↔ NIS2 Art.21; DORA Art.28
  - AI Act Art.9 ↔ ISO A.8.8; NIS2 Art.21
  - (+ ~10 til av de vanligste)

**2. `MSPCreateOfferDialog.tsx` — kontrollpunkt-listen (edit + preview)**
- Etter `— {getControlLabel(...)}` på hver `<li>`: hvis `getRelatedControls()` returnerer ≥1 treff, vis en liten rad med chips på linjen under:
  - Liten ikon (`Link2` fra lucide) + tekst "Også:" i `text-muted-foreground text-[11px]`
  - Én chip pr relatert regelverk, brukt `getFrameworkTheme(fw).chip` (samme styling som eksisterende framework-pills), med format `NIS2 Art.21`.
  - Maks 3 chips synlig, resten som `+N`.
- Tooltip på chip viser `getControlLabel` for det relaterte punktet.

**3. PDF-eksport (`handleDownloadPdf`)**
- Under hver kontrollpunkt-linje, hvis relaterte finnes, skriv en innrykket linje: `   Også: NIS2 Art.21, ISO A.8.8` (maks 3, "+N flere" hvis mer). Bruk eksisterende `doc.splitTextToSize` + sidebrudd-håndtering.

## Hva som IKKE endres

- Ingen endring i `serviceCatalog.ts`, `frameworkMappings`, eller `coveredControls`-strukturen.
- Ingen ny scoring/gap-logikk.
- `ServiceTableRow`, `ServiceCard`, `RegulationGapAnalysisCard` rører vi ikke i denne omgangen — kryssreferansen vises kun i tilbudet (der kunden ser kontrollpunktene).

## Filer som endres

- `src/lib/controlCrosswalk.ts` (ny)
- `src/components/msp/MSPCreateOfferDialog.tsx` (edit-view, preview-view, PDF)
