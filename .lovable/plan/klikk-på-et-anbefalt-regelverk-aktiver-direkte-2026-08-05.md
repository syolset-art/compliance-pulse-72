# Klikk på et anbefalt regelverk = aktiver direkte

I kortet «Anbefalte regelverk» må partneren i dag først velge en pille og deretter trykke «Aktiver». Det endres til samme ett-klikks flyt som ellers i produktet.

## Ny oppførsel

- Klikk på et anbefalt regelverk (f.eks. ISO 27001, GDPR, NIS2, DORA) åpner aktiveringsdialogen direkte for akkurat det regelverket.
- Dialogen er den samme som brukes andre steder, med de samme stegene:
  1. Vilkår og betingelser må godkjennes (hvis ikke allerede godkjent gjeldende versjon).
  2. Spørsmål om Driftspartner-rollen, med forklaring av hva rollen innebærer.
  3. Bekreftelse med pris eks. mva. og teksten om at tjenesten aktiveres umiddelbart og faktureres på neste faktura.
- Pillene får tittel/tooltip «Aktiver direkte» og lyn-ikon, slik at det er tydelig hva klikket gjør.
- Under pillene ligger to lenker:
  - «Aktiver alle anbefalte» — åpner samme dialog med alle foreslåtte regelverk.
  - «Lag tilbud i stedet» — åpner tilbudsdialogen med de anbefalte regelverkene, for partnere som vil selge inn før aktivering.
- Aktiverte regelverk vises fortsatt som grønne merker og er ikke klikkbare.
- Etter fullført aktivering oppdateres kortet, og regelverket flytter seg fra anbefalt til aktivert.

## Teknisk

- `src/components/msp/guidance/CustomerFrameworkRecommendationsCard.tsx`: fjern lokal `picked`-state; pilleklikk kaller `onActivate([suggestion])`. Legg til lenkene «Aktiver alle anbefalte» (`onActivate(alle)`) og «Lag tilbud i stedet» (`onOffer(alle)`).
- Ingen endring i `MSPCustomerDetail.tsx` er nødvendig — `onActivate` er allerede koblet til `ActivateRecommendationsDialog`, som håndterer vilkår, driftspartner-rollen og prisbekreftelse.
- Ingen databaseendringer.
