# Endre standardtekst fra «Avslutt» til «Avvikle» i modulkort

## Mål

Sikre at handlingen for å fase ut en modul eller tjeneste konsekvent heter «Avvikle», ikke «Avslutt», i produkt-/abonnementskortene.

## Slik blir det

- I `src/components/subscriptions/ModuleCard.tsx` endres standardverdien for deaktiveringsknappen fra `Avslutt` til `Avvikle`.
- Eksisterende eksplisitte `deactivateLabel` beholdes uendret (f.eks. `Avvikle` for Mynder Core og `Deaktiver alle regelverk` for Regelverk).

## Teknisk

- Endre linje 200 i `src/components/subscriptions/ModuleCard.tsx`:
  - Fra: `{deactivateLabel || "Avslutt"}`
  - Til: `{deactivateLabel || "Avvikle"}`

## Omfang

- Ingen endring av logikk, flyt eller API.
- Ingen endring av andre «Avslutt»-tekster (demo, dialoger, tilbud) som ikke handler om modulavvikling.
