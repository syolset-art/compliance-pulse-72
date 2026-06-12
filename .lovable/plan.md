## Problem

På publisert Trust Profile (`/trust-engine/profile/:assetId`, dvs. `readOnly`-grenen i `src/pages/TrustCenterProfile.tsx` rundt linje 933) vises seksjonen "Modenhet per kontrollområde" som en enkel liste over verifiserte kontroller — uten %-bar, uten modenhetsfarge (Høy/Middels/Lav) og uten expand-detaljer.

Preview-versjonen (samme fil, rundt linje 2132) viser den riktige varianten:
- Modenhetslabel ("Høy" / "Middels" / "Lav") med fargetone (`scoreTone`)
- Progress bar i samme farge
- Klikkbart kort som expander til en liste over verifiserte kontroller med verifiseringskilde
- Bruker `AREA_DEMO_FLOOR` for å gi realistisk spredning på demo-data

## Endring

I `src/pages/TrustCenterProfile.tsx`, i `readOnly`-renderen (linje 933–983), bytt ut hele `<section id="tc-section-maturity">` med den samme strukturen som preview-grenen (linje 2132–2227):

- Behold `id="tc-section-maturity"` (brukes av anker-nav i `PublicTrustCenterLayout`).
- Bruk `evaluation?.areaScore(area)` + `AREA_DEMO_FLOOR` + `scoreTone` / `scoreLabel`.
- Behold expand/collapse via eksisterende `expandedArea` state (allerede definert lenger opp i komponenten — verifiseres før edit; hvis ikke tilgjengelig i denne grenen, legg til en lokal `useState`).
- Behold den eksisterende "Verifisert / Dokumentert"-merkingen per kontroll når kortet er åpent.

Ingen andre seksjoner endres. Ingen logikk/data-endringer — kun presentasjon på den publiserte siden så den matcher preview.

## Filer

- `src/pages/TrustCenterProfile.tsx` — erstatt maturity-seksjonen i `readOnly`-grenen.
