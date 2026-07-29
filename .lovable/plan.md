## Mål

Endre «Regelverk kunden må følge» fra en enkel liste til en tabell som samtidig viser hvilke tjenester som kan mappes mot hvert regelverk — med tydelig skille mellom **Mine tjenester** (fra partnerens egen katalog) og **Anbefalt fra Mynder** (fra Mynder-biblioteket).

## Endringer

**Fil:** `src/components/msp/guidance/RegulationsStatusCard.tsx`

Erstatt `<ul>`-lista med en `Table` (shadcn) med kolonner:

| Kolonne | Innhold |
| --- | --- |
| Regelverk | Navn + statusbadge (`Bekreftet` / `AI-anbefalt`) på samme linje, begrunnelse som liten linje under |
| Mine tjenester | Chips for hver tjeneste i `PARTNER_SERVICES` som treffer regelverket (primær-farget, `Check`-ikon). Tomt = subtil «Ingen tjeneste dekker dette ennå» med lenke til `/msp-service-catalog`. |
| Anbefalt fra Mynder | Chips for tjenester fra `SERVICE_LIBRARY` (som ikke allerede finnes i partnerens katalog), maks 3 + «+N flere». Sparkles-ikon, outline-stil. Klikk = lenke til `/msp-service-catalog?tab=all&highlight=<id>`. |
| Handling | Bekreft/Fjern-knapper som i dag (kompakt) |

Legg til en liten hjelpetekst-linje under tittelen: «Chips viser tjenester som kan dekke kravene — Mine er fra din katalog, Anbefalt fra Mynder er forslag du kan legge til.» med `AiMappingDisclosure variant="icon"`.

## Datakoblinger

- Importér `PARTNER_SERVICES` fra `@/lib/serviceCatalog` og `SERVICE_LIBRARY` fra `@/lib/serviceLibrary`.
- Per rad, filtrer:
  - `mine = PARTNER_SERVICES.filter(s => s.frameworkMappings.some(m => m.frameworkId === rec.frameworkId) && s.status !== "retired")`
  - `anbefalt = SERVICE_LIBRARY.filter(t => t.mappings.some(m => m.frameworkId === rec.frameworkId) && !mine.some(m => m.name.toLowerCase() === t.name.toLowerCase()))`

## Visuelt skille

- **Mine tjenester**: fylt chip, `bg-primary/10 text-primary border-primary/30`, `Check` ikon.
- **Anbefalt fra Mynder**: outline chip, `border-dashed border-muted-foreground/40 text-muted-foreground`, `Sparkles` ikon.
- Kolonneoverskriftene bruker vanlig sentence case (ikke uppercase), i tråd med resten av appen.

## Utenfor scope

- Ingen endringer i datamodell, hooks eller andre komponenter.
- Ingen ny persistering — chips er visuelle koblinger basert på eksisterende mappings.
