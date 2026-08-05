# Legg til regelverk, standard eller retningslinje manuelt

Partneren skal kunne overstyre KI-anbefalingen i kortet «Lovpålagte regelverk basert på data om kunden» — på samme måte som «Legg til tjeneste eller produkt» fungerer i kortet for anbefalte produkter og tjenester.

## Slik blir det

- Under regelverkspillene kommer en diskré lenke: «+ Legg til regelverk, standard eller retningslinje».
- Lenken åpner et søkefelt (samme dialogtype som for tjenester/produkter), med tre grupper:
  - **Regelverk** (lovpålagt): GDPR, NIS2, DORA, Åpenhetsloven, EU AI Act, CRA
  - **Standarder**: ISO 27001 og øvrige standarder i katalogen
  - **Retningslinjer / rammeverk**: f.eks. NSM grunnprinsipper — bransjeanbefalinger uten egen lisenspris
- Hvert treff viser månedspris der den finnes (eller «Inkludert» for gratis regelverk), og markeres som «Aktivert» / «Allerede i listen» når det gjelder.
- Er ikke regelverket i katalogen, kan partneren legge inn et eget navn («Bruk "…"») som en egendefinert retningslinje.
- Valgte elementer legger seg som piller i kortet, merket «Manuelt valgt» med et X for å fjerne dem igjen. Manuelle valg påvirker ikke KI-anbefalingen.
- Klikk på en manuelt lagt pille aktiverer den direkte via den eksisterende vilkårsdialogen (samme flyt som anbefalte regelverk), eller den kan tas med i tilbud via «Lag tilbud i stedet».

## Teknisk

- `src/lib/offerSuggestions.ts`: ny `MANUAL_FRAMEWORKS`-liste (id, label, kategori: regelverk/standard/retningslinje, pris fra `FRAMEWORK_ADDONS` / `EXTRA_FRAMEWORK_PRICE_KR`) og `buildManualFrameworkSuggestion(id | fritekst)` som returnerer en `OfferSuggestion` med `kind: "framework"`, `frameworkId` og `activatable: true` (egendefinerte: `activatable: false`).
- Ny komponent `src/components/msp/guidance/AddFrameworkDialog.tsx` etter mønster fra `AddOfferItemDialog.tsx` (CommandDialog, grupper, disabled for aktiverte/allerede lagt til, fritekstvalg).
- `CustomerFrameworkRecommendationsCard.tsx`: lokal `manual`-state, render manuelle piller sammen med `suggestions`, X-knapp for fjerning, «Legg til»-lenke, og send manuelle elementer med i `onActivate` / `onOffer`.
- Ingen backend- eller skjemaendringer; manuelle valg lever i komponent-state, som i produkt-/tjenestekortet i dag.
