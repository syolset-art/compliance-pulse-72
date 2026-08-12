# Kortere arbeidskø — fra tilbud til godkjenning av arbeid

## Problem

Widgeten er for høy: header, «gjort automatisk»-blokk, tre store kort med tre knapper hver, blokkert-rad og footer. Innholdet handler dessuten om salg (tilbud, purring, møteinnkalling) i stedet for det Lara faktisk kan gjøre ferdig: aktivere produkt, godkjenne bevis, godkjenne rapport, revisjon, leverandørkartlegging.

## Ny widget: maks ~6 linjer

Ett kort med:

1. **Én header-linje:** «Laras arbeidskø · N venter» + autonomi-ikon (uendret meny).
2. **Maks 3 kompakte rader** — én linje hver, ingen bokser:
   `[ikon] Kunde — hva Lara har gjort ferdig  [Godkjenn] [⋯]`
   Begrunnelse og kilde flyttes inn i tooltip på raden (ikke egen linje). «Se utkast» og «Avvis» flyttes inn i ⋯-menyen, så bare én primærknapp vises.
3. **Én footer-linje:** «Lara utførte 2 oppgaver i natt · Se hele køen» — den kollapsbare «gjort automatisk»-blokken fjernes fra widgeten og finnes bare i fullvisningen.

Blokkerte elementer vises som en rad med varselikon i samme liste (ikke egen seksjon), CTA ligger i ⋯.

## Nytt innhold i køen

Erstatt tilbud/purring/møte med fem arbeidstyper:

| Type | Eksempel |
| --- | --- |
| `activate` | Nordvik Helse — Lara har klargjort aktivering av Leverandørmodulen (nivå 20) |
| `evidence` | Bergen Energi — ISO 27001-sertifikat er analysert og matchet mot 7 krav, klar for godkjenning |
| `report` | Fjord Logistikk — Modenhetsrapport Q3 er skrevet ferdig |
| `audit` | Vestland Kraft — Internrevisjon av tilgangsstyring er gjennomført, funn dokumentert |
| `vendor_mapping` | Nordvik Helse — 14 leverandører kartlagt og kategorisert, klar for godkjenning |

Auto-utført (footer): modenhetsscorer oppdatert, personvernerklæringer hentet.

## Teknisk

- `src/lib/laraWorkQueue.ts`: legg til `kind: "activate" | "evidence" | "report" | "audit" | "vendor_mapping"`, fjern `value`/kr-feltet fra bruken i widgeten, bytt ut demo-dataene med de fem elementene over.
- `src/components/msp/LaraWorkQueueWidget.tsx`: skriv om til én-linjes rader, ikon per `kind` (lucide: Zap, ShieldCheck, FileText, ClipboardCheck, Network), tooltip med begrunnelse + kilde, `DropdownMenu` for «Se utkast» / «Avvis» / «Løs blokkering», footer-linje med auto-antall + lenke til hele køen.
- `src/components/msp/LaraQueueFullList.tsx`: viser samme `kind`-ikoner og beholder full detalj (begrunnelse, kilde, filtre) — der er lengde greit.
- Ingen backend-endring; fortsatt lokal demo-state og toast ved godkjenn/avvis.
