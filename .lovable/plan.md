# Leverandørfanen «Forespørsler» blir en leverandør-filtrert Meldinger-visning

I dag er fanen på leverandørprofilen en helt egen komponent med demo-kort («Mottatte meldinger», «Legg til i profil», fremdriftsindikator). Den deler ingen kode med menypunktet Meldinger. Målet er at fanen ser og oppfører seg nøyaktig som Meldinger, men bare viser det som er utvekslet med akkurat denne leverandøren.

## Slik blir det

Fanen får samme oppbygging som siden Meldinger:

- To underfaner: **Innboks** og **Utgående**, med samme kort, statusfarger, filterrader og handlinger.
- Ingen sidetittel/ingress (den hører hjemme på menysiden), og ingen forklaringsboks.
- Teller-badge på Innboks viser kun antall ubehandlede meldinger for denne leverandøren.
- «Ny melding»-knapp øverst i fanen, med leverandøren forhåndsvalgt i sende-veiviseren.
- Tom tilstand: «Ingen meldinger utvekslet med denne leverandøren ennå».

Fanen døpes om fra «Forespørsler» til **Meldinger** slik at språket er likt i menyen og på leverandøren.

## Slik filtreres innholdet

- **Innboks – Lara-meldinger:** knyttes via koblingen til leverandøren som allerede finnes på hver innboks-post (matchet ressurs).
- **Innboks – manuelle meldinger:** disse har i dag ingen kobling til leverandør, kun kundenavn. De filtreres derfor på navnematch mot leverandøren (navn/leverandørnavn, ikke-case-sensitivt).
- **Utgående:** forespørsler lagres lokalt med leverandørnavn. De filtreres på samme navnematch, og nye utgående forespørsler lagres heretter også med leverandør-ID slik at koblingen blir presis over tid.

## Teknisk

- `UnifiedInboxContent` får valgfrie props `assetId` og `vendorName`. Når de er satt: `lara_inbox`-spørringen filtreres på `matched_asset_id = assetId`, og `customer_compliance_requests` filtreres klientside på `customer_name` mot leverandørnavn. Uten props er oppførselen uendret (global visning).
- `OutboundRequestsTab` får valgfrie props `assetId` og `vendorName` og filtrerer listen tilsvarende. `OutboundRequest` utvides med `vendor_id?: string`, som settes i `handleSend` (vendorIds finnes allerede der).
- Ny komponent `VendorMessagesTab` (i `src/components/asset-profile/tabs/`) som holder de to underfanene og gjenbruker `UnifiedInboxContent`, `OutboundRequestsTab` og `SendRequestWizard`.
- `AssetTrustProfile.tsx`: `TabsContent value="requests"` for leverandør bytter fra `CustomerRequestsTab` til `VendorMessagesTab` med `assetId`/`vendorName`. Selv-profilen (isSelf) beholder dagens `CustomerRequestsTab`, siden den handler om innkommende kundeforespørsler til egen organisasjon.
- Fane-etiketten «Forespørsler» endres til «Meldinger»/«Messages» i leverandørens fanedefinisjon.

## Merknad

Manuelle meldinger og utgående forespørsler har ingen database-kobling til leverandør i dag, så filteret bygger på navnematch. En senere migrering kan legge til en `asset_id`-kolonne på `customer_compliance_requests` for eksakt kobling – si fra hvis det skal med nå.
