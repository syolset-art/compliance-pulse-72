## Mål
Gjøre det tydelig for partneren at valgt valuta påvirker hvilken skatt/avgift som er naturlig å legge til i tilbud — f.eks. at NOK typisk betyr 25% mva, SEK 25% moms, DKK 25% moms, EUR varierer per EU-land, GBP 20% VAT, USD sales tax pr. delstat.

## Endringer

### 1. `src/lib/partnerTax.ts`
Legg til et lite oppslag `CURRENCY_TAX_HINT` (ren data, ingen logikk-endring):
```
NOK → { label: "mva", rate: 25, note: "Standard mva i Norge" }
SEK → { label: "moms", rate: 25, note: "Standard moms i Sverige" }
DKK → { label: "moms", rate: 25, note: "Standard moms i Danmark" }
EUR → { label: "VAT", rate: null, note: "VAT varierer per EU-land (17–27%)" }
GBP → { label: "VAT", rate: 20, note: "Standard VAT i Storbritannia" }
USD → { label: "Sales tax", rate: null, note: "Sales tax varierer per delstat" }
```
Eksporter en helper `getCurrencyTaxHint(code)` som returnerer hint eller `null`.

### 2. `src/components/msp/PartnerTaxCard.tsx`
- Les `currency` fra `useServiceDefaults`.
- Legg til en informasjons-blokk øverst i kortet (under introteksten, over Switch-raden):
  - Diskret `Info`-ikon + kort tekst: «Valgt valuta er **{currency}**. {hint.note}. Endre valuta under Standard timepris.»
  - Hvis hint har rate: liten «Bruk {rate}%»-knapp som setter `draft.label` og `draft.rate` (og aktiverer switch hvis av).
  - Hvis hint mangler (EUR/USD): kun forklarende tekst, ingen quick-apply.
- Oppdater intro-teksten kort: nevn at valuta styrer hvilken avgift som er relevant.
- Ingen andre endringer i lagre-flyt eller datamodell.

### 3. Ingen andre filer berøres
Katalog og tilbudsdialog bruker fortsatt `formatTaxNote(draft)` uendret.

## Resultat
Når partneren står i mva/tax-innstillingene, ser de umiddelbart hvilken valuta som er valgt og hvilken avgift som er normal for det markedet, med ett klikk for å bruke standardsatsen.
