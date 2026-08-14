# Mynder — total oversikt over arbeidsflyter

Dette dokumentet beskriver alle arbeidsflyter i plattformen: hva som alltid er tilgjengelig uavhengig av produkt, og hva som følger av hvert aktiverte produkt. Statusfeltet viser hvor langt prototypen er kommet.

Statuskoder: **Implementert** = finnes i prototypen, **Delvis** = finnes, men ikke komplett, **Planlagt** = beskrevet målbilde, ikke bygget.

---

## 1. Plattformkart

### Alltid tilgjengelig (uavhengig av produkt)

| Område | Rute | Status |
| --- | --- | --- |
| Dashbord (varianter: core / trust-only / partner) | `/` | Implementert |
| Regelverk | `/regulations` | Implementert |
| Regelverk (agentisk beta) | `/regulations-beta` | Implementert |
| Regelverksdetalj | `/regulations/:frameworkId` | Implementert |
| Meldinger / kundeforespørsler | `/customer-requests` | Implementert |
| Laras innboks | `/lara-inbox` | Implementert |
| Trust Center (hub, profil, dokumenter, deling) | `/trust-center/*` | Implementert |
| Rapport / compliance-oversikt | `/reports/compliance` | Implementert |
| Innstillinger (person) | `/settings` | Implementert |
| Innstillinger (virksomhet) | `/company-settings` | Implementert |
| Aktivitetslogg | `/activity-log` | Implementert |
| Avtaler og vilkår | `/terms`, `/legal`, `/terms-and-consent` | Implementert |

### Mynder Core

| Område | Rute | Status |
| --- | --- | --- |
| Core-dashbord | `/dashboard-core` | Implementert |
| Arbeidsområder | `/work-areas` (alias `/services`) | Implementert |
| Systemer | `/systems`, `/systems/:id` | Implementert |
| Eiendeler | `/assets`, `/assets/:id` | Implementert |
| Prosessprofil | `/processes/:id` | Implementert |
| Behandlingsprotokoll (RoPA) | `/protocols` | Implementert |
| Avviksregister | `/deviations` | Implementert |
| Oppgaver (Aktivitet) | `/tasks` | Implementert |
| Modenhet / kontrollområder | `/maturity`, `/controls` | Implementert |
| Compliance-kalender | `/compliance-calendar` | Implementert |

### Leverandørmodulen

| Område | Rute | Status |
| --- | --- | --- |
| Leverandøroversikt (dashbord + liste) | `/vendors` | Implementert |
| Leverandørprofil (arkfaner) | `/assets/:id` (asset_type = vendor) | Implementert |
| Leverandørrapporter | `/vendors/reports` | Implementert |

### Partner (MSP)

| Område | Rute | Status |
| --- | --- | --- |
| Partner-dashbord | `/msp-partner` | Implementert |
| Muligheter | `/msp-partner/muligheter` | Implementert |
| Kundeoversikt / kundekort | `/msp-dashboard`, `/msp-dashboard/:customerId` | Implementert |
| Produkter og tjenester (katalog) | `/msp-services` | Implementert |
| Lisenser og fakturagrunnlag | `/msp-licenses`, `/msp-invoices` | Implementert |
| Kommunikasjon (e-post) | `/emails`, `/msp-messages` | Implementert |
| Partnerinnstillinger og fakturainnstillinger | `/msp-settings`, `/msp-billing` | Implementert |

---

## 2. Alltid tilgjengelig — kjerneflyter

### 2.1 Regelverk (Compliance)

**Formål:** styre hvilke regelverk virksomheten er i scope for, og dokumentere status per krav.
**Hvem:** compliance-ansvarlig, DPO, CISO, daglig leder.

Steg:
1. Velg regelverk i scope (lovpålagt vs. anbefalt; Lara gir initiell vurdering basert på land, bransje og virksomhetsbeskrivelse).
2. Åpne et regelverk — krav grupperes per kontrollområde (Styring, Drift, Identitet og tilgang, Personvern, Leverandør).
3. Filtrer på status eller på «Bevis» for å se kun krav med dokumentasjon.
4. Sett status per krav: **Ja, dette oppfylles** / **Ikke relevant for oss** / **Ikke påbegynt**. Brukeren kan alltid overstyre autogenerert vurdering.
5. Knytt bevis (dokumentasjon) til kravet. KI analyserer dokumentet og foreslår hvilke krav/artikler det dekker.
6. Verifiser bevis — bekreft uavhengig part der det kreves.
7. Generer rapport: alle regelverk i scope, med/uten bevisfilter.

