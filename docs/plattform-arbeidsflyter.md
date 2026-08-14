# Mynder — total oversikt over arbeidsflyter

Dette dokumentet beskriver alle arbeidsflyter i plattformen: hva som alltid er tilgjengelig uavhengig av produkt, og hva som følger av hvert aktiverte produkt. Statusfeltet viser hvor langt prototypen er kommet.

Statuskoder: **Implementert** = finnes i prototypen, **Delvis** = finnes, men ikke komplett, **Planlagt** = beskrevet målbilde, ikke bygget, **Ikke bekreftet** = må verifiseres før den regnes som ferdig.

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
| Trust Center (hub, profil, dokumenter, deling) | `/trust-center/*`, `/s/:token` | Delvis |
| Rapport / compliance-oversikt | `/reports/compliance` | Implementert |
| Innstillinger (person) | `/settings` | Implementert |
| Innstillinger (virksomhet) | `/company-settings` | Implementert |
| Aktivitetslogg | `/activity-log` | Implementert |
| Avtaler og vilkår | `/terms`, `/legal`, `/terms-and-consent` | Implementert |

### Core

| Område | Rute | Status |
| --- | --- | --- |
| Core-dashbord | `/dashboard-core` | Implementert |
| Arbeidsområder | `/work-areas` (alias `/services`) | Implementert |
| Systemer | `/systems`, `/systems/:id` | Implementert |
| Eiendeler | `/assets`, `/assets/:id` | Implementert |
| Prosessprofil | `/processes/:id` | Implementert |
| Behandlingsprotokoll (RoPA) | `/protocols` | Implementert |
| Avviksregister | `/deviations` | Implementert |
| Oppgaver og prosjekter (Aktivitet) | `/tasks` | Delvis |
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
| Muligheter | `/msp-partner/muligheter` | Implementert (mockdata) |
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

**Formål:** synliggjøre virksomhetens **samlede modenhet med bevis**, og gjøre den publiserbar og delbar med kunder og samarbeidspartnere. Trust Center er beviskanalen utad: én side som viser hvor moden virksomheten er per kontrollområde, hvilke regelverk som er i scope, og hvilken dokumentasjon som ligger bak — uten at man må sende dokumenter manuelt for hver forespørsel.

Steg (dagens flyt):
1. Aktiver Trust Center.
2. Fyll ut profil — organisasjon, tjenester og produkter.
3. Last opp masterdokumenter, policyer og sertifiseringer.
4. Knytt bevis til kontrollområder og regelverk slik at modenheten blir etterprøvbar.
5. Velg hva som er offentlig og hva som deles via lenke.
6. Publiser og del lenke (`/s/:token`), og følg visninger.

**Fase 2 — automatisk oppdatering (ikke implementert).** Målbildet er at Trust Center holder seg selv oppdatert. Det forutsetter en **AI Compliance Agent** som kontinuerlig leter etter mangler, henter og klassifiserer dokumentasjon, foreslår tiltak, og oppdaterer modenhet og bevis når noe endrer seg — slik at profilen alltid speiler faktisk status uten manuelt vedlikehold.

Status: Delvis. Rutene og visningene finnes (profil, dokumenter, policyer, sertifiseringer, bevis, produkter, deling), men **implementasjonsgraden er ikke bekreftet** og må gjennomgås. Automatisk oppdatering er ikke bygget.

---

## 3. Core — oppstartsløype

Naturlig rekkefølge etter aktivering av Core:

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
**Må kvalitetssikres av Vilde (jurist)** — innhold og behandlingsgrunnlag skal valideres juridisk. Potensielt behov for refaktorering av datamodell og tekster etter gjennomgangen.

### Steg 5 — Prosesser i arbeidsområdet
Lara foreslår prosesser knyttet til arbeidsområdet. For hver prosess vurderes:
- **Kritikalitet** (konfidensialitet, integritet, tilgjengelighet)
- **Risiko** (avledet av Lara fra registrerte data)
- **Bruk av AI** (om prosessen involverer AI-systemer og hvilken risikoklasse)

Rute: `/processes/:id`. Status: Delvis (kritikalitetsvurdering finnes; forslag til prosesser og AI-vurdering er delvis).

