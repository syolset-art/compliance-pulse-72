# Kritiske leverandører — ny seksjon i Trust Profile

Legg til en egen seksjon på Trust Profile som viser de mest kritiske leverandørene fra det vi allerede har kartlagt i aktiveringen (Third-party & supply chain).

## Hvor

`src/pages/TrustCenterProfile.tsx` — ny seksjon plassert rett etter "Kontaktinformasjon" og før "Sammendrag", i samme korthierarki som de andre seksjonene (rounded-xl border bg-card, med `MessageSquare`/`Building2`-ikon i header). Ny komponent: `src/components/trust-center/CriticalVendorsSection.tsx`.

## Datakilde

Henter fra eksisterende `assets`-tabell — ingen migrasjoner.

```ts
supabase
  .from("assets")
  .select("id, name, description, criticality, risk_level, compliance_score, vendor_category, country, data_categories")
  .eq("asset_type", "vendor")
```

Sortering/filtrering i klienten:
1. Kritikalitet (critical → high) først, via `getCriticality()` fra `src/lib/criticality.ts`.
2. Sekundært: avledet risiko via `getDerivedRisk()` fra `src/lib/derivedRisk.ts`.
3. Begrens til topp 5. "Vis alle (N)"-lenke til `/vendors` når det finnes flere.

Hvis ingen leverandører er kartlagt: vis tom-tilstand med CTA "Legg til leverandør" → `/vendors/new` (kun når `!readOnly`).

## UI

Hver rad (kompakt, samme stil som kontaktinformasjon-radene):

```text
[Bygning-ikon]  Leverandørnavn              Kritikalitet-pille (nøytral)
                Kategori · Land             Risiko-pille (status-farge + Lara-ikon)
```

- Leverandørnavn klikker til `/vendors/:id` når `!readOnly`; ren tekst i publisert visning.
- Kritikalitet bruker `criticalityLabel()` + nøytral pille (per Core memory: Kritikalitet = brukervalg, nøytral).
- Risiko bruker `bg-success`/`bg-warning`/`bg-destructive` per terskler i Core memory, med Lara-ikon + tooltip "Avledet av Mynder/Lara".
- Header: `Building2`-ikon, tittel "Kritiske leverandører" / "Critical vendors", liten undertittel "Tredjeparter med høyest kritikalitet for virksomheten" / "Third parties with highest criticality".
- Edit-knapp (kun `!readOnly`) → `/vendors`.

## Visning i delt/publisert Trust Profile

- I `readOnly`-modus: vis kun navn, kategori/land og en kort risiko-indikator (ingen interne kommentarer eller compliance_score-tall). Respekterer publiseringen som allerede styrer profilen.
- Skjul seksjonen helt hvis brukeren har valgt å ikke dele leverandørliste (sjekk eksisterende `tab visibility preferences`-mønster i `Trust Profile Tabs` — vi gjenbruker samme preference-nøkkel `vendors`).

## Lokalisering

i18next-nøkler i `src/locales/{nb,en}.json` under `trustProfile.criticalVendors.*`: `title`, `subtitle`, `empty`, `emptyCta`, `viewAll`, `riskTooltip`.

## Filer som endres / opprettes

- `src/components/trust-center/CriticalVendorsSection.tsx` — ny.
- `src/pages/TrustCenterProfile.tsx` — importer og monter komponenten etter Kontaktinformasjon-blokken (rundt linje 884), inkl. en `<div className="border-t border-border" />`-separator som andre seksjoner bruker.
- `src/locales/nb.json` + `src/locales/en.json` — nye nøkler.

Ingen database-, RLS- eller backend-endringer.
