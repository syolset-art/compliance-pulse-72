# Godkjenning som en kort gjennomgang, ikke ett klikk

Knappen «Godkjenn» byttes med **«Gjennomgå»**. Den åpner et smalt panel til høyre der den ansvarlige raskt kan se hva Lara har gjort, hvor kritisk det er, og deretter godkjenne eller avvise.

## Panelet — tre skjermbilder på maks én skjermhøyde

**1. Oppsummering (åpner her)**
- Type arbeid + kunde øverst, og en risikopille: Kritisk / Middels / Lav.
- Én setning om hva Lara har gjort, og én om hvorfor.
- Kilden Lara bygger på, som liten linje.
- Handlinger nederst: «Godkjenn» (primær), «Avvis», og en lenke «Detaljer».

**2. Detaljer (skjult til man ber om det)**
- Punktliste over hva som faktisk endres når man godkjenner (f.eks. hvilke krav som settes som dekket, hvilket produkt som aktiveres).
- Hva som blir berørt: regelverk, leverandør eller produkt.
- Knapp «Be Lara om å justere» — et lite felt der man skriver hva som er galt; oppdraget sendes tilbake i køen som «Til retting» i stedet for å bli godkjent.

**3. Bekreftelse**
- Godkjenn: valgfri kommentar, knappen fungerer uten at man skriver noe.
- Avvis: kommentar er påkrevd — knappen er inaktiv til det står noe.
- For arbeid merket **Kritisk** kreves en kort begrunnelse også ved godkjenning.

Ingen lange forklaringer, ingen avkryssingsboks. Beslutningen dokumenteres av kommentaren, ikke av en bekreftelseshake.

## Risiko og kritikalitet

Hvert køelement får et risikonivå og en kort grunn (f.eks. «Aktiverer betalt produkt», «Endrer dokumentert etterlevelse»). Kritisk arbeid markeres også i selve listen med et lite varselmerke, slik at man ser før man åpner at dette krever oppmerksomhet.

## Etter beslutning

- Godkjent: raden forsvinner, toast bekrefter, og handlingen logges i aktivitetsloggen med hvem, når og eventuell kommentar.
- Avvist: raden forsvinner, kommentaren følger med i loggen.
- Til retting: raden blir stående med merket «Lara justerer».

## Teknisk

- `src/lib/laraWorkQueue.ts`: legg til `risk: "critical" | "medium" | "low"`, `riskReason`/`riskReasonEn`, og `impact`/`impactEn` (punktliste over hva som endres). Ny tilstand `"revising"`.
- Ny `src/components/msp/LaraReviewSheet.tsx` — Sheet med de tre trinnene, kommentarfelt og valideringsreglene over. Erstatter `LaraApproveDialog.tsx`, som slettes.
- `LaraWorkQueueWidget.tsx` og `LaraQueueFullList.tsx`: knappetekst «Gjennomgå» / «Review», åpner den nye sheeten; risikomerke i rad; håndter `revising`.
- All tekst i EN/NB via samme `isNb`-mønster som i dag.
- Ingen databaseendringer — prototypedata og lokal state.