### Avviksregister
Registrer avvik, koble til system eller leverandør, sett ansvarlig, følg til lukking.
**Avvik påvirker ikke score.** Avvik er et *signal*: det synliggjør at noe har skjedd, og kan generere oppgaver til den som er ansvarlig. Effekten på modenhet kommer indirekte, gjennom tiltakene som gjennomføres — ikke som automatisk trekk i score.
Rute: `/deviations`. Status: Implementert.

### Oppgaver og prosjekter (Aktivitet)

**Oppgaver:** opprett egne oppgaver. Felt: tittel, beskrivelse, tilknyttet system/leverandør, ansvarlig, deltakere, frist, prioritet (0 Kritisk – 3 Lav), status.
Rute: `/tasks`. Status: Implementert.

**Prosjekter:** i samme menypunkt kan brukeren opprette **prosjekter** og jobbe asynkront med kolleger og samarbeidspartnere.

1. Velg **prosjekttype**: DPIA, ROS, TIA, Revisjon, Penetrasjonstest, Systemanskaffelse, Sikkerhetsrevisjon eller Annet.
2. Inviter deltakere på **e-post** — både interne kolleger og eksterne samarbeidspartnere (f.eks. et sikkerhetsmiljø som kjører pentest) kan bidra uten å måtte være faste brukere.
3. Koble prosjektet til et **system** der det er relevant, slik at resultatet havner på riktig sted.
4. Sett **startdato og sluttdato**.
5. Angi **hvem som skal godkjenne dokumentet** som kommer ut av prosjektet.
6. Resultatet blir dokumentasjon som kan brukes som bevis mot krav.

Status: **Implementert i produksjon, men ikke i Lovable-prototypen.** Løsningen er over fem måneder gammel, trenger test av sluttkunde og en oppgradering før den regnes som ferdig.

**Planlagt:** kobling mot modenhetsvurdering slik at plattformen foreslår oppgaver som kreves for å heve modenhet på et kontrollområde.

### Behandlingsprotokoll
Samlet oversikt over alle behandlingsaktiviteter registrert på tvers av arbeidsområdene, med eksport.
Rute: `/protocols`. Status: Implementert — men **trenger juridisk validering av Vilde** før den regnes som ferdig.

### Rapport
Modenhetsvurdering per kontrollområde og samlet, med utvikling over tid.
Rute: `/reports/compliance`, `/maturity`. Status: Implementert.

---

## 4. Leverandørmodulen

### 4.1 Legg til leverandør

**Formål:** få leverandøren inn med nok kontekst til at Lara kan vurdere risiko og foreslå hvordan dokumentasjon skal innhentes.

Steg:
1. **Start** — søk opp leverandøren. Oppslag mot offentlig register og nettside gir navn, org.nr., bransje og land. Finnes leverandøren allerede som eiendel, foreslås kobling i stedet for duplikat.
2. **Grunndata og rolle** — bekreft navn og kontaktpunkt, og sett **GDPR-rolle**: databehandler eller behandlingsansvarlig.
3. **Bruk og kontekst** — beskriv hva leverandøren brukes til, hvilke prosesser og systemer de berører, og hvilke data som deles.
4. **Kritikalitet og prioritet** — kritikalitet settes av brukeren (nøytral pille). Lara foreslår **prioritet P0–P3**; brukeren kan overstyre med begrunnelse, som logges.
5. **Regelverk** — Lara gir initiell vurdering av hvilke regelverk leverandøren berøres av (lovpålagt vs. anbefalt). Brukeren kan legge til flere.
6. **Innhentingsmetode** — når leverandøren er ny og det ikke finnes informasjon, er første steg alltid **å be om grunnlag**. Lara anbefaler metode per leverandør basert på signalene hun allerede har:
   - invitasjon til **agentisk Trust Profile** (leverandøren fyller ut selv),
   - **opprett aktivitet** med konkret forespørsel om dokumenter,
   - manuell opplasting der partneren/kunden allerede sitter på dokumentene.
7. **Dokumentasjon og bevis** — mottatte dokumenter analyseres av KI, som foreslår hvilke krav og artikler de dekker. Bruker godkjenner, setter gyldighet og utløpsdato, og verifiserer at avsender er uavhengig part der det kreves.
8. **Oppfølging** — leverandøren får modenhet per kontrollområde, aktivitetslogg og Laras «Veiledning fra Mynder» med neste steg.

Status: Implementert.

