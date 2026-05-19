# Sammenligning: dagens implementasjon vs Notion-spec

## Kort konklusjon

Dagens `/msp-services` er en **regelverks-orientert kalkulator** der partneren bygger sin egen katalog fra bunnen ved å hake av kontrollpunkter per regelverk. Notion-spec'en beskriver et **kuratert tjenestebibliotek eid av Mynder**, med 19 ferdige tjeneste-maler partneren *adopterer* (kopierer) inn i egen katalog. Det er to ganske ulike mentale modeller — vi har ca. 30 % av spec'en på plass.

## Hva som faktisk stemmer

- **Lara-foreslår + manuell knapp øverst til høyre** — matcher spec'ens "Lara kuraterer for partneren"
- **Egen katalog med adopterte tjenester** ("Egne tjenester"-listen i `MSPServiceCatalogTab`) — riktig konsept, men kilden er feil
- **Kobling mellom tjeneste og kontrollpunkter** via `ServiceMapping` og `serviceMappingSuggester` — stemmer med spec'ens "Foreslåtte kontrollpunkter den dekker"
- **Lara-estimat på timer × timepris** for framework-blokken — i tråd med "ikke per-KP timer/pris, grovt estimat"
- **Eksisterende `PARTNER_SERVICES` i `src/lib/serviceCatalog.ts`** inneholder allerede 17 tjenester (NIS2, DPIA, vCISO, vDPO, pentest, SOC, awareness, m.m.) — mye av råstoffet til biblioteket finnes, men det er **ikke koblet til /msp-services-siden** og mangler spec'ens metadata.

## Hva som mangler / avviker

### 1. Biblioteks-modellen (største gap)
- **Spec:** Mynder eier et versjonert bibliotek på 19 maler i tre lag (Universell / MSP / MSSP). Partner adopterer → kopi i partnerens katalog med template_id + version.
- **I dag:** Ingen "bibliotek vs adoptert"-skille. Partneren får forslag fra Lara basert på en wizard (segmenter/domener/modell/modenhet), men det er ikke et åpent bibliotek de kan bla i.
- **Mangler:** Bibliotek-side/-drawer, lag-inndeling (B1–B3 / MSP1–7 / MSSP1–9), "Adopter"-knapp, template-vs-instans-skille.

### 2. Metadata på hver tjeneste
Spec krever felter dagens `PartnerService` ikke har:
- `serviceType: "engangs" | "løpende"`
- `scope: "global" | "EU" | "NO" | "SE" | "NL" | "AU"`
- `partnerType: "MSP" | "MSSP" | "alle"`
- `industryTags: ("helse" | "finans" | "offentlig")[]`
- `estimatedHoursRange: [min, max]` (vi har bare `price`)
- `suggestedActivities: { label, hours }[]` (vi har `defaultChecklist` uten timer)
- `version` + `templateId`

### 3. Innhold — 19 spesifikke tjenester i spec
Mapping mot dagens `PARTNER_SERVICES`:

| Spec-tjeneste | Finnes i dag? |
|---|---|
| B1 GDPR-startkartlegging | Delvis (`q-gdpr-maturity`), men ikke som engangs-leveranse |
| B2 Spørreskjema-besvarelse (engangs) | Mangler |
| B3 Spørreskjema-beredskap (løpende) | Mangler |
| MSP1 GDPR-handlingsplan | Mangler |
| MSP2 Personvernerklæring + samtykke | Mangler |
| MSP3 DPA-gjennomgang | Finnes (`tpl-dpa-review`) |
| MSP4 vDPO | Finnes (`dpo` / `tpl-dpo`) |
| MSP5 Hendelseshåndteringsplan | Delvis (`incident-response`) |
| MSP6 Awareness-program | Finnes (`awareness` / `tpl-awareness`) |
| MSP7 Åpenhetsloven-rapportering | Finnes (`transparency` / `tpl-transparency`) |
| MSSP1 ISO 27001-forarbeid | Delvis (`q-iso-gap`) |
| MSSP2 ISO 27001 full sertifisering | Finnes (`iso27001` / `tpl-iso27001`) |
| MSSP3 NIS2-implementering | Finnes (`nis2` / `tpl-nis2`) |
| MSSP4 vCISO | Finnes (`vciso` / `tpl-vciso`) |
| MSSP5 Penetrasjonstest | Finnes (`pentest` / `tpl-pentest`) |
| MSSP6 Risikovurdering (omfattende) | Mangler |
| MSSP7 SOC 2 Type II-forberedelse | Delvis (`soc` heter SOC men beskrivelse uklar) |
| MSSP8 AI Act-kartlegging | Finnes (`ai-governance`) |
| MSSP9 DORA-rådgivning | Mangler |

