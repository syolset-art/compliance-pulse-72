## Endring

Slå sammen kolonnene «Mine tjenester» og «Anbefalt fra Mynder» i `RegulationsStatusCard.tsx` til én kolonne: **Anbefalte tjenester**.

## Ny kolonne-logikk

Per regelverk, bygg én samlet liste med tjenester fra `SERVICE_LIBRARY` som treffer regelverket. Merk hver som:

- **I katalogen din**: hvis navnet finnes i `PARTNER_SERVICES` — fylt chip (`bg-primary/10 text-primary border-primary/30`) med `Check`-ikon.
- **Ikke i katalogen**: outline/stiplet chip (`border-dashed border-muted-foreground/40 text-muted-foreground`) med `Sparkles`-ikon, klikkbar → `/msp-service-catalog?tab=all&highlight=<id>`.

Sorter «i katalogen» først. Vis maks 4 chips + «+N flere» som lenker til `/msp-service-catalog?tab=all`.

Ny tabell-layout:

| Regelverk (40%) | Anbefalte tjenester (48%) | Handling (12%) |

Oppdater hjelpeteksten under tittelen til: «Anbefalte tjenester for hvert regelverk — fylte chips ligger allerede i katalogen din.»

## Utenfor scope

Ingen andre komponenter eller data endres.
