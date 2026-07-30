## Mål

Partneren skal selv kunne sette status på et sendt tilbud — godkjent eller avvist — direkte fra statusen i listen, uten å måtte åpne raden. Senere kan en agent gjøre det samme automatisk fra partnerens egen infrastruktur (e-post/signering), så statusen må vise hvor den kom fra.

## Slik blir det

**Statusen blir klikkbar.** I `OfferListRow` blir «Venter»/«Akseptert»/«Avslått» en liten knapp med chevron. Klikk åpner en meny:

```text
Venter ▾
 ├ ✓ Marker som godkjent      → åpner bekreftelsesdialogen (hvem godkjente, metode, dato)
 ├ ✕ Marker som avslått       → liten dialog for kort begrunnelse (valgfri)
 └ ↺ Sett tilbake til venter  → kun synlig når status er godkjent/avslått
```

- Menyen vises kun for tilbud som er sendt (ikke for utkast).
- Godkjent gjenbruker `ConfirmOfferAcceptanceDialog` som allerede finnes, så godkjenner, rolle, metode og referanse blir registrert.
- Avslag får nå en enkel begrunnelsesdialog i stedet for dagens faste tekst «Registrert som avslått av partner».
- «Sett tilbake til venter» nullstiller `approval`/`declineReason`/`respondedAt` — nyttig hvis partneren feilregistrerer.
- De store knappene «Aksepter tilbud» / «Avslå tilbud» i den utvidede raden beholdes; de peker på samme handlinger.

**Kilde til statusen.** Vi utvider tilbudsmodellen med `statusSource: "partner" | "agent"` (default `partner`). Manuelt satt status viser en diskret «Satt manuelt av {navn}» i den utvidede raden. Menyen får en inaktiv bunnlinje: «Automatisk oppdatering via agent — kommer», slik at det er tydelig i prototypen at samme statusfelt senere kan settes av en agent fra partnerens egen infrastruktur. Ingen agent-integrasjon bygges nå.

## Teknisk

- `src/components/msp/offers/offerTypes.ts`: legg til `statusSource?: "partner" | "agent"` og `statusSetBy?: string` på `PartnerOffer`.
- `src/components/msp/offers/OfferListRow.tsx`: gjør `StatusPill` til en `DropdownMenu`-trigger (shadcn) når `offerState !== "draft"` og `onSetState` er gitt; ellers uendret ren tekst. Legg til ny prop `onSetState?: (offer, next: "accepted" | "declined" | "sent") => void`. Vis kilde-linje når `statusSetBy` finnes.
- Ny `src/components/msp/offers/DeclineOfferDialog.tsx`: liten dialog med tekstfelt for begrunnelse + «Marker som avslått».
- `src/components/msp/MSPMaturityServiceMatrix.tsx`: utvid `declineOffer` til å ta imot begrunnelse, legg til `resetOfferToSent`, sett `statusSource: "partner"` og `statusSetBy` i `acceptOffer`/`declineOffer`, og send `onSetState` til `OfferListRow` i «Pågående oppdrag»-fanen.

Ingen databaseendringer — tilbudene ligger fortsatt i lokal state/demo-seed.
