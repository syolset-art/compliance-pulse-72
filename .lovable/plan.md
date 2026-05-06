# Agentisk "Registrer aktivitet"

Erstatt dagens skjemabaserte dialog (`RegisterActivityDialog.tsx`) med en Lara-først flyt der brukeren primært velger blant proaktive forslag, og kun fyller ut detaljer hvis hun vil avvike.

## Mål

- Brukeren slipper å tenke på type, nivå, tema, kritikalitet og status — Lara foreslår.
- Færre klikk: typisk registrering = 2 klikk (velg forslag → bekreft).
- Manuell registrering finnes fortsatt, men er sekundær.
- Ingen kobling til gap/Trust Score-impact (holder dialogen ren).

## Ny flyt (3 steg, samme dialog)

```
┌─────────────────────────────────────────────┐
│ Steg 1 — Velg utgangspunkt                  │
│                                             │
│ ✦ Lara foreslår (3-5 kort, prioritert)     │
│   ─ Kort viser: tittel, hvorfor, type-ikon, │
│     kritikalitet, nivå, tema som chips      │
│                                             │
│ — eller —                                   │
│                                             │
│ ✎ Skriv egen aktivitet (link nederst)       │
└─────────────────────────────────────────────┘
            ↓ (velger forslag)
┌─────────────────────────────────────────────┐
│ Steg 2 — Bekreft og juster (kompakt)        │
│                                             │
│ Sammendrag som chips (alt redigerbart):     │
│ [E-post] [Operasjonelt] [DPA] [Høy] [Åpen]  │
│ [📅 06.05.2026]                             │
│                                             │
│ Tittel: ________________________            │
│ Beskrivelse / e-post-utkast: __________     │
│                                             │
│ (Hvis e-post: knapp "Bytt mal ▾" + last opp)│
└─────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────┐
│ [Bekreft og registrer →]                    │
└─────────────────────────────────────────────┘
```

Klikk på en chip → liten popover med alternativer (samme som dagens pills, bare flyttet til popover for å spare plass).

## Lara-forslagene (steg 1)

Forslagene genereres fra eksisterende kilder — ingen ny backend-logikk:

- `LARA_EMAIL_SUGGESTIONS` (allerede brukt i dagens dialog)
- `vendorGuidanceData` → `SuggestedActivity` (allerede støttet via `prefillFromGuidance`)
- Åpne aktiviteter med forfall (avledet status)

Hvert forslag er forhåndsutfylt: type, nivå, tema, kritikalitet, status, tittel, beskrivelse. Brukeren kan bekrefte direkte eller justere i steg 2.

Hvis ingen forslag finnes (tom state): vis kun "Skriv egen aktivitet" som primær CTA, så flyten degraderes pent.

## "Skriv egen aktivitet"-modus

Samme steg 2-skjema, men chips starter tomme/nøytrale. Lara viser et lite hint over tittelfeltet: *"Skriv tittelen — Lara fyller resten basert på det du skriver"* (ingen ny LLM-kall i denne iterasjonen, bare heuristikk på nøkkelord til type/tema som vi allerede har).

## Hva forsvinner

- Stort 4-kolonners type-grid → flyttes til chip-popover
- 3-kolonners nivå-pills → chip
- Tema-row med 7 piller → chip
- Eget Lara-panel + mal-select + opplastingsknapp som separate seksjoner → samles
- Stor kalender-knapp → liten dato-chip
- Stegteller "Steg 1 av 2 — Fyll ut" øverst → erstattes av ny flyt-indikator

## Hva beholdes

- `VendorActivity`-typen og `onSubmit`-kontrakten (ingen breaking change for `AssetTrustProfile`, `AssetMetrics`, `VendorOverviewTab`)
- Mal-velger og opplasting (men inni e-post-chip-popoveren)
- `prefillFromGuidance`-prop (blir bare ett av Lara-forslagene)
- Validering: tittel + nivå + kritikalitet kreves

## Tekniske detaljer

**Filer som endres**
- `src/components/asset-profile/RegisterActivityDialog.tsx` — full rewrite, samme eksport og props
- Ingen endringer i kallesteder

**Nye/utvidede helpers**
- `src/utils/laraActivitySuggestions.ts` (ny) — slår sammen `LARA_EMAIL_SUGGESTIONS` + `SuggestedActivity` til en felles `LaraActivitySuggestion`-type med felles felter (icon, theme, level, criticality, title, body, reasonNb/En)
- Heuristikk for "skriv egen": en liten `inferFromTitle(title): Partial<LaraActivitySuggestion>` som matcher på nøkkelord (DPA, SLA, hendelse, revisjon, e-post, telefon)

**Komponentstruktur internt**
- `<SuggestionCard>` — kort i steg 1
- `<ChipPopover>` — gjenbrukbar for type/nivå/tema/kritikalitet/status/dato
- `<EmailComposer>` — kun synlig når type=email; inneholder mal-select + opplasting

**Ingen DB- eller edge-endringer.** Ingen nye tokens — bruker eksisterende `primary`, `muted`, status-farger og `bg-warning`/`bg-success`/`bg-destructive` per Core-regelen om kritikalitet/risiko.

**i18n** — alle nye strenger lagt inn med eksisterende inline `isNb`-mønster (samme som dagens fil bruker), så vi ikke introduserer en ny pattern.

## Out of scope

- Ekte LLM-kall for å foreslå (bruker eksisterende kuraterte forslag i denne iterasjonen)
- Trust Score / gap-impact preview
- Naturlig språk-felt med live AI-parsing
- Persistens av brukerens "siste valg" som default
