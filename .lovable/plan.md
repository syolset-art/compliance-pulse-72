

## Plan: Komplett prismodell med Gratis-nivå, månedlig/årlig toggle, og regelverk-tillegg

### Sammendrag

Bygge en fullstendig prismodell som tydelig viser hva som er gratis, hva som koster, og lar kunden velge mellom månedlig og årlig fakturering. Regelverk prises som årlige tillegg.

### Prisstruktur

```text
PLATTFORM (systemer + leverandører)
──────────────────────────────────────────────────────
Plan          Systemer  Leverandører  Mnd       Årlig (2 mnd gratis)
Gratis        ≤5        ≤5            0 kr      0 kr
Basis         ≤20       ≤20           1 490 kr  14 900 kr
Premium       ≤70       ≤70           2 490 kr  24 900 kr
Enterprise    >70       >70           Kontakt   Kontakt

INKLUDERT I ALLE PLANER (gratis)
──────────────────────────────────────────────────────
- Trust Center (alle undermenyer)
- GDPR regelverk
- ISO 27001 regelverk

REGELVERK-TILLEGG (årlig pris)
──────────────────────────────────────────────────────
Regelverk       Årspris     Inkluderer
NIS2            50 000 kr   Gap-analyse, tiltaksliste, modenhet, rapport
DORA            50 000 kr   Gap-analyse, tiltaksliste, modenhet, rapport
Åpenhetsloven   50 000 kr   Gap-analyse, tiltaksliste, modenhet, rapport
EU AI Act       50 000 kr   Gap-analyse, tiltaksliste, modenhet, rapport
CRA             50 000 kr   Gap-analyse, tiltaksliste, modenhet, rapport
```

### Implementering

**1. Ny fil `src/lib/planConstants.ts`**
- Definere alle plantier med mnd/årlig priser
- Definere `FRAMEWORK_ADDON_PRICES` med årlige priser per regelverk (NIS2, DORA, Åpenhetsloven, AI Act, CRA = 50 000 kr/år)
- Definere `FREE_FRAMEWORKS = ['gdpr', 'iso27001']`
- Hjelpefunksjoner: `getPrice(tier, interval)`, `getAnnualSavings(tier)`, `formatKr()`
- Liste over hva som er gratis: Trust Center, 5 systemer, 5 leverandører, GDPR, ISO 27001

**2. DB-migrasjon: `subscription_plans`**
- Legge til `price_yearly` kolonne (integer, nullable)
- Oppdatere planer: starter→free (0), professional→basis (149000 mnd / 1490000 årlig), enterprise→premium (249000 mnd / 2490000 årlig)
- Legge til ny premium-rad

**3. DB-migrasjon: `company_subscriptions`**
- Legge til `billing_interval` kolonne (text, default 'monthly')

**4. Oppdatere `DOMAIN_ADDON_PRICES` i `useSubscription.ts`**
- Erstatte eksisterende domenepriser med de nye regelverk-tilleggsprisene
- NIS2, DORA, Åpenhetsloven, AI Act, CRA = 5 000 000 øre (50 000 kr/år)
- GDPR og ISO 27001 = 0 (gratis, inkludert)
- Eksponere `billingInterval` fra subscription

**5. Oppdatere `SystemActivateDialog.tsx`**
- Legge til månedlig/årlig toggle øverst
- Vise priser dynamisk basert på valgt intervall
- Vise "Spar 2 mnd"-badge ved årlig
- Legge til seksjon som viser hva som er gratis (Trust Center, GDPR, ISO 27001)

**6. Oppdatere `VendorActivateDialog` tilsvarende**
- Samme toggle og prisvisning som SystemActivateDialog
- Endre MAX_FREE_VENDORS fra 3 til 5

**7. Oppdatere `DomainActivationWizard` og `LockedDomainCard`**
- Vise årlig pris for regelverk-tillegg (f.eks. "50 000 kr/år")
- Tydeliggjøre hva som er inkludert: gap-analyse, tiltaksliste, modenhetsvurdering, rapportdeling

**8. Oppdatere Faktura-siden (`MSPInvoices.tsx`)**
- Vise gjeldende plan med faktureringsintervall
- Vise aktive regelverk-tillegg med årlig pris
- Vise samlet kostnad

### Tekniske detaljer

- Regelverk-priser lagres som årlige priser (i øre) i `planConstants.ts` og brukes konsekvent i UI
- `useSubscription` utvides med `billingInterval`, `getFrameworkPrice(frameworkId)`, og `isFrameworkFree(frameworkId)`
- Alle prisvisninger bruker sentral `formatKr()`-funksjon
- Eksisterende `DOMAIN_ADDON_PRICES` refaktoreres til `FRAMEWORK_ADDON_PRICES` med årlige priser

### Filer som endres/opprettes
- `src/lib/planConstants.ts` (ny)
- `src/hooks/useSubscription.ts`
- `src/components/systems/SystemActivateDialog.tsx`
- `src/components/vendor-dashboard/VendorActivateDialog.tsx`
- `src/components/regulations/DomainActivationWizard.tsx`
- `src/components/iso-readiness/LockedDomainCard.tsx`
- `src/pages/MSPInvoices.tsx`
- `src/pages/VendorDashboard.tsx` (MAX_FREE_VENDORS → 5)
- 2 DB-migrasjoner (price_yearly + billing_interval)

