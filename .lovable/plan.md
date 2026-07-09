## Mål

Kollaps hele Lara-forslagskortet til én kompakt linje inne i den utvidede kravraden. Ingen egen boks — bare en subtil rad brukeren kan bekrefte med ett klikk.

## Ny visning

```
✨  Lara fant Sikkerhetspolicy_v3.pdf  ·  Policy  ·  dekker Krav A, Krav B  ·  Vilde Gjellestad, 10. juli 2026        [ Bekreft ]
```

- Én horisontal linje, `text-xs`, ingen kantet boks/bakgrunn (evt. `border-l-2 border-primary/30 pl-2` for subtil markering).
- Sparkles-ikon foran som Lara-signatur.
- Dokumentnavn i `font-medium`.
- Meta-segmenter (klassifisering, dekker, opplaster/dato) skilles med `·` i `text-muted-foreground`.
- Ved 3+ krav: "dekker Krav A, Krav B +2 til".
- Én knapp helt til høyre: `Bekreft` (kompakt, `h-7 text-xs`, primær variant).

## Endringer

### `LaraDataSourceExplainer.tsx`

- Erstatt hele `crossReferenceDoc`-blokken (linje 82–127) med den nye enkeltlinje-varianten.
- Behold `LaraCrossReferenceDoc`-interfacet uendret (samme props).
- Ingen endring i hovedforklaringen eller "Dokumenter manuelt"-CTA.

### Ingen andre filer

- `FrameworkRequirementsList.tsx`: uendret (den bygger allerede `crossRef` med klassifisering + coversRequirements).

## Ute-av-scope

- Ingen endring i datamodell.
- Ingen endring på det andre plukket (statuspille / verifisering) som ble bygget forrige runde.
