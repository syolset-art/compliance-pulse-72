
## Mål

Erstatt det store, ekspanderte "NIS2-aktiveringskampanje"-kortet på MSP-dashbordet med en kompakt **tabell over Lara-forslag**, der hver rad = ett forslag (f.eks. NIS2-aktivering, GDPR-oppfriskning, DORA-beredskap, AI Act-kartlegging).

## Endringer i `src/pages/MSPPartnerDashboard.tsx`

### 1. Ny datamodell `LARA_SUGGESTIONS`
Array med 4 forslag:
- **NIS2-aktiveringskampanje** — 28 kunder, forventet 9–12 aktiveringer, prioritet Høy
- **GDPR årlig oppfriskning** — 46 kunder, forventet 30+ fornyelser, prioritet Middels
- **DORA-beredskapssjekk** — 12 kunder (finans), forventet 8 risikovurderinger, prioritet Høy
- **AI Act-kartlegging** — 19 kunder med AI-systemer, forventet 15 nye ROPA-oppføringer, prioritet Middels

Felter per rad: `id`, `regelverk` (badge), `tittel`, `beskrivelse` (kort), `målgruppe` (antall kunder), `forventetEffekt`, `prioritet` (Høy/Middels/Lav med fargekoding).

### 2. Ny komponent `LaraSuggestionsTable`
Erstatter dagens `LaraCampaignHero` / ekspanderte kort (linjene rundt 400–740 som viser stegene "1. Gjennomgå … 4. Tidsplan", rekkevidde/forventet-boks, "Slik utfører Lara dette", og knappene Avbryt / Sett opp kampanje).

Layout:
- Kortheader: ikon + "Lara-forslag" + subtittel "4 anbefalinger klare for gjennomgang"
- Tabell med kolonner:
  1. **Regelverk** (fargekodet pill: NIS2, GDPR, DORA, AI Act)
  2. **Anbefaling** (tittel + kort beskrivelse under)
  3. **Målgruppe** (f.eks. "28 kunder")
  4. **Forventet effekt**
  5. **Prioritet** (statustagg)
  6. **Handling** — sekundærknapp "Sett opp" per rad (åpner samme flow som før, men fra rad-nivå)

- Ingen ekspanderte steg (Gjennomgå/Målgruppe/E-post/Tidsplan) synlig som standard — de tilhører "Sett opp"-flyten.

### 3. Fjernes
- Hero-kortet med progress-steg (1–4), rekkevidde/forventet-bokser, "Slik utfører Lara dette"-accordion, og Avbryt/Sett opp-knapper på toppen.
- Ubrukte states/imports knyttet til stegvisning.

### 4. Beholdes
- Meldingslinjen "Du har 7 nye meldinger og Lara har 3 forslag i dag" (endres til "4 forslag" for å matche tabellen).
- Alt annet på dashbordet (widgets, kundeliste osv.) er urørt.

## Teknisk

- Fil: kun `src/pages/MSPPartnerDashboard.tsx`.
- Bruker eksisterende shadcn `Table`, `Badge`, `Button`.
- Fargekoding regelverk-pills via Tailwind semantic tokens (ingen hardkodede farger).
- Ingen ruter, backend eller nye filer.
