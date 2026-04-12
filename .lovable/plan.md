

## Plan: Skille leverandørens baseline fra virksomhetens eget modenhetsarbeid

### Problemet
I dag viser "Modenhet per kontrollområde" en samlet score uten å skille mellom hva leverandøren selv har dokumentert (baseline) og hva virksomheten har beriket gjennom eget arbeid (egne krav, risikovurderinger, DPA-oppfølging osv.). Brukeren kan ikke se hva som kommer "gratis" fra leverandøren vs. hva de selv har bidratt med.

### Løsning: Todelt visning med stacked progress

Hver kontrollområde-rad får en **todelt fremdriftslinje** (stacked bar) med to farger:
- **Grå/nøytral**: Leverandørens baseline (kontroller som er oppfylt basert på leverandørens egne data — dokumenter, kontaktinfo, underleverandører)
- **Blå/primærfarge**: Virksomhetens berikelse (kontroller oppfylt gjennom organisasjonens eget arbeid — risikovurdering, kritikalitet, eierskap, gjennomgangssyklus)

Øverst i panelet vises to tall:
```text
┌─────────────────────────────────────────────────┐
│ Modenhet per kontrollområde            72%      │
│                                                  │
│ Leverandørens baseline: 35%  ▪ Eget arbeid: 37% │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ [grå██████][blå█████████][tom░░░░░░░░░░░░░░░░░] │
│                                                  │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ Styring      │  │ Drift og bruk│              │
│ │ ██░░ 2/4     │  │ ███░ 3/4     │              │
│ └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────┘
```

### Klassifisering av kontroller

Kontrollene deles i to kategorier basert på hvem som naturlig eier dem:

**Leverandør-baseline** (data som leverandøren bringer):
- `documentation_available` — leverandørdokumenter
- `dpa_verified` — DPA fra leverandør
- `security_contact` — leverandørens kontaktperson
- `sub_processors_disclosed` — underleverandørliste
- `vendor_security_review` — leverandørens sikkerhetsgjennomgang

**Virksomhetens eget arbeid** (organisasjonens berikelse):
- `owner_assigned` — eierskap tildelt
- `responsible_person` — ansvarlig definert
- `description_defined` — systembeskrivelse
- `risk_level_defined` — risikonivå satt
- `criticality_defined` — kritikalitet vurdert
- `risk_assessment` — risikovurdering utført
- `review_cycle` — gjennomgangssyklus definert

### Teknisk implementering

**Fil 1: `src/lib/trustControlDefinitions.ts`**
- Legg til et felt `source: "vendor_baseline" | "org_enrichment"` på `TrustControlDefinition`
- Tagger alle kontroller med riktig source
- Ny hjelpefunksjon `calculateScoreBySource()` som returnerer separate scores

**Fil 2: `src/components/trust-controls/TrustControlsPanel.tsx`**
- Beregn to separate scores: `baselineScore` og `enrichmentScore`
- Erstatt den enkle progress-baren med en stacked bar (to segmenter)
- Vis forklaring med to fargede prikker: "Leverandørens baseline" og "Eget arbeid"
- Hver kontrollområde-kort viser også stacked progress
- Når bruker ekspanderer et område, vises kontrollene gruppert under to overskrifter

**Fil 3: `src/components/ui/stacked-progress.tsx`** (ny)
- Enkel komponent som tar to verdier og rendrer en todelt fremdriftslinje

### Visuelt resultat
- Brukeren ser umiddelbart hvor mye av scoren som kommer fra leverandøren vs. eget arbeid
- Motiverer til å berike profilen — "du kan øke fra 35% til 72% med eget arbeid"
- Tydelig narrativ: "Leverandøren gir deg dette grunnlaget, men din organisasjon må gjøre resten"