Status: Implementert. Agentisk beta-visning (`/regulations-beta`) med Laras statusrapport og arbeidskø ligger som eget valg via visningsbryteren.

### 2.2 Meldinger og forespørsler

**Formål:** motta og besvare compliance-forespørsler fra kunder og partnere.

Steg: motta melding → les og se hvilken kunde/leverandør den gjelder → svar eller opprett aktivitet → frist overvåkes → arkiver.

Status: Implementert.

### 2.3 Trust Center

**Formål:** vise virksomhetens compliance utad, og dele dokumentasjon kontrollert.

Steg: aktiver Trust Center → fyll ut profil (organisasjon, tjenester/produkter) → last opp masterdokumenter → velg hva som er offentlig vs. delt via lenke → del lenke (`/s/:token`) → følg visninger.

Status: Implementert.

---

## 3. Mynder Core — oppstartsløype

Naturlig rekkefølge etter aktivering av Mynder Core:

### Steg 1 — Opprett arbeidsområder og sett ansvarlig
Arbeidsområdet er konteksten rundt systemene, f.eks. «Økonomi og regnskap». Eier settes per arbeidsområde.
Rute: `/work-areas`. Status: Implementert.

### Steg 2 — Inviter deltakere
Én person kan være ansvarlig for flere arbeidsområder. Roller: Arbeidsområde-eier og medlem, med lese- eller skrivetilgang.
Rute: `/work-areas` + tilgangsstyring i innstillinger. Status: Implementert.

### Steg 3 — Bygg kontekst i arbeidsområdet
Knytt systemer (f.eks. Fiken), leverandøravtaler og dokumenter til arbeidsområdet, slik at alt som hører sammen ligger samlet.
Status: Implementert.

### Steg 4 — Autogenerert RoPA per system
For hvert system i arbeidsområdet kan Lara generere behandlingsaktivitet (formål, kategorier personopplysninger, behandlingsgrunnlag, mottakere, lagringstid).
Status: Delvis (autogenerering finnes, full redigeringsflyt varierer per systemtype).

### Steg 5 — Prosesser i arbeidsområdet
Lara foreslår prosesser knyttet til arbeidsområdet. For hver prosess vurderes:
- **Kritikalitet** (konfidensialitet, integritet, tilgjengelighet)
- **Risiko** (avledet av Lara fra registrerte data)
- **Bruk av AI** (om prosessen involverer AI-systemer og hvilken risikoklasse)

Rute: `/processes/:id`. Status: Delvis (kritikalitetsvurdering finnes; forslag til prosesser og AI-vurdering er delvis).

### Avviksregister
Registrer avvik, koble til system eller leverandør, sett ansvarlig, følg til lukking. Avvik påvirker score.
Rute: `/deviations`. Status: Implementert.

### Oppgaver (Aktivitet)
Opprett egne oppgaver, f.eks. DPIA eller ROS. Felt: tittel, beskrivelse, tilknyttet system/leverandør, ansvarlig, deltakere, frist, prioritet (0 Kritisk – 3 Lav), status.
Rute: `/tasks`. Status: Implementert.
**Planlagt:** kobling mot modenhetsvurdering slik at plattformen foreslår oppgaver som kreves for å heve modenhet på et kontrollområde.

### Behandlingsprotokoll
Samlet oversikt over alle behandlingsaktiviteter registrert på tvers av arbeidsområdene, med eksport.
Rute: `/protocols`. Status: Implementert.

### Rapport
Modenhetsvurdering per kontrollområde og samlet, med utvikling over tid.
Rute: `/reports/compliance`, `/maturity`. Status: Implementert.

---

## 4. Leverandørmodulen

### 4.1 Oversikt
Dashbord med nøkkeltall (antall leverandører, kritikalitet, manglende dokumentasjon, avvik) og listevisning der man kan gå inn på én og én leverandør.
Rute: `/vendors`. Status: Implementert.

