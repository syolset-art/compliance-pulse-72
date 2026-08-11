# Juster tittel og inndeling i regelverksanbefalinger

## Bakgrunn
Kortet `CustomerFrameworkRecommendationsCard` viser i dag overskriften «Lovpålagte regelverk basert på data om kunden». Dette er både langt og begrensende, siden kortet også skal romme standarder, retningslinjer og rammeverk som partneren legger til manuelt. Brukeren har bedt om en klarere skillelinje mellom det KI-agenten vurderer som lovpålagt og det den anbefaler.

## Slik blir det
- Hovedtittel endres til **«Regelverk, standarder og retningslinjer»** (kort og inkluderende).
- Under overskriften vises en kort hjelpetekst: «Lovpålagte er automatisk vurdert av Lara. Du kan legge til egne standarder og retningslinjer.»
- Forslagene deles i to grupper med små seksjonsoverskrifter:
  - **Lovpålagte** – regelverk fra `recommendFrameworks` med `confidence === "high"` (f.eks. GDPR, NIS2 i kritisk infrastruktur).
  - **Anbefalte** – regelverk/standarder/retningslinjer med `confidence === "medium"` pluss manuelt valgte.
- Lovpålagte piller får en subtil grønn tone (samme visuale nivå som «Gjelder for kunden» i `CustomerRecommendationsPanel`), mens anbefalte beholdes i dagens `recommend`-farge.
- Hver pille beholder sin nåværende funksjon: klikk for aktivering, manuelt-merking, og X for fjerning.
- «+ Legg til regelverk, standard eller retningslinje»-lenken beholdes nederst.
- `Initiell KI-vurdering`-badge beholdes, men tekstforklaringen kortes ned.

## Teknisk
- `src/lib/offerSuggestions.ts`: utvid `OfferSuggestion` med valgfri `confidence?: "high" | "medium"`. I `deriveOfferSuggestions` / `deriveFrameworkSuggestions` settes `confidence` basert på `customer.recommended_frameworks` (når de lagres som objekter) eller fallback med `recommendFrameworks`.
- `src/components/msp/guidance/CustomerFrameworkRecommendationsCard.tsx`:
  - Ta i bruk `useTranslation`.
  - Bytt tittel og undertekst til nye i18n-nøkler.
  - Splitt `suggestions` i `mandatory` og `recommended` og render hver gruppe med egen overskrift.
  - Sørg for at manuelt valgte elementer havner under **Anbefalte**.
- `src/locales/nb.json` og `src/locales/en.json`: legg til nøkler under `customerFrameworkRecommendations` (title, subtitle, mandatory, recommended, addButton).
- Ingen backend- eller skjemaendringer; kortet fortsetter å leve på komponent-tilstand og `customer`-objektet.

## Akseptkriterier
- Tittelen er kort og ikke lenger begrenset til «lovpålagte».
- Det er visuelt tydelig hvilke regelverk som er «lovpålagte» (high) og hvilke som er «anbefalte» (medium/manuell).
- Manuell tillegging og aktivering fungerer som før.
