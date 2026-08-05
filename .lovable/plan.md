# Modenhetsfarger og forklaring i modenhetsspeilet

Kortet «Modenhet per kontrollområde» skal vise modenhet med farge, gi hvert område et modenhetsnivå i ord, og forklare at tallene bygger på Mynders scoringsmodell.

## Fargeskala på streken

| Andel | Strek | Nivå |
|---|---|---|
| 0 % | Ingen farge — kun nøytralt spor | Ikke vurdert |
| 1–49 % | Oransje (`warning`) | Umoden |
| 50–74 % | Lys grønn (nytt token) | Moden |
| 75–100 % | Sterk grønn (`success`) | Høy modenhet |

Samme skala brukes på prosenttallet og på et lite, dempet nivå-ord ved siden av prosenten, slik at fargen aldri er eneste bærer av informasjon (WCAG).

## Kontekst om scoringsmodellen

- Info-ikonet ved totalscoren får en kort tekst: modenhet måles per kontrollområde etter Mynders scoringsmodell (v1), der de fem kontrollområdene vektes fast — Personvern 30 %, Styring 25 %, Drift og sikkerhet 25 %, Identitet og tilgang 10 %, Tredjepart og verdikjede 10 %. Score øker når kunden svarer ut, dokumenterer eller verifiserer kontroller — ikke av at data registreres.
- Under skalaen legges en kompakt forklaringslinje: fire små fargeprikker med «Ikke vurdert · Umoden · Moden · Høy modenhet», pluss en linje «Basert på Mynders scoringsmodell (v1)».
- Badgen «Estimert fra baseline-svar» beholdes.

## Teknisk

- Nytt semantisk token `--success-soft` (lys grønn) i `src/index.css` for lys og mørk modus, registrert i `tailwind.config.ts` som `success-soft`.
- Ny hjelpefunksjon i `src/lib/scoringEngine.ts`: `getMaturityBand(pct)` som returnerer `{ id, label, barClass, textClass }` for de fire båndene, slik at speilet, kundeoversikten og senere visninger deler samme kilde.
- `CustomerMaturityMirrorCard.tsx` bruker `getMaturityBand` for `Progress`-indikatorfarge (via `indicatorClassName`/`[&>div]` klasse), prosenttekst og nivå-ord, og erstatter dagens `pctClass`.
- Ingen endring i beregningen av prosentene — kun presentasjon.
