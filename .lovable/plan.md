## Mål

Speile «Produkter fra Mynder» i partnerens tjenestekatalog mot det som ligger på Produkter-siden, slik at partneren ser hvilke nivåer kundene kan velge, hva som ligger i hvert produkt, og hva partneren tjener på hvert nivå.

## Hva som endres

**Fil:** `src/components/msp/MSPServiceCatalogTab.tsx` — kun seksjonen «Produkter fra Mynder» (linje ~1113–1188). Ingen datamodell-endringer.

### Ny visning: kort per produkt i stedet for én flat tabell

Erstatt dagens 3-rads tabell med ett kort per produkt (Mynder Core, Leverandørmodulen, Assets). Hvert kort:

- **Header (alltid synlig):**
  - Produktnavn + kort tagline (fra `MODULE_INFO.tagline`)
  - Startpris «Fra {laveste betalte tier} kr/mnd»
  - Provisjons-badge («30 % provisjon» / «25 % provisjon»)
  - Etableringsgebyr-felt (behold `SetupFeeCell` som i dag)
  - Chevron for å utvide

- **Utvidet innhold (klikk for å åpne, kollapset som standard):**
  1. **Kort beskrivelse** — `MODULE_INFO.description`
  2. **Hva kunden får** — 3–5 første punkter fra `MODULE_INFO.features`
  3. **Nivåer kunden kan velge** — mini-tabell som viser alle tiers:
     - Mynder Core: alle 4 nivåer fra `CORE_TIERS` (10/20/50/100 systemer, pris, din andel)
     - Leverandørmodulen: alle 4 nivåer fra `VENDOR_TIERS` (5 gratis, 20/50/100, pris, din andel — gratis-nivået merkes «Inkludert, ingen provisjon»)
     - Assets: enkelt nivå (495 kr) — vises som én rad
  4. Fotnote med mva/tax fra `formatTaxNote(branding.tax)`

### Layout

```text
┌─ Mynder Core ──────────── Fra 995 kr/mnd · 30 % ─── [Etablering ▢] ── ⌄ ┐
│ Grunnmodulen i plattformen                                              │
│  (utvidet:)                                                             │
│   Beskrivelse …                                                         │
│   • Oppgavestyring   • Avvikshåndtering   • RoPA   • Dokumentbibliotek  │
│                                                                         │
│   Nivåer kunden kan velge                                               │
│   Inntil 10 systemer      995 kr/mnd    din andel  299 kr               │
│   Inntil 20 systemer    1 499 kr/mnd    din andel  450 kr               │
│   Inntil 50 systemer    2 499 kr/mnd    din andel  750 kr               │
│   Inntil 100 systemer   4 999 kr/mnd    din andel 1 500 kr              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Beholdes

- Kollapsbar ytre seksjon «Produkter fra Mynder (3)» — uendret.
- Provisjonssatser: Core 30 %, Vendors 30 %, Assets 25 %.
- Etableringsgebyr (`SetupFeeCell`) per produkt.
- Valuta-håndtering via `currencyOption` og eksisterende `fmt`.
- Mva/tax-fotnote via `formatTaxNote(branding.tax)`.

### Fjernes

- Dagens flate tabell med kolonnene Produkt / Lisens/mnd / Din andel / Etablering.
- «Abonnementer du kan selge videre.»-teksten (implisitt i konteksten nå).

## Tekniske detaljer

- Ny lokal state: `expandedProduct: string | null` for å styre hvilket kort som er åpent (én om gangen, som accordion — matcher mønsteret i `MSPServiceSettingsTab`).
- Import `MODULE_INFO` fra `@/lib/moduleInfo`; mapping: `core → MODULE_INFO.core`, `vendors → MODULE_INFO.vendors`, `assets → MODULE_INFO.assets`.
- Import `CORE_TIERS`, `VENDOR_TIERS` (allerede importert) og bruk direkte for nivå-listene.
- «Din andel» per tier = `tier.monthlyPriceKr * commissionPct / 100`, formatert med samme `fmt`.
- Gratis-tier på Vendor: vis «Gratis · ingen provisjon» i «din andel»-kolonnen i stedet for 0.
- Ingen endringer i database, oversettelser eller andre komponenter.

## Utenfor scope

- Ingen endring på selve Produkter-siden (`src/pages/Subscriptions.tsx`).
- Ingen ny provisjonslogikk eller nye tiers — kun visning av eksisterende data.
- Ingen endring i «Min tjenestekatalog»-seksjonen over.