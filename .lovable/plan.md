## Mål

I MSP-kundens **Regelverk**-arkfane skal partneren se nøyaktig samme oppsett som kunden ser i sin portal (bilde 1), og bruke samme høyre-drawer for å aktivere/deaktivere regelverk (bilde 2) — med Mynder/Lara-anbefalinger på toppen. I tillegg trenger partneren å kunne kjøre **gap-analyser uten å aktivere** regelverket.

## Det som endres

### 1. Erstatt nåværende `MSPCustomerRegulationsTab` med kundeportal-layout

Speil strukturen fra `src/pages/Regulations.tsx` inn i tabben:

- **ActiveFrameworksSummary** — topp-kort: total %-modenhet, antall aktive, donut + kategoribar (Personvern / Sikkerhet / Øvrige). Identisk komponent.
- **FrameworkChipSelector** — chips for å velge aktivt regelverk (vises når summary er ekspandert).
- **FrameworkDetailCard** — valgt regelverk med Del / Eksporter PDF.
- **ComplianceHistoryChart** — historisk utvikling.
- **FrameworkRequirementsList** — krav og evaluatorer (Alle / Ikke oppfylt / Delvis / Oppfylt).

Header får knappen **"Endre regelverk"** som åpner drawer (i stedet for dagens inline-liste).

### 2. Bytt aktiverings-UX til samme høyre-drawer

Bruk `EditActiveFrameworksDialog` (Sheet). For MSP-konteksten utvides den med to ting:

- **"Anbefalt"-pille** per regelverk, drevet av eksisterende `computeRecommendations(customer)` fra dagens tab (bransje + ansatte → forslag). Tooltip viser begrunnelsen ("Obligatorisk bransjenorm for helsesektoren" etc.).
- **Toggle = bestilling**: switch på et inaktivt regelverk åpner `FrameworkOrderConfirmDialog` (dagens flyt — dokumentasjon eller partnerbekreftelse) før det faktisk aktiveres og faktureres.

Lagring fortsetter i samme `localStorage` (`msp.customer.activatedFrameworks.<id>`) for å beholde demo-data.

### 3. "Gap-analyse uten aktivering" (svar på partner-spørsmålet)

Nytt **Preview-modus** per regelverk i drawer-en, ved siden av aktiverings-toggelen:

```text
┌─────────────────────────────────────────────────────────┐
│ NIS2-direktivet                          [Bestill] ⚙   │
│ EUs direktiv om sikkerhet…              [👁 Forhåndsvis]│
└─────────────────────────────────────────────────────────┘
```

- **"Forhåndsvis gap-analyse"** åpner regelverket i kundens detalj-visning som en read-only sandbox: krav, status, anbefalinger og Lara-vurdering — men markert med banner *"Forhåndsvisning — ikke aktivert. Ingen fakturering, ikke synlig for kunden."*
- Resultatene lagres som en partner-intern `preview_assessments` (in-memory/localStorage i denne demoen) slik at partneren kan bruke gapet i tilbud, ROI og kampanjer.
- Fra preview-banneret finnes CTA **"Aktiver hos kunden"** som åpner samme bestillingsdialog.

Dette gir partneren mulighet til å selge inn et regelverk basert på et reelt estimert gap, uten å bruke kundens lisens/budsjett før kunden har sagt ja.

## Tekniske detaljer

**Filer som endres**
- `src/components/msp/MSPCustomerRegulationsTab.tsx` — full omskriving til kundeportal-layout (ActiveFrameworksSummary + FrameworkDetailCard + ComplianceHistoryChart + FrameworkRequirementsList + knapp som åpner drawer).
- `src/components/regulations/EditActiveFrameworksDialog.tsx` — utvide med valgfrie props: `recommendations?: Map<string,string>` (viser Anbefalt-pille + tooltip) og `previewMode?: { onPreview: (fw) => void }` (legger til "Forhåndsvis" sekundærknapp). Eksisterende kundeportal-bruk er upåvirket fordi propsene er valgfrie.
- `src/components/msp/MSPCustomerRegulationsTab.tsx` håndterer onToggle (åpner `FrameworkOrderConfirmDialog`) og onPreview (åpner ny `FrameworkPreviewSheet`).

**Nye filer**
- `src/components/msp/FrameworkPreviewSheet.tsx` — read-only gap-analyse for ett valgt regelverk, gjenbruker `FrameworkRequirementsList` med `readOnly`-flag og banner.

**Komponenter som gjenbrukes uendret**
- `ActiveFrameworksSummary`, `FrameworkChipSelector`, `FrameworkDetailCard`, `ComplianceHistoryChart`, `FrameworkRequirementsList`, `FrameworkOrderConfirmDialog`.

**Ingen DB-endringer.** Aktive regelverk og preview-vurderinger holdes i `localStorage` (demo-mønster).

## Det som ikke endres

- Kundens egen `/regulations`-side.
- Faktureringslogikken / `FrameworkOrderConfirmDialog`.
- Lara-anbefalingsmotoren (`computeRecommendations`).
