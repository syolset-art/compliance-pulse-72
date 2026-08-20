# Bruk og kontekst: side-ved-side layout

## Mål
"Hva brukes leverandøren til?" tar for mye plass. Den skal stå ved siden av kontekstvalgene (kritikalitet, prioritet, GDPR-rolle, risikonivå) på PC, og under dem på brett/mobil. Lara foreslår alltid, men brukeren kan alltid endre.

## Layout

```text
PC (lg+)                          Brett / mobil
┌──────────────┬──────────────┐   ┌──────────────────┐
│ Kontekstvalg │ Hva brukes   │   │ Kontekstvalg     │
│ (4 pills +   │ leverandøren │   │ (2x2 pills +     │
│  panel)      │ til?         │   │  panel)          │
└──────────────┴──────────────┘   ├──────────────────┤
                                   │ Hva brukes ...   │
                                   └──────────────────┘
```

- Kontekstvalgene til venstre, bruksbeskrivelsen til høyre på PC.
- Under `lg` stables de, med kontekstvalg først (over bruk) — samme rekkefølge som DOM, så ingen egen mobil-duplisering trengs.
- Lara-banneret på toppen og prosesser/underdatabehandlere under beholdes uendret.

## Innstramming av bruks-kortet
- Pill-taggene komprimeres (mindre padding, tettere) så kortet ikke dominerer.
- Tekstfeltet reduseres til kompakt høyde og vokser ved fokus.
- Lara-forslaget vises som en rolig linje med "Bruk forslaget"-knapp, slik at brukeren aktivt velger å ta det inn — og alltid kan skrive noe annet.

## Kontekstvalg (uendret funksjonelt)
- Pill-raden viser Laras forslag som standardverdi, men hver pill åpner panel der brukeren overstyrer. Ingen endring i lagring eller logikk.
- På PC blir pill-rutenettet 2 kolonner (i stedet for 4) siden kolonnen er smalere; panelet ligger under pillene som i dag.

## Teknisk
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: pakk `ContextPillRow` og `VendorPurposeCard` i `grid grid-cols-1 lg:grid-cols-2 gap-4 items-start`, med ContextPillRow først.
- `src/components/asset-profile/usage/ContextPillRow.tsx`: rutenett `grid-cols-2` (dropp `lg:grid-cols-4`) slik at det passer i halv bredde.
- `src/components/asset-profile/usage/VendorPurposeCard.tsx`: strammere spacing, kompakt textarea, "Bruk forslaget"-knapp på Lara-forslaget.
- Kun presentasjon — ingen endringer i datalagring, edge functions eller forslagslogikk.
