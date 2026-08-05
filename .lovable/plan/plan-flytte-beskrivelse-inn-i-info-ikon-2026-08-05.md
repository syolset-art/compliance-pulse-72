# Plan: Flytte beskrivelse inn i info-ikon

## Mål
I `CustomerRecommendationsCard.tsx` skal hjelpeteksten under overskriften "Anbefalte produkter og tjenester" flyttes inn i et info-ikon som plasseres på samme linje som overskriften. Målet er en strammere visuell profil og mindre vertikalt plassforbruk.

## Endringsdetalj
- **Fil:** `src/components/msp/guidance/CustomerRecommendationsCard.tsx`
- **Nåværende:** Et `<p>`-element under `<h3>` viser: "Mynder-produkter og egne tjenester fra tjenestekatalogen som kan selges inn til denne kunden. Forslagene er utarbeidet av en KI-agent."
- **Ønsket:** Teksten skal vises i en tooltip knyttet til et `Info`-ikon plassert til høyre for eller i samme rad som overskriften.
- **Tiltak:**
  1. Fjern `<p>`-elementet med Sparkles-ikon og beskrivelse.
  2. Plasser et `Info`-ikon inline med `<h3>` (f.eks. i en flex-rad med `items-center gap-1.5`).
  3. Gjør om teksten til tooltip-innhold og behold betydningen uendret.
  4. Vurder om det eksisterende `Info`-ikonet lengre til høyre (med tooltip "Velg det du vil selge inn...") skal slås sammen med det nye, eller om det kan beholdes som en separat handlingstips. Forslag: slå sammen til ett info-ikon som viser begge setningene, for å unngå to like ikoner med overlappende betydning.
  5. Behold "Salgspotensial"-blokken og øvrig funksjonalitet uendret.

## Akseptansekriterier
- Overskriftsraden inneholder "Anbefalte produkter og tjenester" + info-ikon med tooltip.
- Beskrivelsesteksten fra `<p>`-elementet vises nå i tooltipen.
- Ingen duplisert info-ikon med nesten identisk innhold.
- Cardets høyde reduseres visuelt ved at beskrivelseslinjen fjernes.
- Build/typecheck består.