**6 av 19 må produseres nytt**, resten må berikes med spec-metadata og lag-tilhørighet.

### 4. Lara-kurateringen
- **Spec:** Sorterer biblioteket basert på partnertype + kundeportefølje + eksisterende åpne KP hos kundene + tidskritiske frister + bransje-tagger
- **I dag:** Lara-wizard'en stiller fire generiske spørsmål (segmenter, domener, model, modenhet) og matcher på `tags`. Bruker ikke faktisk kundedata fra partnerens portefølje.

### 5. Versjonering og adopsjons-flyt
- **Spec:** Hver mal har versjonsnummer. Partner-kopi peker på `template_id` + `version`. Ved oppdatering får partner varsel med valg om migrering.
- **I dag:** Ingen versjonering, ingen referanse fra adoptert tjeneste tilbake til mal.

### 6. Lag 3 (land/bransje-spesifikke)
Spec lister 14 (NO/SE/NL/AU) som "aktiveres ved behov". Ingen av disse finnes i dag. AU-pakken (5 stk) er parkert til juni 2026.

## Anbefalte neste steg (i prioritert rekkefølge)

1. **Datamodell-utvidelse av `PartnerService`** med `serviceType`, `scope`, `partnerType`, `industryTags`, `tier` (B / MSP / MSSP), `estimatedHoursRange`, `suggestedActivities[]`, `version`, `templateId`.
2. **Berike de 13 eksisterende tjenestene** + skrive de 6 manglende (B2, B3, MSP1, MSP2, MSSP6, MSSP9) iht. spec-teksten.
3. **Ny "Tjenestebibliotek"-visning** (separat tab eller drawer på `/msp-services`) som viser maler gruppert i tre lag, med Lara-sortering på toppen og "Adopter"-knapp på hvert kort.
4. **Adopsjons-flyt:** "Adopter" oppretter en `ExtraService`-instans med `templateId`/`version` + lar partner overstyre navn/pris/aktiviteter (skjema vi allerede har i `CustomServiceDialog`).
5. **Smartere Lara-kuratering** som leser fra `useMSPCustomers`/porteføljedata (bransje, regelverk-aktiveringer, åpne KP) i stedet for wizard-svar.
6. **Versjonshåndtering** (Supabase-tabell `service_templates` + `partner_services` med `template_id` og `template_version`) — kan vente til etter MVP.
7. **Lag 3** (land-spesifikke) som egen seksjon nederst i biblioteket, default skjult, foreslås av Lara når relevant.

## Spørsmål som bør avklares før implementasjon

1. Skal biblioteket leve som **statisk TS-fil** (slik `PARTNER_SERVICES` gjør i dag) eller flyttes til Supabase-tabell med en gang (åpner for versjonering og admin-redigering uten kodeendring)?
2. Skal "Adopter"-flyten erstatte dagens framework-coverage-modus, eller leve **side om side** (framework-kalkulator = "bygg selv", bibliotek = "start fra mal")?
3. Hvor skal Lag 3-tjenestene fysisk leve — i samme array, eller egen `LOCAL_SERVICE_LIBRARY` per jurisdiksjon?
4. Bransje-tagger: holder vi oss til spec'ens tre (helse, finans, offentlig) i MVP, eller åpner vi for fri tagging?

Si fra hvilke av disse stegene du vil ta først, så lager jeg en konkret implementasjonsplan for det.