### 4.2 Oversikt
Dashbord med nøkkeltall (antall leverandører, kritikalitet, manglende dokumentasjon, avvik) og listevisning der man kan gå inn på én og én leverandør.
Rute: `/vendors`. Status: Implementert.

### 4.3 Leverandørprofil

| Arkfane | Innhold | Status |
| --- | --- | --- |
| Oversikt | Lovpålagte vs. anbefalte regelverk for leverandøren, mulighet for å legge til regelverk med KI-initiell vurdering, modenhet per kontrollområde, aktivitetslogg | Implementert |
| Bruk og kontekst | Kritikalitet (brukervalg), prioritet P0–P3 (Lara foreslår, bruker kan overstyre med begrunnelse), GDPR-rolle (databehandler/behandlingsansvarlig), beskrivelse av prosesser som bruker leverandøren | Implementert |
| Dokumentasjon | Last opp interne dokumenter; se eksterne dokumenter leverandøren har sendt (f.eks. pentestrapport) og godkjenn dem; utløpsdato og gyldighet | Implementert |
| Forespørsler | Oversikt over mottatte meldinger fra leverandøren, lesing og oppfølging | Implementert |
| Veiledning fra Mynder | Laras agentiske forslag til neste steg, inkludert anbefalt innhentingsmetode per leverandør | Implementert |

### 4.4 Kapasitet og nivå
Inntil 5 leverandører gratis. Ved forsøk på nummer 6 kreves nivåendring — hard grense, ingen situasjon med gratisnivå og 11 leverandører.
Status: Implementert.

---

## 5. Trust Center som produkt

Aktivering → profil → bevis og dokumenter → publisering og deling. Egen pris per måned. Kan aktiveres direkte, eller tilbys av partner.
Status: Delvis — se 2.3. Automatisk oppdatering via AI Compliance Agent er fase 2 og ikke implementert.

---

## 6. Innstillinger (virksomhet)

| Seksjon | Innhold | Status |
| --- | --- | --- |
| Organisasjon | Navn, org.nr., bransje, land, antall ansatte, geografisk virkeområde, nøkkelpersoner (DPO, CISO, compliance-ansvarlig), driftspartner | Implementert |
| Produkter | Aktivere produkt, endre nivå opp/ned, avslutte. Alle produkter følger samme flyt: **Aktiver → vilkår (Terms Gate) → kvittering med lenke videre**. Ved avslutning gis informasjon om datauttrekk og fakturastopp | Implementert |
| Tilgangsstyring | Inviter brukere på e-post, tildel nøkkelroller (daglig leder, personvernombud, sikkerhetsansvarlig, compliance-ansvarlig, AI-governance, operativ bruker), sett lese- eller skrivetilgang, se brukerprofil med aktiviteter, fjern bruker | Delvis |
| Aktivitetslogg | Hvem gjorde hva og når, på tvers av moduler | Implementert |
| Avtaler og vilkår | Vilkår, personvernerklæring, databehandleravtale — hver som eget punkt i undermenyen, med akseptlogg og versjonshistorikk | Implementert |
| Integrasjoner og MCP | Koble på egne kilder (i dag kun Acronis), MCP-agentkoblinger | Delvis |

**Kommende redesign:** hele innstillingsområdet skal redesignes fordi den nye tilgangsstyringsmodellen ikke er på plass ennå. Dagens rolle- og tilgangsoppsett er derfor midlertidig.

Flyt for produktendring (gjelder alle produkter):