### 4.2 Leverandørprofil

| Arkfane | Innhold | Status |
| --- | --- | --- |
| Oversikt | Lovpålagte vs. anbefalte regelverk for leverandøren, mulighet for å legge til regelverk med KI-initiell vurdering, modenhet per kontrollområde, aktivitetslogg | Implementert |
| Bruk og kontekst | Kritikalitet (brukervalg), prioritet P0–P3 (Lara foreslår, bruker kan overstyre med begrunnelse), GDPR-rolle (databehandler/behandlingsansvarlig), beskrivelse av prosesser som bruker leverandøren | Implementert |
| Dokumentasjon | Last opp interne dokumenter; se eksterne dokumenter leverandøren har sendt (f.eks. pentestrapport) og godkjenn dem; utløpsdato og gyldighet | Implementert |
| Forespørsler | Oversikt over mottatte meldinger fra leverandøren, lesing og oppfølging | Implementert |
| Veiledning fra Mynder | Laras agentiske forslag til neste steg, inkludert anbefalt innhentingsmetode per leverandør | Implementert |

### 4.3 Kapasitet og nivå
Inntil 5 leverandører gratis. Ved forsøk på nummer 6 kreves nivåendring — hard grense, ingen situasjon med gratisnivå og 11 leverandører.
Status: Implementert.

---

## 5. Trust Center som produkt

Aktivering → profil → dokumenter → publisering. Egen pris per måned. Kan aktiveres direkte, eller tilbys av partner.
Status: Implementert.

---

## 6. Innstillinger (virksomhet)

| Seksjon | Innhold | Status |
| --- | --- | --- |
| Organisasjon | Navn, org.nr., bransje, land, antall ansatte, geografisk virkeområde, nøkkelpersoner (DPO, CISO, compliance-ansvarlig), driftspartner | Implementert |
| Produkter | Aktivere produkt, endre nivå opp/ned, avvikle. Alle produkter følger samme flyt: **Aktiver → vilkår (Terms Gate) → kvittering med lenke videre**. Avvikling gir informasjon om datauttrekk og fakturastopp | Implementert |
| Tilgangsstyring | Inviter brukere på e-post, tildel nøkkelroller (daglig leder, personvernombud, sikkerhetsansvarlig, compliance-ansvarlig, AI-governance, operativ bruker), sett lese- eller skrivetilgang, se brukerprofil med aktiviteter, fjern bruker | Implementert |
| Aktivitetslogg | Hvem gjorde hva og når, på tvers av moduler | Implementert |
| Avtaler og vilkår | Vilkår, personvernerklæring, databehandleravtale — hver som eget punkt i undermenyen, med akseptlogg og versjonshistorikk | Implementert |
| Integrasjoner og MCP | Koble på egne kilder (i dag Acronis), MCP-agentkoblinger | Implementert |

Flyt for produktendring (gjelder alle produkter):

```text
[Aktiver / Endre nivå / Avvikle]
        |
        v
[Vilkårssteg: aksepter vilkår + evt. driftspartner-rolle]
        |
        v
[Kvittering: hva ble endret, når det faktureres, lenke til å komme i gang]
```

---

## 7. Min profil (innlogget bruker)

| Seksjon | Innhold | Status |
| --- | --- | --- |
| Profil | Navn, e-post, rolle i organisasjonen, kontaktinfo, varslingspreferanser | Implementert |
| Språk | Norsk / engelsk (i18next) | Implementert |
| Modus | Mørk / lys | Implementert |
| Mine avtaler | Se hvilke vilkår og avtaler jeg har akseptert, med dato og versjon | Implementert |
| Wiki-/kunnskapssenter | Les om hvordan ting virker: modenhetsmodellen (0–4), de fem kontrollområdene, kritikalitet vs. avledet risiko, Laras tre autonominivåer, bevis vs. dokumentasjon, prioritet P0–P3 | Delvis (`/resources/*`, `/resources/maturity`, `/resources/controls`, hjelpepaneler per side) |

---

## 8. Tverrgående flyter

