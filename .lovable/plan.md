
# Partner-tagging av kunder

## Mål
90% av kundene kommer via en MSP/MSSP/IT-partner. Vi trenger ett tydelig sted hvor det fremkommer **hvem som er kundens partner**, og denne taggen må:
- settes automatisk når en partner oppretter kunden,
- kunne settes manuelt for direktekunder (10%) som ønsker å koble på en partner i ettertid,
- være synlig på tvers av plattformen (intern bruk + Trust Profile utad).

## Hvor lagres det

Utvid `company_profile` (kundens egen organisasjon) med:
- `partner_company_id` — referanse til partnerens organisasjon (nullable)
- `partner_name` — denormalisert visningsnavn (nullable, fallback når relasjonen er ekstern)
- `partner_type` — enum-tekst: `msp`, `mssp`, `it_partner`, `consultant`, `other`
- `partner_role_description` — kort fritekst (f.eks. "Drift + sikkerhetsovervåking")
- `partner_since` — dato
- `managed_by_partner` — boolean (default false; settes true når partner_company_id finnes)

Dette holdes på `company_profile` (ikke `msp_customers`) fordi:
- relasjonen tilhører kunden, ikke partneren,
- direktekunder skal også kunne sette en partner uten at vi har en `msp_customers`-rad,
- gjør det enkelt å vise "Managed by X" i kundens egen UI uten join mot MSP-tabeller.

`msp_customers` beholdes som partnerens portefølje-view, men ved opprettelse skal den **auto-skrive partner-feltene over på kundens `company_profile`**.

## Hvor det vises

1. **Sidebar / Org-switcher (alle sider)**
   Liten "Managed by [partner]"-chip under organisasjonsnavnet. Subtil, ikke fargesterk.

2. **Top bar / dashboard-header**
   Ett tynt grått ribbon øverst på dashbordet for kunder med partner: "Administrert av Acme IT — kontakt partner" med liten lenke til partnerinfo-drawer.

3. **Admin → Organisasjon** (`AdminOrganisation.tsx` / `CompanyInfoForm.tsx`)
   Egen seksjon "Partner og leveranse" med alle feltene over. For partner-eide kunder vises feltet som lest med liten "Endre"-knapp som krever bekreftelse (forhindrer at sluttkunden ved et uhell kobler fra partneren).

4. **Trust Profile (utad)**
   Under "Om virksomheten" vises "Drift og sikkerhet leveres av: [partner]" — bygger tillit, og er ofte etterspurt i due diligence. Kan skjules av kunden hvis ønsket (toggle på partner-seksjonen).

5. **MSP Partner Dashboard**
   Allerede viser kundeporteføljen. Nytt: når partner oppretter en kunde via wizard, vises bekreftelse "Kunden er nå tagget som administrert av [partner]".

6. **Filter og rapporter**
   Mulighet til å filtrere lister (vendors/systems/assets) på "Administrert av partner" vs "Direktekunde", og inkludere det i eksporterte rapporter.

## Onboarding-effekt

- **Partner-opprettet kunde:** Når MSP fyller ut "Ny kunde"-wizard, settes partner-feltene automatisk på kundens `company_profile`. Kunden ser ved første innlogging et lite banner: "Profilen din administreres av [partner]. De har satt opp kontoen for deg."
- **Direktekunde:** I onboarding-flyten legges et valgfritt steg "Har dere en IT- eller sikkerhetspartner?" med to valg: "Ja, koble til" (søk i partnerregister eller skriv inn manuelt) / "Nei, vi gjør dette selv". Kan hoppes over og legges til senere fra Admin → Organisasjon.

## Tagger og navigering

På alle steder hvor en kundeorganisasjon vises i lister (admin-vyer, søk, MSP-portefølje), legg til en liten **partner-chip** ved siden av navnet:
- Med partner: `🤝 Acme IT` (nøytral grå pille)
- Uten partner: ingen chip (ikke "Direkte" — unngår støy)

## Tekniske notater

- Ny migrasjon på `company_profile` med feltene over.
- Trigger eller applikasjonslogikk: når `msp_customers` opprettes, skriv `partner_company_id`/`partner_name`/`partner_type='msp'`/`managed_by_partner=true` på matchende `company_profile`-rad.
- Lite hook `usePartnerInfo(companyId)` som returnerer `{ hasPartner, partnerName, partnerType, partnerRoleDescription }` og brukes av sidebar-chip, dashboard-ribbon, Trust Profile-seksjonen og admin-skjemaet.
- Trust Profile får ny visningsmodul `PartnerDeliverySection` styrt av en boolean `show_partner_on_trust_profile` (default true for partner-opprettede kunder, false ellers).

## Avgrensning (gjør IKKE nå)

- Ingen multi-partner-støtte i v1 (én partner per kunde). Hvis behovet melder seg senere, lager vi en `company_partners`-tabell med rolle per partner.
- Ingen automatisk fakturering eller revenue-share i denne PRen — kun relasjon og synlighet.
- Ingen endringer i RBAC: partner ser fortsatt sin egen MSP-konsoll, kunden ser sin egen konsoll. Partner-chip er kun visuell informasjon.
