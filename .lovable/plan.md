# Ryddigere topp i "Krav og evaluatorer"

I dag ligger det tre rader med kontroller over kravlisten: tittel + tre tellere/badges, en full bredde statusfane-rad, og en rad med søk, gruppering, opplastingsknapp og en Bevis-bryter. Det gir visuell støy og konkurrerende elementer.

## Ny struktur (to rader i stedet for tre)

```text
Rad 1:  Krav og evaluatorer                       [ Last opp bevis ]  [ ⋯ ]
        12 krav · 2 automatisk · 10 manuell
Rad 2:  [Alle] [Ikke oppfylt 2] [Delvis 5] [Oppfylt 4]        🔍 Søk…   [Aa]
```

- **Rad 1 – tittel og eneste primærhandling.** Tittelen får en tynn underlinje av metadata: "12 krav · 2 automatisk · 10 manuell". Automatisk/manuell blir diskrete, klikkbare tekstlenker (samme forklaringsdialoger som i dag), ikke fargede pills. Til høyre står kun CTA-en "Last opp bevis".
- **Rad 2 – filtrering.** Statusfanene beholdes, men får naturlig bredde (ikke `grid-cols-4` full bredde) og plasseres til venstre. Søkefeltet blir kompakt (maks ~18rem) til høyre på samme linje.
- **Gruppering og Bevis-visning flyttes inn i en "visning"-meny** (ikon-knapp med `SlidersHorizontal`, høyre ytterkant): valg for gruppering (Status / Kontrollområde) og bryter for "Bevis (V2)". Aktivt ikke-standardvalg vises med en liten prikk på ikonknappen, så det er synlig at en visning er endret.
- På mobil/brett stables radene: fanene blir scrollbare horisontalt, søk går til full bredde, CTA og visningsmeny blir ikon-knapper.

## Detaljer

- Ingen endring i logikk, filtrering, tellere, dialoger eller dataflyt — kun presentasjon i `src/components/regulations/FrameworkRequirementsList.tsx`.
- Tooltips beholdes: Last opp bevis (Lara-analyse), Bevis-forklaring, automatisk/manuell.
- V2-merket blir stående ved Bevis-bryteren inne i visningsmenyen.
- Alle farger via eksisterende semantiske tokens; ingen nye hardkodede klasser.
