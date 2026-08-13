# Plan: Subtil "rull-ut"-animasjon på vendors-siden

## Mål
Når vendors-siden lastes inn skal den føles mer levende, uten å bli leketøyaktig. Elementene skal komme til syne i en dempet, sekvensiell fade-up, basert på retningen "Elegant staggered entrance".

## Visuell retning
- Header + tittel først.
- Deretter filter/tabs.
- Så innholdskort / tabellrad for rad med økende forsinkelse.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (Mynder-variabelen), varighet ca. 0,5–0,7 s.
- Opacity: 0 → 1, translateY: 12 px → 0.
- Ingen animasjon på hver eneste mikro-element; bare større seksjoner og listerader.
- Respekter `prefers-reduced-motion`.

## Hva som skal endres

### 1. Tailwind / animasjonstokens
- Legg til en ny keyframe i `tailwind.config.ts` for staggered fade-up (for eksempel `fade-in-up`).
- Legg til nye utility-klasser for forsinkelsessteg (f.eks. `delay-[0ms]`, `delay-100`, `delay-150`, `delay-200`, `delay-250`, `delay-300`, `delay-350`).
- Sikre at animasjonen starter med `opacity: 0` og slutter med `opacity: 1` (bruk `animation-fill-mode: forwards` via Tailwind sin `animate-*`).

### 2. `src/pages/VendorDashboard.tsx`
- Pakk hovedseksjonene i klasser for staggered reveal:
  - Header (tittel + antall + knapp).
  - `VendorPremiumBanner`.
  - `TabsList`-linjen.
- Bruk `animate-fade-in-up` + `delay-*` på disse tre nivåene.

### 3. `src/components/vendor-dashboard/VendorOverviewTab.tsx`
- Legg animasjon på hver "store" gruppe/kort:
  - `DashboardLaraRecommendation`.
  - Hvert kort i de to grid-rekkene (`ComplianceActivityChart`, `SystemsPriorityChart`, risikofordeling, geografi, GDPR, land, etc.).
- Staggered delays slik at innholdet fyller seg opp fra toppen og ned.
- Tom-tilstand får en egen, svakere animasjon.

### 4. `src/components/vendor-dashboard/VendorListTab.tsx`
- Toolbar (søk, filter, visningsknapper) får en animasjonsklasse.
- Tabell-/kortresultater får staggered animasjon:
  - I tabellmodus: rad for rad (via `VendorTableView`).
  - I kortmodus: `VendorStatusRow` for `VendorStatusRow`.
- Tomt resultat får en enkel fade-in.

### 5. `src/components/vendor-dashboard/VendorTableView.tsx`
- Hver `<tr>` får `animate-fade-in-up` + delay basert på indeks (modulo 6–7, slik at det ikke blir for lang ventetid på mange rader).
- Alternativt bruke enkel CSS nth-child om det er en ren `<table>`.

## Tekniske detaljer
- Animajsonene skal kun løpe ved mount (ingen loop).
- Bruk Tailwind-klasser, ikke inline styles eller custom CSS-fil.
- Hold tilbake på nye animasjoner på knapper, ikoner eller små piller – kun seksjoner og lister.
- Ingen endring av datahenting, filtre, tabelldata eller funksjonalitet.
- Behold i18n og a11y (ARIA-merking, alt-tekster, focus-states).

```text
Sekvens ved lasting:

0.0 s  Header (tittel + antall + Legg til)
0.1 s  VendorPremiumBanner
0.15 s Tabs-liste
0.2 s  Første innholdsgruppe (overview / toolbar)
0.25 s Neste gruppe
0.3 s  Listerader / kort starter (0.05 s forskyvning per rad)
...
```
