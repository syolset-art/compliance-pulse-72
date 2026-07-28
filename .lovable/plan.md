
## Mål
Legg til mva/tax-innstillinger i partnerens Innstillinger, slik at tilbud enten viser priser "eks. mva/tax" eller inkluderer den i totalen. Terminologi tilpasses partnerens språk (NO: "mva", EN: "VAT/Sales tax").

## Endringer

### 1. Ny state i `usePartnerBranding` (utvides eller nytt hook)
Utvid `PartnerBrandingOverrides` + `PartnerBranding` med:
- `taxEnabled: boolean` (default true — vis mva-info i tilbud)
- `taxRate: number` (default 25 for NO, 0 ellers)
- `taxLabel: string` (default "mva" for nb, "VAT" for en)
- `taxMode: "exclusive" | "inclusive"` (default `exclusive` — priser vises eks. og noteres "Alle priser er eks. mva")

Lagres i samme localStorage-nøkkel som eksisterende branding.

### 2. Ny seksjon i `MSPPartnerSettings.tsx`
Kort "Mva / Tax" (under branding-kortet) med:
- Toggle: "Vis mva/tax i tilbud"
- Input: sats (%) med hurtigvalg (0, 12, 15, 20, 25)
- Etikett-felt (auto-forslag basert på språk)
- Radio: "Eksklusiv (priser vises uten mva, legges til i totalen)" / "Inklusiv (priser inkluderer mva)"
- Liten preview-linje som viser hvordan det vil stå i tilbud: f.eks. "Alle priser er eks. mva (25%)".

### 3. Bruk i tilbud (`MSPCreateOfferDialog.tsx`) og katalog
- `MSPServiceCatalogTab.tsx` linje 744: erstatt hardkodet "Alle priser er eks. mva." med dynamisk tekst fra branding.
- `MSPCreateOfferDialog.tsx`: 
  - Vis mva-linje i summeringen: "Sum eks. mva", "Mva (25%)", "Totalt inkl. mva" når `taxEnabled && taxMode==="exclusive"`.
  - Ved `inclusive`: vis "Totalt (inkl. mva 25%)" som eneste sum.
  - Ved `taxEnabled=false`: ingen mva-linje.
- Samme formatering brukes i eventuell PDF/tilbudsutskrift.

### 4. Språktilpasning
Bruk `i18next` språkvalg for defaults:
- `nb` → "mva", 25%, exclusive
- `en` → "VAT", 0%, exclusive
Bruker kan overstyre.

## Filer som endres
- `src/hooks/usePartnerBranding.ts` — utvide interface + defaults
- `src/pages/MSPPartnerSettings.tsx` — nytt "Mva / Tax"-kort
- `src/components/msp/MSPServiceCatalogTab.tsx` — dynamisk mva-tekst
- `src/components/msp/MSPCreateOfferDialog.tsx` — mva-summering i tilbud
- `src/locales/nb.json` + `en.json` — nye tekster

## Utenfor scope
- Landsspesifikke mva-regler per kunde (bare partnerens standard)
- Reverse charge / eksport-regler
