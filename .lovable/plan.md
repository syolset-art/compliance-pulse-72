# «Les mer» per modul

Gjøre det mulig for brukeren å åpne en modal-dialog med utfyllende informasjon (beskrivelse + nøkkelfunksjoner) for hver modul på `/subscriptions`.

## Brukerflyt

1. På hvert modulkort vises en subtil «Les mer»-lenke (tekstknapp) ved siden av eksisterende handling.
2. Klikk åpner en midtstilt dialog med modulens navn, ikon, kort beskrivelse og punktliste med nøkkelfunksjoner.
3. Dialog lukkes med X eller «Lukk». Ingen andre handlinger flyttes hit – kjøp/endring skjer fortsatt fra kortet.

## Omfang

Moduler som får «Les mer»:
- Mynder Core
- Regelverk
- Leverandørmodul
- Assets
- Trust Profile
- Partner Workspace

## Teknisk

Nye/endrede filer:

- `src/lib/moduleInfo.ts` (ny) – ren datafil. Eksporterer `MODULE_INFO: Record<ModuleKey, { title; tagline; description; features: string[] }>` for de 6 modulene over. All tekst på norsk, samme tone som resten av siden.
- `src/components/subscriptions/ModuleInfoDialog.tsx` (ny) – shadcn `Dialog` som tar `moduleKey` + `open/onOpenChange`. Viser ikon (fra `lucide-react`, matcher kortets ikon/accent), tittel, kort ingress, og en `Check`-punktliste med nøkkelfunksjoner. Bruker eksisterende design-tokens – ingen hardkodede farger.
- `src/components/subscriptions/ModuleCard.tsx` – legg til valgfri prop `onReadMore?: () => void`. Når satt, render en liten «Les mer»-tekstknapp i venstre kolonne under beskrivelsen (samme størrelse som `usageLine`-tekst, `text-muted-foreground hover:text-foreground`). Ingen andre visuelle endringer.
- `src/pages/Subscriptions.tsx` – lokal state `readMoreKey: ModuleKey | null`. Send `onReadMore={() => setReadMoreKey("core")}` osv. til hvert `ModuleCard`. Rendrer én `ModuleInfoDialog` styrt av staten.

Ingen backend-endringer, ingen nye avhengigheter, ingen endringer i priser/logikk.