| Flyt | Beskrivelse | Status |
| --- | --- | --- |
| Produktaktivering | Aktiver → vilkår → kvittering. Lik for alle produkter | Implementert |
| Avvikling | Kort dialog, informasjon om at datauttrekk kommer, e-post for varsling, fakturastopp | Implementert |
| Laras arbeidskø | Kompakt liste over hva som kan aktiveres, godkjennes som bevis, godkjennes som rapport, revideres eller kartlegges. Godkjenning skjer i eget gjennomgangsvindu, aldri med ett klikk | Implementert |
| Koble på deg selv | Kontekstuelle CTA-er der data mangler: koble Microsoft 365, Google, Acronis, MCP, eller last opp Excel | Implementert |
| Oppdag systemer | Automatisert systemkartlegging via integrasjon, med Lara som forslagsstiller | Implementert |
| Aktivitetslogg | Alle handlinger samlet, med lenke fra widgeter | Implementert |

---

## 9. Partner (MSP) — kort

| Flyt | Beskrivelse | Status |
| --- | --- | --- |
| Legg til kunde | 3-stegs onboarding med berikelse fra nettside og personvernerklæring, og KI-anbefaling av regelverk | Implementert |
| Behovsanalyse | Finn kunder som matcher utvalgte regelverk, beregn salgspotensial, lag bulk-tilbud | Implementert |
| Kundekort | Lovpålagte og anbefalte regelverk, anbefalte produkter og tjenester, modenhetsspeil per kontrollområde, neste anbefalte tiltak | Implementert |
| Produkter og tjenester | Egen katalog (default) + Mynder-produkter for videresalg med fast provisjon og valgfritt etableringsgebyr; hver tjeneste viser hvilke krav den dekker og rolle (Direkte tiltak, Muliggjørende, Dokumenterende, Vurderende) | Implementert |
| Tilbud | Fra anbefaling til tilbud på tre klikk, med manuell overstyring av KI-forslag | Implementert |
| Fakturagrunnlag | Aktiverte produkter og tjenester per kunde, månedlig abonnement og fastprisprosjekter, eksport til PDF med partnerlogo | Implementert |
| Tilgang i partnerteam | Medlemmer med roller (kundeansvarlig, driftspartner), lese/skrive per kunde eller globalt | Implementert |

---

## 10. Gap-liste — hva som gjenstår

| Gap | Beskrivelse | Prioritet |
| --- | --- | --- |
| Oppgaver ↔ modenhet | Oppgaver foreslås ikke automatisk ut fra hva som kreves for å heve modenhet på et kontrollområde | Høy |
| Prosessforslag per arbeidsområde | Lara foreslår ikke systematisk prosesser knyttet til arbeidsområdet | Høy |
| AI-vurdering per prosess | Vurdering av AI-bruk per prosess er ikke komplett (risikoklasse, dokumentasjonskrav etter AI Act) | Middels |
| Wiki-senter | Kunnskapsinnhold ligger spredt i hjelpepaneler og ressurssider; mangler ett samlet wiki-senter i profilvisningen | Middels |
| RoPA-redigering | Autogenerert RoPA per system er ikke like komplett for alle systemtyper | Middels |
| Datauttrekk ved avvikling | Nedlasting av egne data er varslet, men ikke implementert | Middels |
| `vendor_documents.expires_at` | Klienten spør etter en kolonne som ikke finnes i databasen; gir 400 i leverandørprofilen | Høy (teknisk) |

---

## Ordliste

| Begrep | Betydning |
| --- | --- |
| Kontrollområde | Ett av fem kjerneområder: Styring, Drift, Identitet og tilgang, Personvern, Leverandør |
| Modenhet | Skala 0–4 per kontrollområde og samlet |
| Kritikalitet | Brukerens eget valg (nøytral pille) |
| Risiko | Avledet av Lara fra registrerte data (statusfarge + Lara-ikon + forklaring) |
| Bevis | Tillitsgraden — at noe er dokumentert og verifisert |
| Dokumentasjon | Selve filen som ligger til grunn |
| Aktivitet | Plattformens navn på oppgaver |
| Eiendel | Norsk betegnelse på asset |
| Lara | Plattformens AI-agent, med tre autonominivåer: Automatisk, Assistert, Manuell |
