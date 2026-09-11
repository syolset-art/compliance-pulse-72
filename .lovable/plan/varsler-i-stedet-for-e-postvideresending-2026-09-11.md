# Varsler i stedet for e-postvideresending

Du har rett: fanen «Kommunikasjon» i partnerinnstillingene handler egentlig ikke om videresending av e-post. Den bør være en enkel varslingsside, der hver bruker velger hvilke hendelser hos sine kunder de vil bli varslet om — på e-postadressen de allerede er registrert med.

## Hva som endres

Fanen får nytt navn: **Varsler**.

Øverst en kort linje: «Varsler sendes til <din registrerte e-post>. Vil du endre adressen, gjør du det i profilen din.» Ingen felt for mottaks-e-post, kopi eller svar-til.

Under: én hovedbryter og en liste med hendelser du kan slå av og på hver for seg. Hendelsene speiler aktivitetene vi allerede logger på kunder:

- Ny melding eller svar fra kunde
- Tilbud akseptert eller avslått
- Risiko- eller modenhetsendring hos kunde
- Ny eller utløpt dokumentasjon
- Frist nærmer seg / frist oversittet
- Kontroll eller krav endrer status

Til slutt et valg for leveringsform: **Straks** eller **Daglig oppsummering**.

Varsler gjelder kun kunder du er kundeansvarlig for (eller driftspartner på). Det står tydelig i en kort infolinje, så ingen tror de får varsler for hele porteføljen.

Alt gjelder deg som bruker — ikke hele partnerorganisasjonen slik dagens tekst sier.

## Teknisk

- `src/pages/MSPPartnerSettings.tsx`: erstatt `TabsContent value="kommunikasjon"` (linje 530–608) med ny varslingsseksjon; fjern `ForwardSettings`-state, `SETTINGS_KEY`-lagring og e-postfeltene fra denne siden.
- Faneverdi beholdes som `kommunikasjon` for eksisterende `?tab=`-lenker, men etiketten i menyen under Innstillinger endres til «Varsler».
- Preferanser lagres per bruker i eksisterende `notification_preferences` (`user_id`, `notification_type`, `enabled`) med nye `notification_type`-nøkler prefikset `partner.` (f.eks. `partner.customer_message`, `partner.offer_accepted`). Ingen skjemaendring.
- Leveringsform lagres som egen nøkkel `partner.digest` (enabled = daglig oppsummering).
- Registrert e-post leses fra innlogget bruker; vises som ren tekst.
- Hendelseslisten defineres i en ny `src/lib/partnerNotificationEvents.ts`, med samme kategorier som signalstrømmen (`MSPMynderSignalsFeed`), slik at varsler og aktivitetslogg holdes i takt.
- `src/pages/MSPMessages.tsx` beholder sin egen e-postboks-innstilling uendret i denne omgangen.

## Merk

Dette er prototype-nivå: valgene lagres og vises, men det sendes ikke faktiske e-poster før vi kobler på utsending.
