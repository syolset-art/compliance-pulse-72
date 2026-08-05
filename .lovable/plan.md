# "Aktivert" som inngang til driftspartner-arbeidet

I dag er "Aktivert" bare en visning av hva kunden har. Den skal bli inngangen til å faktisk jobbe med compliance på vegne av kunden — der jobben gjøres.

## Hva som endres

**1. Aktiverte produkter blir klikkbare**
Hver pille under "Aktivert" (Leverandørmodul, Mynder Core, Assets, Trust Profile osv.) blir en knapp. Klikk åpner dialogen som bytter til kundens organisasjon og lander partneren rett på riktig side for det produktet (Leverandørmodul → leverandører, Mynder Core → systemer, Trust Center → trust-profil, regelverk → etterlevelse for det regelverket).

**2. Tydelig driftspartner-ramme**
- Seksjonen får overskriften "Aktivert – jobb som driftspartner" med kort forklaring: her jobber du med compliance på vegne av kunden.
- En "Åpne kundens virksomhetsprofil"-knapp ved siden av, som åpner samme dialog med alle aktiverte elementer å velge mellom.
- Piller får hover/fokus-stil og pil-ikon slik at det er synlig at de er klikkbare (tastaturtilgjengelig).

**3. Dialogen tilpasses to situasjoner**
`EnterCustomerContextDialog` sier i dag "X er aktivert … Aktiveringen er fullført". Den får en variant for arbeid: tittel "Jobbe hos {kunde}?" og tekst om at du går inn i kundens organisasjon som driftspartner. "Ikke spør meg igjen"-valget gjelder kun etter aktivering — når partneren klikker bevisst her, skal dialogen alltid vises (den bekrefter organisasjonsbytte).

**4. Samme grep på regelverk**
Aktiverte regelverk i `CustomerFrameworkRecommendationsCard` blir klikkbare på samme måte, og lander på etterlevelse filtrert på regelverket.

## Teknisk

- Ny hjelpefunksjon i `src/lib/offerSuggestions.ts`: `deriveActivatedTargets(customer): CustomerEntryTarget[]` — mapper aktiverte etiketter mot `MANUAL_PRODUCTS`/modulnøkler og aktiverte regelverk mot `frameworkId`. Etiketter uten kjent rute (rene tjenester) faller tilbake til modul `core`.
- `src/lib/customerEntryRoutes.ts`: legg til rute for `trust` som allerede finnes, og fallback-mapping for tjenester.
- `CustomerRecommendationsCard.tsx`: ny prop `onEnterCustomer(items: CustomerEntryTarget[])`; piller og knapp kaller den. Kortet holder ingen egen dialogstate.
- `MSPCustomerDetail.tsx`: kobler prop til eksisterende `setEnterItems`-flyt (uten `promptOrToast`, siden dette er en bevisst handling).
- `EnterCustomerContextDialog.tsx`: ny valgfri prop `variant?: "activation" | "work"` (default `activation`) som styrer tittel, suksessbanner og om "ikke spør igjen"-avkryssingen vises.
