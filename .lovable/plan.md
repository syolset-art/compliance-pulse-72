## Mål

Partneren skal kunne legge inn nøkler til eksterne portaler (Acronis, Microsoft 365, 7Security, NinjaOne osv.) **én gang** på partnernivå og gjenbruke dem når de kobler eller henter kundedata — slik at de slipper å lime inn API-nøkkelen for hver enkelt kunde slik flyten er i dag (`AcronisConnectDialog` → step 1).

## Plassering

Ny arkfane **"Integrasjoner"** lengst til høyre i `MSPPartnerSettings` (etter «Generelt» og «Tilbudsmerking»). Tilgjengelig på `/msp-settings`.

```text
[ Generelt ] [ Tilbudsmerking ] [ Integrasjoner ]  ← ny
```

## Hva fanen inneholder

Et katalogkort per støttet leverandør, basert på `integration_providers`-tabellen:

- Logo / ikon, navn, kort beskrivelse
- Statuspille: **Tilkoblet** / **Ikke tilkoblet** / **Feil**
- Knapp: «Koble til» eller «Administrer»
- Liste over hvilke felt nøkkelen brukes på (f.eks. "Henter device- og backup-status til kundekort")

Klikk på «Koble til» åpner en dialog med feltene leverandøren krever:
- Acronis: `tenant_id` + `api_key` + (valgfritt) `region/datacenter`
- Microsoft 365: `tenant_id` + `client_id` + `client_secret`
- 7Security: `api_key`
- Generisk «Annen portal»: navn + base-URL + nøkkel

Når partner lagrer:
1. Test-tilkobling kjøres (kall mot leverandøren via edge function, eller mock i demo)
2. Nøkkelen lagres kryptert i `integration_connections` med `scope = 'partner'` (ikke per kunde)
3. Audit-linje skrives til `integration_audit_log`

## Gjenbruk på tvers av kunder

`AcronisConnectDialog` (og tilsvarende koblingsdialoger) endres slik:
- Sjekk først om det finnes en `partner`-scoped connection for Acronis
- Hvis ja → hopp over API-nøkkel-steget, vis kun «Velg tenant for {kunde}» og bruk partnerens nøkkel
- Hvis nei → fall tilbake til dagens flyt (lim inn nøkkel der og da), med en lenke «Lagre denne nøkkelen for alle kunder» som tar deg til Integrasjoner-fanen

`sync-acronis` edge function endres til å foretrekke partner-nøkkel når kunde-spesifikk nøkkel mangler.

## Sikkerhet

- Nøkler lagres aldri i klienten — kun referanse til `integration_connections.id`
- Hemmelige verdier (api_key/client_secret) lagres som Supabase secret eller kryptert kolonne; UI viser maskert (`••••••••1234`)
- RLS: kun brukere med MSP-partner-rolle i samme org kan lese/skrive partner-scoped connections
- Rotér / slett-knapp pr. integrasjon, med bekreftelsesdialog som lister antall kunder som vil miste tilkoblingen

## Teknisk

- Ny komponent: `src/components/msp/PartnerIntegrationsTab.tsx`
- Ny dialog: `src/components/msp/PartnerIntegrationConnectDialog.tsx` (generisk, drevet av provider-schema)
- Hook: `usePartnerIntegrations()` som henter alle `integration_connections` der `scope='partner'` for aktiv org
- Migrasjon: legg til kolonnen `scope text not null default 'customer'` på `integration_connections` (sjekk om den allerede finnes) + indeks på `(org_id, provider_id, scope)`
- `sync-acronis` + `AcronisConnectDialog` oppdateres til å lese partner-scope først
- i18n-strenger i `src/locales/nb.json` + `en.json`

## Out of scope (foreslår å ta senere)

- OAuth-flyt for Microsoft/Google (krever callback-URL + app-registrering — kan legges på etterpå)
- Webhook-mottak fra leverandørene
- Per-bruker (ikke per-partner) nøkler
