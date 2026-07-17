## Mål
"Dokumentasjon påkrevd"-pillen ved siden av kravtittelen tar for mye visuell plass. Gjøre den mer subtil slik at tittel/innhold beholder fokus.

## Endring
I `src/components/regulations/FrameworkRequirementsList.tsx`:

- Erstatt den nåværende `Badge`/pill-varianten med et lite, lavmælt inline-element:
  - Kun et lite ikon (Lucide: `FileText` for dokument-påkrevd, `CheckCircle2` for handling/prosess, `ClipboardCheck` for vurdering) i `text-muted-foreground` størrelse `h-3.5 w-3.5`.
  - Ingen bakgrunn, ingen border, ingen tekstetikett synlig i normal tilstand.
  - Tooltip beholdes med full forklaring (samme tekst som i dag) ved hover.
  - Plasseres rett etter tittelen med `ml-1.5 opacity-60 hover:opacity-100 transition-opacity`.

- Fjern "Primær vei"-linjen som egen visuell blokk — flettes inn i samme tooltip, slik at kort-headeren blir renere.

Ingen endringer i logikk (`requirementFulfillment.ts`), scoring eller datamodell — kun visuell nedskalering av indikatoren.

## Teknisk
- Fil: `src/components/regulations/FrameworkRequirementsList.tsx`
- Behold `getFulfillmentType()`-kall og tooltip-innhold, bytt ut render-blokken fra Badge → ikon-i-tooltip.
- Ikoner via eksisterende `lucide-react`-import.

## Ute av scope
- Scoring, coverage-bar, evidence-dialog, i18n-strenger utover ev. gjenbruk av eksisterende tooltip-tekst.
