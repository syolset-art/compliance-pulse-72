## Mål

Fanene i «Vurdering» (kundeprofil → `MSPMaturityServiceMatrix`) skal skille tydelig mellom **utkast**, **leverte tilbud** og **pågående oppdrag**, og partneren skal kunne bekrefte at et sendt tilbud er godkjent av kunden — slik skissene viser.

I dag finnes bare tre faner: «Anbefalte tjenester», «Tilbud» og «Pågående oppdrag», og lagrede tilbud har ingen livssyklus (utkast → sendt → akseptert).

## Ny fanestripe

```text
[ Tjenester 7 ] [ Utkast 2 ] [ Tilbud levert 3 ] [ Pågående oppdrag 2 ]
```

- **Tjenester** — dagens «Anbefalte tjenester»-tabell, kun nytt navn + antall.
- **Utkast** — tilbud som ikke er sendt. Handlinger: Åpne/rediger, Send til kunde, Last ned, Slett utkast.
- **Tilbud levert** — sendte tilbud. Handlinger: bekreft aksept / avslå.
- **Pågående oppdrag** — uendret (`OngoingDeliveriesList`).

## «Tilbud levert» — radoppsett (som bilde)

Kompakt rad per tilbud, ikke tabell:

- Statusikon til venstre (klokke = venter, grønn hake = akseptert, rød = avslått)
- Tittel (regelverk/tjeneste) + liten «Mottatt»-brikke
- Undertekst: `Sendt 30. juli 2026 · Besvart 30. juli 2026 · Mynder AS`
- Høyre: statuspille **Venter** / **Akseptert** / **Avslått**, chevron for å utvide, nedlastingsikon
- Utvidet visning: «Foreslåtte aktiviteter» med timer per linje, totalsum og timepris, vedlegg (f.eks. gap-analyse) og — når status er *Venter* — knappene **Aksepter tilbud** (primær) og **Avslå tilbud** (outline, destruktiv tekst)

## Bekreftelse av aksept

«Aksepter tilbud» åpner en liten bekreftelsesdialog der partneren registrerer kundens godkjenning:

- Godkjent av (navn) + rolle
- Metode: E-post / E-signatur / Muntlig / Portal
- Dato
- Valgfri referanse/kommentar

Ved lagring: status → **Akseptert**, raden viser «Godkjent av <navn> · <metode> · <dato>» og en «Se bevis»-linje i utvidet visning. Toast bekrefter, og tilbudet blir tilgjengelig som oppdrag under «Pågående oppdrag». «Avslå tilbud» setter status **Avslått** med valgfri årsak.

## Teknisk

- `src/components/msp/MSPMaturityServiceMatrix.tsx`: utvid lokal `SavedOffer`-type med `offerState: "draft" | "sent" | "accepted" | "declined"`, `sentAt`, `respondedAt`, `approval?` og `tasks[]` (label + timer) til den utvidede visningen. Seed-data justeres så demoen viser 2 utkast og 3 leverte (én ventende med aktiviteter og vedlegg, à la bildet).
- Ny fane-verdi `drafts` i `Tabs`, filtrering av `savedOffers` på `offerState`.
- Nye presentasjonskomponenter i `src/components/msp/offers/`: `OfferListRow.tsx` (rad + utvidet innhold) og `ConfirmOfferAcceptanceDialog.tsx`.
- Alt er prototype-state i komponenten (som i dag) — ingen databaseendringer.
