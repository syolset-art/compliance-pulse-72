# Integrasjoner — «Datakilder for automatisk kartlegging»

Nytt menypunkt under **Innstillinger → Integrasjoner** hvor brukeren kobler til eksterne systemer (Microsoft 365, Google Workspace, Okta, Defender for Cloud Apps, osv.). Lara-agenten bruker koblingene til å oppdage systemer og leverandører automatisk, og holder registeret oppdatert når noe legges til eller fjernes hos kilden.

Navneforslag på tjenesten (velges én):
- **Mynder Connect** — profesjonelt, matcher produktnavnene (Mynder Core, Mynder Trust).
- **Datakilder** — enkelt, norsk, selvforklarende.
- **Kildekoblinger** — nøytralt.

Anbefaling: **Mynder Connect** som produktnavn, «Integrasjoner» som menyetikett.

## Brukerflyt

1. Bruker åpner *Innstillinger → Integrasjoner*.
2. Ser en katalog av tilgjengelige kilder gruppert etter kategori (Identitet & SSO, Produktivitet, Skysikkerhet, Enhet/MDM, Fakturering/Regnskap, Egendefinert API).
3. Hver kilde vises som kort: logo, navn, kort beskrivelse, hva Lara henter (systemer / leverandører / brukere), status (Ikke tilkoblet / Aktiv / Feil / Utløpt) og «Koble til».
4. «Koble til» åpner en sikker dialog:
   - Forklarer hva som hentes og hvorfor (data-minimalisering).
   - Viser eksakte scopes/tillatelser som forespørres.
   - Data Processing-info (hvor lagres tokens, oppbevaringstid, revokering).
   - Knapp: *Start OAuth* (mock i prototype) eller *Lim inn API-nøkkel* for kilder uten OAuth.
5. Etter tilkobling: kort viser «Aktiv», sist synk-tidspunkt, antall oppdagede systemer/leverandører, og handlinger: *Synk nå*, *Se oppdagede elementer*, *Innstillinger*, *Koble fra*.
6. Oppdagede elementer havner i **Oppdag systemer**-flyten (finnes fra før) hvor bruker godkjenner/avslår før de blir aktive assets. Lara foreslår match mot eksisterende leverandører/systemer for å unngå duplikater.
7. Automatisk re-synk på intervall (daglig som default, justerbart). Ved endring hos kilden: nytt system → forslag i innboks; fjernet system → foreslått avvikling (arkivering, ikke sletting).
8. Aktivitet logges til eksisterende **Aktivitetslogg** (hvem koblet til, hvem godkjente forslag, feilede synk).

## Sikkerhet & tillit (synlig i UI)

- Badge «Kryptert lagring» på alle koblinger; forklaring i tooltip.
- Kun read-only scopes tilbys som default; write-scopes krever ekstra bekreftelse.
- «Test tilkobling» og «Revokér tilgang» alltid tilgjengelig.
- Feilstatus vises med tydelig CTA (*Koble til på nytt*) i stedet for å skjule feilen.
- Ingen hemmeligheter vises i klartekst etter lagring (maskering).

## Sider & komponenter (prototype, mock-data)

- `src/pages/Integrations.tsx` — hovedside med søk, kategorifilter, katalog-grid.
- `src/components/integrations/IntegrationCard.tsx` — kort med status-pill og handlinger.
- `src/components/integrations/ConnectIntegrationDialog.tsx` — sikker tilkoblingsdialog med scopes, personvern, tokens.
- `src/components/integrations/IntegrationDetailDrawer.tsx` — sist synk, oppdagede elementer, logg, farlige handlinger (koble fra).
- `src/lib/integrationCatalog.ts` — statisk katalog: id, navn, kategori, beskrivelse, henter (systemer/leverandører/brukere), scopes, auth-type.
- Ruting: `/settings/integrations` i `src/App.tsx`.
- Sidebar: legge til `{ name: "Integrasjoner", href: "/settings/integrations", icon: Plug }` i `settingsMenu` (og speile i partner-visning).
- Aktivitetslogg: nye event-typer `integration_connected`, `integration_synced`, `integration_disconnected` i `src/lib/activityLogData.ts`.

## Katalog (start-sett)

Identitet & SSO: Microsoft Entra ID, Google Workspace, Okta.
Produktivitet: Microsoft 365, Google Workspace, Slack.
Skysikkerhet / SaaS-oppdagelse: Microsoft Defender for Cloud Apps, Netskope.
Enhet/MDM: Intune, Jamf.
Fakturering/Regnskap (leverandøroppdagelse): Tripletex, Fiken, Xero.
Egendefinert: Generisk REST + CSV-import.

## Ute av scope (prototype)

- Faktisk OAuth mot providere — mockes med simulert flow som setter status «Aktiv».
- Kryptering av tokens — kun visuell indikator; ingen ekte lagring av hemmeligheter.
- Bakgrunnsjobb — «Synk nå» oppdaterer mock-data umiddelbart.
