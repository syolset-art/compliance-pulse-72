# Bruk og kontekst: GDPR-rolle og relasjonskategori

## Vurdering: skal GDPR-rolle flyttes?

Nei — GDPR-rolle bør bli værende i pilleraden til venstre sammen med Kritikalitet, Prioritet og Risikonivå.

Begrunnelse:
- Pilleraden er «hva slags leverandør er dette» (klassifisering som styrer krav og oppfølging). Kortet til høyre er «hva gjør leverandøren for oss» (fritekst og prosesser).
- GDPR-rollen har allerede en utvidet panelvisning i pilleraden: Laras rolleforslag med godkjenning, valg av rolle, bryter for sensitive personopplysninger og kategorivalg. Det blir for tungt inne i beskrivelseskortet.
- Alle fire pillene har samme mønster: kort verdi + utvidbart panel. Å flytte én bryter mønsteret og gjør raden asymmetrisk.

Justering vi gjør i stedet: GDPR-rollen får en tydelig kobling til beskrivelsen, slik at brukeren ser sammenhengen uten å flytte feltet.

## Ja til relasjonskategori

Vi legger til en femte pille: **Relasjonskategori**. Den svarer på hva slags forhold vi har til leverandøren, noe GDPR-rollen ikke sier noe om.

Valg (norsk / engelsk):
- SaaS-leverandør / SaaS vendor
- IKT-driftsleverandør / IT operations vendor
- Infrastrukturleverandør / Infrastructure vendor
- Rådgiver eller konsulent / Advisor or consultant
- Utviklingspartner / Development partner
- Bemanning og innleie / Staffing
- Fysisk tjeneste eller drift / Facilities or physical service
- Annet / Other
- Ikke satt / Not set

Panelet for pillen inneholder:
- Nedtrekksvalg for kategori.
- Kort forklaring på hva kategorien påvirker (typisk DORA-relevans for IKT-leverandører, underleverandørkjede for SaaS, tilgangsstyring for konsulenter).
- Et forslag fra agenten basert på leverandørens beskrivelse og bruksområde, som brukeren kan godkjenne eller overstyre — samme mønster som resten av siden.

Pilleraden går fra 4 til 5 elementer og beholder to kolonner (siste pille går over full bredde).

## Teknisk

- Feltet lagres i eksisterende kolonne `assets.vendor_category` — den finnes allerede og brukes i dag for verdier som `saas`, `it_operations`, `infrastructure`, `consulting`. Ingen databaseendring nødvendig.
- Nytt oppslag `src/lib/vendorRelationCategory.ts`: verdiliste, etiketter (nb/en), etikett-hjelper og en enkel forslagsfunksjon som utleder kategori fra navn, beskrivelse og bruks-tagger (samme keyword-tilnærming som `vendorContextSuggestion.ts`).
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: legg til pille-elementet `relation` i `pillItems` med select + forklaring + forslagsrad, lagring via eksisterende `handleFieldChange("vendor_category", ...)`.
- `ContextPillRow.tsx`: la siste pille spenne to kolonner når antallet er oddetall.
- GDPR-panelet får en kort setning som knytter rollen til relasjonskategorien når begge er satt.
- Ingen endring i lagringsformat andre steder — `vendor_category` leses allerede av oversikter og MCP-verktøyet, og nye verdier vises som etiketter der etiketthjelperen brukes.
