# Kampanjer & felles utsendelser til kunder

Partner skal kunne sende én melding eller ett tilbud til mange kunder samtidig — målrettet etter regelverksbehov, tjeneste-gap eller modenhet. Vi bygger dette inn i den eksisterende **Innboks**-siden (`/msp-messages`) som et naturlig sidestykke til 1:1-meldingene.

## Brukerflyt

1. **Innboks** får en ny knapp: **«Ny kampanje»** ved siden av filterne.
2. Klikk åpner en 3-stegs Lara-dialog:
   - **Steg 1 — Målgruppe**: velg kunder via segmentering eller manuell plukking.
   - **Steg 2 — Innhold**: velg type (kampanje-melding eller tilbud), knytt evt. en tjeneste fra katalogen, og la Lara skrive utkast.
   - **Steg 3 — Forhåndsvis & send**: per-kunde preview med flettetags, mulig å hoppe over enkelte før utsendelse.
3. Etter sending vises kampanjen som **én rad** i Innboks (gruppert), utvidbar til å se status per mottaker (sendt / åpnet / svart / akseptert).

## Steg 1 — Målgruppe (Lara-segmentering)

Hurtigvalg som er typiske MSP-bruksmønstre:

- **Regelverk-gap**: «Alle som trenger NIS2-vurdering», «Mangler ISO 27001-grunnlag», «Ikke startet GDPR-protokoll», «Berørt av åpenhetsloven uten redegjørelse», «AI-systemer uten DPIA».
- **Modenhet**: «Lav modenhet i Privacy», «Risiko < 50 %».
- **Tjeneste-gap**: «Har ikke kjøpt vCISO», «Ingen pågående leveranse».
- **Aktivitet**: «Aktiverte Trust-profil siste 30 dager, ikke fullført», «Ingen kontakt på 60 dager».
- **Kritikalitet**: «Kritisk infrastruktur», «Offentlig sektor».

Brukeren kan også:
- Krysse av kunder manuelt fra en søkbar liste.
- Kombinere flere segmenter (AND/OR).
- Se telleren oppdatere seg live: *«23 av 47 kunder treffer kriteriene»*.

## Steg 2 — Innhold

Tre maler å velge mellom:

1. **Kampanje-melding** (informativ, ingen pris) — f.eks. «Nytt om NIS2 — viktig for dere».
2. **Tilbud** — knytt til en tjeneste fra katalogen (`PARTNER_SERVICES`); pris, sjekkliste og rammeverk-mapping arves automatisk.
3. **Påminnelse / oppfølging** — gjenbruker mønsteret som finnes i Laras 1:1-forslag i dag.

Lara genererer et utkast basert på valgt segment + mal, med flettetags:
`{{kunde}}`, `{{kontaktperson}}`, `{{regelverk}}`, `{{frist}}`, `{{partner}}`.

Felter:
- Emne (for e-post)
- Brødtekst (Textarea, redigerbar)
- Vedlegg / lenker (valgfritt — lenke til ressurs eller tjenestesiden)
- Kanal: e-post (default) — SMS/telefon kan komme senere

## Steg 3 — Forhåndsvis & send

- Liste over alle mottakere med personalisert preview (flettetags er løst opp).
- Per-kunde toggle for å hoppe over enkeltkunder.
- Per-kunde override-felt for små justeringer (f.eks. annen frist).
- «Send nå» eller «Planlegg sending» (dato/tid).
- Confirm-toast: *«Kampanje sendt til 23 kunder»*.

## Innboks-integrasjon

Etter sending dukker kampanjen opp øverst i listen som én **gruppert rad**:

```text
🟣  NIS2-kampanje — Tilbud sendt
    23 mottakere · 0 svar · sendt nå
    [▾ Vis alle 23 mottakere]
```

Utvidet visning lister hver kunde som vanlige `out`-rader (gjenbruker `Row`-komponenten) med individuell status (sendt / åpnet / akseptert / avvist). Lara kan foreslå oppfølging på de som ikke har svart etter X dager — gjenbruker eksisterende `LARA_PROPOSALS`-mekanisme.

## Filtertillegg

Nytt filter-chip: **«Kampanjer»** som viser kun grupperte utsendelser. Eksisterende filtre (Akseptert/Avvist/Venter) fungerer da på tvers av både 1:1 og kampanje-mottakere.

## Tekniske detaljer

**Demo-først, persistens senere.** Vi starter med lokal state (samme mønster som dagens `ITEMS`/`LARA_PROPOSALS`) for raskt å validere UX. Når flyten er godkjent kan det persisteres mot Supabase.

Filer som berøres:
- `src/pages/MSPMessages.tsx` — ny «Ny kampanje»-knapp, ny gruppert rad-type, nytt filter.
- `src/components/msp/CampaignWizardDialog.tsx` *(ny)* — 3-stegs dialog (steg 1/2/3).
- `src/components/msp/CampaignSegmentBuilder.tsx` *(ny)* — Lara-hurtigvalg + manuell plukking.
- `src/lib/campaignSegments.ts` *(ny)* — definisjon av segmenter (id, label, beskrivelse, predikat-funksjon mot kundeliste).
- `src/lib/serviceCatalog.ts` — gjenbrukes for å koble tilbud til en katalog-tjeneste.

Datakilder for segmentering (alle finnes allerede):
- `msp_customers` — kundeliste (sektor, kritikalitet, modenhet).
- `assets` (self) — Trust-profil status.
- `vendor_documents` / framework-status — hvilke regelverk som er dekket.
- Tjenestekatalogens `publishedToCustomers` — hvilke tjenester kunder allerede ser.

Senere persistens (eget steg, ikke nå):
- Tabell `msp_campaigns` (id, partner_id, name, segment_json, template_id, body, sent_at).
- Tabell `msp_campaign_recipients` (campaign_id, customer_id, status, opened_at, responded_at).

## Avgrensninger (gjøres ikke nå)

- Ingen reell e-postutsendelse — vises som «sendt» i UI. E-postintegrasjon (Lovable Emails) tas som eget steg når flyten er godkjent.
- Ingen A/B-testing eller avansert kampanje-statistikk.
- Ingen SMS/telefon — kun e-post i første versjon.
