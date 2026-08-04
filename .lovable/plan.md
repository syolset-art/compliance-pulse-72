# Salgspotensial i widgeten

Widgeten på partnerdashbordet endres fra kun antall oppgaver til å vise et konkret inntektspotensial i hele kroner, tydelig merket som KI-generert estimat.

## Hva brukeren ser

- Ny tittel: "Salgspotensial"
- Hovedtall: samlet potensial i hele kroner, f.eks. "1 240 000 kr" med underlinje "41 mulige oppgaver hos 11 kunder · eks. mva"
- Etikett "KI-generert estimat" rett ved tallet (tekstetikett, ikke bare ikon), med kort forklaring på hover/info: estimatet bygger på timeestimat per oppgave ganget med din timepris fra tjenesteinnstillinger.
- Fordelingslisten (per bransje / per regelverk) viser beløp først, antall oppgaver som sekundær tekst: "Bygg og anlegg — 280 000 kr · 9 oppgaver".
- Stolpelengden følger beløp, men alt har tekstetikett i tillegg (WCAG). Skjult tekstalternativ oppdateres med beløp.
- Tomtilstand beholdes, men formuleres som at potensial beregnes når kunder har gjennomført modenhetsvurdering.
- Knappen "Se alle muligheter" beholdes.

På siden `/msp-partner/muligheter` legges beløp inn per kunde (kolonne "Potensial") og per oppgave i den utvidede raden, med samme KI-etikett. Ingen andre endringer der.

## Teknisk

- `src/lib/partnerOpportunities.ts`: legg til hjelpefunksjoner `taskPotential(task, hourlyRate)`, `customerPotential`, `totalPotential`, og utvid `distributionByIndustry` / `distributionByFramework` med `potential`. Beregning: `estimateHours * hourlyRate`, avrundet til nærmeste 1 000. Fjern kommentaren om "ingen kronebeløp".
- Timepris og valuta hentes fra eksisterende `useServiceDefaults()` (`defaultHourlyRate`, `currency`) — samme kilde som resten av MSP-flatene, så tall er konsistente med tilbud.
- Formattering: hele kroner uten desimaler via `Intl.NumberFormat` med valuta fra hooken.
- `src/components/msp/OpportunityWidget.tsx`: ny tittel, hovedtall i beløp, beløp i fordelingslisten, KI-etikett + info-popover, oppdatert `sr-only`-tekst.
- `src/pages/MSPOpportunities.tsx`: ny beløpskolonne per kunde og beløp per oppgave i utvidet rad.