```text
[Aktiver / Endre nivå / Avslutt]
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
| Profil | Navn, e-post, kontaktinfo, varslingspreferanser | Implementert |
| Språk | Norsk / engelsk (i18next) | Implementert |
| Modus | Mørk / lys | Implementert |
| Mine avtaler | Se hvilke vilkår og avtaler jeg har akseptert, med dato og versjon | Ikke bekreftet |
| Wiki-/kunnskapssenter | Les om hvordan ting virker: modenhetsmodellen (0–4), de fem kontrollområdene, kritikalitet vs. avledet risiko, Laras tre autonominivåer, bevis vs. dokumentasjon, prioritet P0–P3 | Planlagt (kommer) |

---

## 8. Tverrgående flyter

| Flyt | Beskrivelse | Status |
| --- | --- | --- |
| Produktaktivering | Aktiver → vilkår → kvittering. Lik for alle produkter | Implementert |
| Avslutte produkt | Kort dialog, informasjon om at datauttrekk kommer, e-post for varsling, fakturastopp | Implementert |
| Laras arbeidskø | Kompakt liste over hva som kan aktiveres, godkjennes som bevis, godkjennes som rapport, revideres eller kartlegges. Godkjenning skjer i eget gjennomgangsvindu, aldri med ett klikk | Implementert |
| Koble på deg selv | Gjenbrukbar CTA (`ConnectSourcesCallout`) som dukker opp der data mangler — i tomtilstander, på dashbordet og der bevis mangler — og peker til Innstillinger → Integrasjoner. Formålet er at kunden selv kobler på kildene sine slik at Lara kan hente data i stedet for at alt registreres manuelt | Delvis (inngangen finnes, men det er kun Acronis bak) |
| Oppdag systemer | Dialog for systemkartlegging med to valg i dag: **Acronis** (Lara henter enheter og backup-status via 7 Security-agenten) og **Registrer manuelt** | Ikke bekreftet — må verifiseres mot faktisk datainnhenting |
| Aktivitetslogg | Alle handlinger samlet, med lenke fra widgeter | Implementert |

### Integrasjonskilder

| Kilde | Hva den gir | Status |
| --- | --- | --- |
| **Acronis** (via 7 Security-agenten) | Eneste reelle integrasjonskilde i dag. Henter ut enheter hos partnerens kunde — **PC-er og mobiltelefoner** — samt backup-status. Brukes til automatisk systemkartlegging og som grunnlag for bevis på drift og beskyttelse | Implementert |
| Microsoft 365, Google Workspace, Notion m.fl. | Ønsket, men ikke bygget | Planlagt |
| MCP-agentkoblinger | Rammeverk finnes, men få reelle koblinger | Delvis |

---

## 9. Partner (MSP)

| Flyt | Beskrivelse | Status |
| --- | --- | --- |
| Legg til kunde | 3-stegs onboarding med berikelse fra nettside og personvernerklæring, og KI-anbefaling av regelverk | Implementert |
| Behovsanalyse | Velg regelverk → få listet opp alle kundene som matcher → se hvem det kan lages tilbud til → opprett bulk-tilbud eller aktiver regelverk. **Ingen salgspotensial i kroner** i denne versjonen | Implementert |
| Muligheter | Egen visning som viser hvor det finnes mulig arbeid hos kundene. Per kunde: bransje, foreslåtte regelverk fra offentlig register (alltid merket som forslag), aktiverte produkter, om kunden har overtatt Trust-profilen, og en liste «mulige oppgaver» — arbeidspakke, hvilke krav den løfter, omfang (liten/middels/stor), tjenesten som dekker den, anbefalt rekkefølge, og om forslaget kommer fra Lara. Formålet er å gå fra mulighet til tilbud på tre klikk | Implementert, men bygget på **mockdata** — ingen database bak |
| Kundekort | Lovpålagte og anbefalte regelverk, anbefalte produkter og tjenester, modenhetsspeil per kontrollområde, neste anbefalte tiltak | Implementert |
| Produkter og tjenester | Egen katalog (default) + Mynder-produkter for videresalg med fast provisjon og valgfritt etableringsgebyr; hver tjeneste viser hvilke krav den dekker og rolle (Direkte tiltak, Muliggjørende, Dokumenterende, Vurderende) | Implementert |
| Tilbud | Fra anbefaling til tilbud på tre klikk, med manuell overstyring av KI-forslag | Implementert |
| Fakturagrunnlag | Aktiverte produkter og tjenester per kunde, månedlig abonnement og fastprisprosjekter, eksport til PDF med partnerlogo | Implementert |
| Tilgang i partnerteam | Se under | **Ikke implementert** |

### Tilgang i partnerteam — versjon 1

Dagens visning i partnerinnstillingene er en skisse, ikke en fungerende tilgangsmodell. Versjon 1 skal fungere slik:

1. Tilgang til en kundes data går via **Trust Profile** — det er der kunden eier og styrer hva partneren ser.
2. Når partneren **aktiverer et produkt hos kunden**, kan de i samme flyt bekrefte at de skal ha rollen som **driftspartner** for den kunden. Tilgangen henger dermed sammen med et konkret oppdrag, ikke en global bryter.
3. En bruker som ikke er driftspartner — typisk en **kundeansvarlig** — kan **be om lesetilgang** til en kundes profil. Forespørselen godkjennes, og gir lesing uten skrivetilgang.

Status: Ikke implementert.

### Behovsanalyse — ønsket videreutvikling

Salgspotensial i kroner er tatt ut av behovsanalysen nå. På sikt er det ønskelig å vise potensial **ved aktivering av regelverk** for alle kundene som matcher de valgte regelverkene, slik at partneren ser samlet verdi av kampanjen før tilbudene sendes.

---

## 10. Gap-liste — hva som gjenstår

| Gap | Beskrivelse | Prioritet |
| --- | --- | --- |
| Ny tilgangsstyringsmodell | Den nye modellen er ikke på plass; innstillinger må redesignes når den lander | Høy |
| Tilgang i partnerteam | Versjon 1 (tilgang via Trust Profile, driftspartner-rolle bekreftet ved produktaktivering, lesetilgang på forespørsel) er ikke bygget | Høy |
| Trust Center fase 2 | Automatisk oppdatering av modenhet og bevis via AI Compliance Agent som kontinuerlig finner mangler, dokumentasjon og tiltak | Høy |
| Trust Center — dagens status | Implementasjonsgraden er ikke bekreftet og må gjennomgås | Høy |
| Prosjekter i prototypen | Prosjekter (DPIA, ROS, TIA, revisjon, pentest m.m. med e-postinvitasjon, systemkobling, datoer og godkjenner) finnes i produksjon, men ikke i Lovable-prototypen. Over 5 måneder gammel, må testes av sluttkunde og oppgraderes | Høy |
| Juridisk validering | RoPA-steget (Core steg 4) og behandlingsprotokollen må kvalitetssikres av Vilde. Kan utløse refaktorering | Høy |
| Oppgaver ↔ modenhet | Oppgaver foreslås ikke automatisk ut fra hva som kreves for å heve modenhet på et kontrollområde | Høy |
| Prosessforslag per arbeidsområde | Lara foreslår ikke systematisk prosesser knyttet til arbeidsområdet | Høy |
| `vendor_documents.expires_at` | Klienten spør etter en kolonne som ikke finnes i databasen; gir 400 i leverandørprofilen | Høy (teknisk) |
| Flere integrasjonskilder | Kun Acronis er reell i dag. Microsoft 365, Google Workspace og øvrige kilder mangler, og «Koble på deg selv» har derfor lite innhold bak seg | Middels |
| Oppdag systemer | Må bekreftes at flyten faktisk henter og oppretter systemer fra Acronis, ikke bare presenterer valget | Middels |
| Muligheter på ekte data | Partner-visningen «Muligheter» kjører på mockdata og må kobles til reelle kundedata | Middels |
| Salgspotensial i behovsanalyse | Ønsket senere: potensial ved aktivering av regelverk for alle matchende kunder | Middels |
| Wiki-/kunnskapssenter | Ikke implementert i profilvisningen ennå | Middels |
| Mine avtaler | Ikke bekreftet implementert | Middels |
| AI-vurdering per prosess | Vurdering av AI-bruk per prosess er ikke komplett (risikoklasse, dokumentasjonskrav etter AI Act) | Middels |
| RoPA-redigering | Autogenerert RoPA per system er ikke like komplett for alle systemtyper | Middels |
| Datauttrekk ved avslutning | Nedlasting av egne data er varslet, men ikke implementert | Middels |

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
| Prosjekt | Samarbeidsflyt med type (DPIA, ROS, TIA, revisjon, pentest m.m.), deltakere på e-post, datoer og godkjenner |
| Avvik | Registrert hendelse. Påvirker ikke score, men gir signal og kan generere oppgaver |
| Avslutte | Å fase ut et produkt eller en tjeneste (erstatter det tidligere ordet «avvikle») |
| Eiendel | Norsk betegnelse på asset |
| Core | Kjerneproduktet (tidligere «Mynder Core») |
| Lara | Plattformens AI-agent, med tre autonominivåer: Automatisk, Assistert, Manuell |
| AI Compliance Agent | Fase 2-agent som kontinuerlig finner mangler, dokumentasjon og tiltak, og holder Trust Center oppdatert |
