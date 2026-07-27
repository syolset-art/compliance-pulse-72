````text
MÅL
Utvide «Kontaktinformasjon»-steget i AddMSPCustomerDialog slik det matcher referansedesignet: nettside-felt med ja/nei-toggle, URL-input, valg av kundekontakt (ansvarlig partner), og hjelpetekster. Lagre nettside og kundekontakt i msp_customers og vis dem i CustomerStatusBanner.

KONTEKST
- AddMSPCustomerDialog.tsx har allerede en «contact»-step med kontaktperson, e-post og rolle.
- msp_customers-tabellen har ikke kolonner for url eller account_manager i dag.
- CustomerStatusBanner viser «Ansvarlig» via PARTNER_TEAM og localStorage-overstyringer, men verdien lagres ikke i databasen.

ENDRINGER

1. Database
   Migrasjon som legger til i public.msp_customers:
   - url (text, nullable)
   - account_manager (text, nullable)
   - Riktige GRANTs følger med (authenticated får SELECT/INSERT/UPDATE/DELETE, service_role ALL).

2. AddMSPCustomerDialog.tsx – contact-step
   - Nytt form-state: has_website (boolean), url (string).
   - Nettside-seksjon:
     - Toggle: «Ja, har nettside» / «Har ikke nettside».
     - URL-input vises kun når «Ja» er valgt.
     - Hjelpetekst: «Bekreft at nettadressen stemmer. Mynder bruker den til å hente compliance-informasjon automatisk. Skanningen starter først når du går videre.»
   - Kundekontakt-seksjon:
     - Dropdown med PARTNER_TEAM som valg.
     - Hjelpetekst: «Hvem hos dere har ansvaret for denne kunden? De får varsler om kunden.»
   - Oppdatere Neste-knapp til å gå til kartlegging (uendret flyt), men url/account_manager må være gyldig før videre.

3. AddMSPCustomerDialog.tsx – bekreftelse og lagring
   - Vis nettside og kundekontakt i oppsummeringen (confirm-step).
   - handleSave persisterer url og account_manager sammen med resten av kunden.

4. CustomerStatusBanner.tsx
   - Hent account_manager fra kunden i stedet for (eller i tillegg til) localStorage-overstyringer.
   - Vis nettside som klikkbar lenke dersom url finnes.
   - Oppdatere «Endre ansvarlig»-popover til å lagre i databasen via Supabase-update, ikke bare localStorage.

5. Verifisering
   - Kjøre TypeScript-sjekk (tsgo/bun typecheck).
   - Åpne dialogen i preview og sjekke at feltene vises, validering fungerer, og lagring lagrer url/account_manager.

LEVERANSE
- Én migrasjon + oppdaterte komponenter. Ingen endring i eksisterende stegrekkefølge utover å berike contact-steget.
````