## Problem

Når `crossReferenceDoc` finnes viser vi fortsatt:
- Overskrift "Lara har delvis data — dette gjenstår"
- "Lara henter dette fra: Dokumenter"
- Forklaringsparagraf "Lara kan forberede et utkast basert på …"
- Og *så* enkeltlinjen med forslaget

Det er nettopp den støyen brukeren vil bort fra. Meldingen skal være så enkel som: "Jeg fant dette dokumentet som matcher — bekreft."

## Endring

### `LaraDataSourceExplainer.tsx`

Når `crossReferenceDoc` er satt, render kun en kompakt variant — ingen ytre `bg-primary/5`-boks, ingen heading, ingen "henter fra"-linje, ingen forklaringsparagraf, ingen "Dokumenter manuelt"-CTA.

Ny visning i det tilfellet:

```
✨  Lara fant Sikkerhetspolicy_v3.pdf  ·  Policy  ·  dekker Krav A, Krav B  ·  Vilde Gjellestad, 10. juli 2026        [ Bekreft ]
```

Konkret: helt øverst i `return` legger vi til en early-return-gren:

```tsx
if (crossReferenceDoc) {
  return (
    <div className="flex items-center gap-2 border-l-2 border-primary/40 pl-2.5 py-1.5 text-xs">
      {/* samme enkeltlinje som allerede finnes, uten ml-11 */}
    </div>
  );
}
```

Den eksisterende store return-blokken (heading + forklaring + "Dokumenter manuelt"-CTA) beholdes uendret for tilfellet uten forslag.

### Ingen andre filer

`FrameworkRequirementsList.tsx` er uendret — komponenten kalles allerede med både `crossReferenceDoc` og `onManualDocument`; sistnevnte brukes bare når det ikke finnes forslag.

## Ute-av-scope

- Ingen endring i datamodell eller i statuspille/verifisering.
- "Dokumenter manuelt"-CTA er fortsatt tilgjengelig i tilfeller uten forslag.
