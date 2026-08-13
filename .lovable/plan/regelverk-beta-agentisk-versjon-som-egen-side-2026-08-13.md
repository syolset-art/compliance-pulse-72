# Regelverk (Beta): agentisk versjon som egen side

Dagens regelverk-side beholdes uendret. Den agentiske versjonen bygges som en **egen beta-side** på `/regulations-beta`, slik at du i demo kan vise den tradisjonelle siden først og deretter bytte til beta og vise hvordan en agentisk versjon introduseres.

Dagens side er et klassisk SaaS-dashbord: tittel + "Endre regelverk", sammendragsboks med prosentbar, filterknapper (Alle / Kategori / Land), chip-velger, detaljkort, historikkgraf og kravliste. Brukeren må selv finne ut hva neste steg er. Beta-siden åpner i stedet med Laras vurdering og forslag til handling.

## Bytte mellom versjonene

- Diskret bryter øverst til høyre på begge sidene: **Klassisk | Beta**. Klikk bytter rute og husker valget (localStorage), så demoen starter der du sluttet.
- Beta-siden har en liten "Beta"-merking ved tittelen med hover-tekst om at dette er en ny agentisk visning under utprøving.
- Ingenting fjernes fra den klassiske siden — den er fortsatt standard.

## Slik ser beta-siden ut

```text
┌──────────────────────────────────────────────┐
│ Regelverk  [Beta]            [Klassisk|Beta] │
├──────────────────────────────────────────────┤
│ Lara-linje: "Jeg har gått gjennom 7 regelverk│
│ 12 krav er bekreftet automatisk,             │
│ 3 venter på din godkjenning."   [Se gjennom] │
├──────────────────────────────────────────────┤
│ Laras arbeidskø (maks 3 kort)                │
│ • Godkjenn bevis – GDPR art. 30   [Åpne]     │
│ • Bekreft status – NIS2 §12       [Åpne]     │
│ • Mangler grunnlag – ISO 27001    [Åpne]     │
├──────────────────────────────────────────────┤
│ Dine regelverk (rolige rader, ikke chips)    │
│ GDPR      68 %  ▓▓▓▓▓░░  Lara følger 4 krav  │
│ NIS2      41 %  ▓▓░░░░░  Venter på deg: 6    │
├──────────────────────────────────────────────┤
│ Detalj for valgt regelverk (kravlisten)      │
└──────────────────────────────────────────────┘
```

## Innhold på beta-siden

1. **Agentisk topplinje** — erstatter tittelrad + prosent-sammendrag. Viser hva Lara har gjort siden sist (krav analysert, bekreftet, hva som venter), i første person og kort. Statusprosent som diskret talllinje, ikke stor progress-boks. "Endre regelverk" ligger i en diskret meny.

2. **Laras arbeidskø** — maks tre kort: godkjenn bevis, bekreft foreslått status, manglende grunnlag. Ett primærvalg per kort som åpner eksisterende dialoger. Tom kø = rolig "alt er i orden"-linje.

3. **Rolig regelverksliste i stedet for chips + filterknapper** — rader med navn, modenhet og kort agent-status ("Lara følger opp 4 krav" / "6 venter på deg"). Kategori- og landfiltre samles i én diskret filterknapp som først vises ved mange regelverk.

4. **Historikkgrafen dempes** — sammenleggbar seksjon ("Hva har skjedd") inne i detaljvisningen.

5. **Språk** — agent-språk i stedet for dashbord-språk: "Lara holder oversikt over regelverkene dine. Her er det hun trenger deg til."

6. **Bevegelse** — samme diskrete stagger-inn-animasjon som på leverandørdashbordet.

Kravlisten (`FrameworkRequirementsList`) gjenbrukes uendret, så begge sidene viser samme krav og samme status.

## Teknisk

- Ny side `src/pages/RegulationsBeta.tsx` og rute `/regulations-beta` i `src/App.tsx`. `src/pages/Regulations.tsx` endres kun med bryteren.
- Nye presentasjonskomponenter under `src/components/regulations/`: `LaraRegulationsHeader.tsx` (topplinje), `RegulationsWorkQueue.tsx` (arbeidskø), `FrameworkOverviewList.tsx` (rolig liste) og `RegulationsViewSwitch.tsx` (Klassisk/Beta-bryter med localStorage).
- Køelementer utledes deterministisk fra eksisterende data: `getRequirementsByFramework` / `ALL_ADDITIONAL_REQUIREMENTS`, `agentConfirmedRequirementIds` og `demoUiStateFor` — samme kilder som kravlisten, så tallene stemmer overens. Mønster for korttyper hentes fra `src/lib/laraWorkQueue.ts`.
- Rammeverksdata hentes fra samme `selected_frameworks`-spørring som i dag; ingen nye tabeller eller backend-endringer.
- Animasjon via `staggerEntranceClass` i `src/lib/animation.ts`. Alle farger via eksisterende semantiske tokens.
