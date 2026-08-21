# Ombygging av «Produkter og tjenester» (/msp-services)

## Mål
Partneren skal få én side som viser alt de kan selge — både Mynder-lisenser og rådgivningstimer — med samlet salgspotensial øverst. Regelverk kan aktiveres med en tilhørende rådgivningspakke (AI-foreslåtte timer per kontrollpunkt, med mulighet til å fjerne krav). Pakkene lagres slik at de kommer opp som ferdig forslag når partneren lager et tilbud hos en kunde.

## Sideoppbygging (ny layout for MSPServiceCatalog.tsx)

```text
┌──────────────────────────────────────────────────┐
│ Produkter og tjenester              [Innstillinger▾]│
│                                                  │
│ ┌─ Salgspotensial (samlet) ────────────────────┐ │
│ │ Totalt: XXX kr/mnd + YYY kr i timer           │ │
│ │ ├ Aktiverte produkter (lisenser)   XXX kr/mnd │ │
│ │ └ Rådgivningstimer (pakker)        YYY kr     │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Produkter fra Mynder (som under Min organisasjon)│
│ ├ Core            — fra 995 kr/mnd — provisjon   │
│ ├ Leverandørmodulen                              │
│ ├ Eiendeler                                      │
│ ├ Regelverk       — fast mnd + timer (se under)  │
│ ├ Avviksregister                                 │
│ └ Trust Center (v2)                              │
│                                                  │
│ Regelverk og rådgivningspakker                   │
│ ├ GDPR      Lisens: X kr/mnd · Timer: Y kr [Sett opp]│
│ ├ NIS2      ...                                  │
│ └ ISO 27001 ...                                  │
└──────────────────────────────────────────────────┘
```

### 1. Salgspotensial-kort (øverst) — ny komponent `PartnerSalesPotentialCard.tsx`
- Totalt samlet potensial, fordelt på to kolonner:
  - **Aktiverte produkter** — månedlig lisenspotensial basert på `MYNDER_PRODUCTS` (Core, Leverandørmodul, Eiendeler, Regelverk, Avviksregister, Trust Center) med priser fra `planConstants`.
  - **Rådgivningstimer** — sum av lagrede pakkers timer × timepris fra innstillinger (`useServiceDefaults`).
- Norsk tekst, samme kortstil som øvrige MSP-sider.

### 2. Produktliste — ny komponent `PartnerProductList.tsx`
- Lister alle produkter fra `MYNDER_PRODUCTS` i samme rekkefølge og med samme navn som under «Min organisasjon» (Subscriptions.tsx): Core, Leverandørmodulen, Eiendeler, Regelverk, Avviksregister, Trust Center.
- Per rad: navn, kort beskrivelse, pris (fra-beløp / fast mnd-pris), provisjonsprosent, og lisenspotensial.
- Regelverk-raden viser i tillegg antall aktiverte regelverk og peker ned til regelverksseksjonen.

### 3. Regelverk og rådgivningspakker — videreutvikle `MSPFrameworkHoursTab.tsx`
- Per regelverk-rad vises både **lisenspotensial** (fast mnd-pris) og **timepotensial** (pakke-pris), slik at partneren ser begge inntektsstrømmene.
- Klikk åpner eksisterende `MSPFrameworkTaskPackageSheet`, som utvides:
  - **Aktiver regelverk**-toggle øverst i sheetet (kobler til salgspotensialet).
  - Alle krav/kontrollpunkt listes med **AI-foreslåtte timer per kontrollpunkt** (merkes «Foreslått av Lara» med tooltip som forklarer at estimatet er beregnet fra kravets omfang — bruker eksisterende timeestimater, ingen ny AI-tjeneste i denne runden).
  - Brukeren kan **fjerne krav** fra pakken (finnes allerede som exclude-funksjon) og justere timer.
  - «Lagre pakke» lagrer til database (se under) i stedet for kun localStorage.

### 4. Persistens — ny tabell `msp_framework_packages`
Erstatter localStorage-lagringen i `frameworkTaskPackage.ts` slik at pakkene er tilgjengelige i tilbudsflyten:
- Kolonner: `id`, `company_id`, `framework_id`, `framework_name`, `tasks` (jsonb: label + timer per kontrollpunkt), `excluded_requirement_ids` (jsonb), `total_hours`, `total_price`, `created_at/updated_at`.
- GRANT + RLS: partner leser/skriver kun egne rader (samme mønster som `msp_billing_settings`). Migrasjon med GRANTs i samme fil.
- `loadPackageState`/`savePackageState` erstattes av en ny hook `useFrameworkPackages` (localStorage beholdes som fallback under migrering).

### 5. Tilbudsintegrasjon — `MSPCreateOfferDialog.tsx`
- Når partneren står hos en kunde og legger et regelverk (f.eks. GDPR) inn i et tilbud, hentes den lagrede pakken automatisk opp som standard: totalpris, timer og kravlisten slik den ble satt på «Produkter og tjenester».
- Partneren kan fortsatt justere i tilbudet, men trenger ikke bygge pakken på nytt.

## Berørte filer
| Fil | Endring |
|---|---|
| `src/pages/MSPServiceCatalog.tsx` | Ny layout: potensial-kort + produktliste + regelverksseksjon. Beholder Innstillinger/Hvordan virker det-sheets |
| `src/components/msp/PartnerSalesPotentialCard.tsx` | Ny — samlet salgspotensial øverst |
| `src/components/msp/PartnerProductList.tsx` | Ny — produktliste fra `MYNDER_PRODUCTS` |
| `src/components/msp/MSPFrameworkHoursTab.tsx` | Lisens + timepotensial per rad, kobling til lagrede pakker |
| `src/components/msp/MSPFrameworkTaskPackageSheet.tsx` | «Foreslått av Lara»-merking, aktiver-toggle, lagring til DB |
| `src/lib/frameworkTaskPackage.ts` | Koble til ny hook/DB i stedet for kun localStorage |
| `src/hooks/useFrameworkPackages.ts` | Ny — lese/lagre pakker fra Supabase |
| `src/components/msp/MSPCreateOfferDialog.tsx` | Hent lagret pakke som standard når regelverk legges i tilbud |
| `supabase/migrations/...` | Ny tabell `msp_framework_packages` med GRANT + RLS |

## Tekniske detaljer
- Priser/provisjon fra eksisterende `planConstants` og `mynderProducts` — ingen nye priser fabrikkeres.
- Timeestimater: gjenbruker eksisterende per-krav-estimater i `frameworkTaskPackage.ts`, presentert som AI-forslag fra Lara. Ingen ny edge-funksjon i denne runden.
- Norsk UI-tekst, shadcn/ui, samme kortstil som øvrige MSP-sider.
- `MSPServiceCatalogTab.tsx` (nå tom wrapper) fjernes/erstattes av den nye strukturen.
