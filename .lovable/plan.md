## Mål

Synlighetsstatusen til Trust Profile skal alltid være synlig i toppen av siden — ikke forsvinne etter at brukeren har bekreftet valget.

## Endringer

**1. `src/pages/TrustCenterProfile.tsx` — sidehode (rundt linje 915–953)**

- Plasser `VisibilitySelector` (pille-knapp) permanent ved siden av `<h1>Trust Profile</h1>`. Den vises alltid når profilen er aktivert (`isOwnProfile` + asset finnes), uansett om `visibility_confirmed_at` er satt.
- Eksisterende blå "Trust Profile er aktivert"-banner beholdes, men:
  - Vises kun den første gangen (inntil `visibility_confirmed_at` settes) som onboarding-bekreftelse.
  - Tekst justeres til "Bekreft synlighet" siden velgeren nå alltid finnes i headeren.
- Når banneret forsvinner, tar den permanente velgeren i headeren over rollen som statusindikator.

**2. Ingen endringer i `VisibilitySelector.tsx`** — komponenten skriver allerede `visibility_confirmed_at` ved valg, og pille-knappen viser gjeldende nivå med ikon + label.

**3. Den eksisterende velgeren inne i "Public URL"-kortet (linje 1258) beholdes som ekstra kontroll i Publiser-fanen.**

## Resultat

- Brukeren ser alltid valgt synlighet (Privat / Mynder-økosystem / Offentlig) som pille-knapp i sidehodet.
- Klikk på pillen åpner popoveren for å bytte nivå når som helst.
- Aktiveringsbanneret fungerer kun som engangs-bekreftelsesprompt, ikke som eneste sted å se status.
