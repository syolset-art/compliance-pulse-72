## Mål

Forenkle Regelverk-fanen i MSP-kunde-visningen så den matcher det eksisterende mønsteret i `EditActiveFrameworksDialog` (vedlagt skjermbilde). Mindre bokser, mindre tekst.

## Endringer i `src/components/msp/MSPCustomerRegulationsTab.tsx`

### Fjernes
- Hele intro-kortet ("Regelverk for [kunde]" + bransjetekst + tellere). Fanen ligger allerede inne i kundens TP — kontekst er underforstått.
- Egen seksjon for "Anbefalt for denne kunden" som eget block med farget header.
- Egen seksjon for "Øvrige tilgjengelige regelverk".
- Tomme-tilstand-kort med tekst.
- Card-wrappere rundt hvert rammeverk.

### Ny struktur (matcher `EditActiveFrameworksDialog`)
1. **Søkefelt** — pill-formet, full bredde, med søkeikon (samme som referansebildet).
2. **Filterlinje** — `Aktive / Ikke aktive / Alle` som tekstlenker + skille + "Filtre"-popover med kategori-chips. Default: `Aktive`.
3. **Gruppert per kategori** — kategori-ikon + navn som header, deretter enkle rader (ingen Card-wrapper):
   - Rad: landtag, navn, "Påkrevd"-badge hvis obligatorisk, liten beskrivelse, og **Sparkles-ikon + tooltip** "Anbefalt for denne kunden — [grunn]" hvis rammeverket er i anbefalings-listen.
   - Høyre side: status-knapp/badge.
     - Aktiv: kompakt "Aktivert"-badge (grønn prikk) — ikke knapp, siden deaktivering ikke er i scope nå.
     - Inaktiv: liten **"Bestill"**-knapp (outline, sm) som åpner eksisterende `FrameworkOrderConfirmDialog`.

### Beholdes
- `FrameworkOrderConfirmDialog`-flyten uendret (bekreftelse, vedlegg, fakturerings-akseptanse).
- `computeRecommendations`-logikken — men vises nå kun som diskret indikator per rad, ikke som egen seksjon.
- LocalStorage + `ActivatedRecord`-strukturen uendret.
- Bestillingsmetadata (vedlegg/dato) flyttes til tooltip på "Aktivert"-badgen i stedet for egen tekstlinje under raden.

### Visuelt
- Ingen runde/store ikon-bokser per rad.
- Beskrivelse: én linje, `line-clamp-1`, `text-xs text-muted-foreground`.
- Rad-padding holdes lett (`py-2 px-1`), seksjoner skilles av luft, ikke av kort.

## Ingen endringer i
- `MSPCustomerDetail.tsx` (props uendret).
- `FrameworkOrderConfirmDialog.tsx`.
- Datamodell.
