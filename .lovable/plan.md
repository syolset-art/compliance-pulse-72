
# MSP Partner Dashboard

## Oversikt
Et nytt dashbord for MSP-partnere (Managed Service Providers) som videreselger Mynder-plattformen. Dashbordet gir oversikt over alle kunder de har solgt til, med kundenavn, compliance-status, logo og total samsvarsscore. Ved klikk pa en kunde navigerer man inn til kundens dashbord.

## Datamodell

### Ny tabell: `msp_customers`
Lagrer relasjonen mellom MSP-partneren og deres kunder.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid (PK) | Unik ID |
| msp_user_id | uuid | Bruker-ID til MSP-partneren |
| customer_name | text | Kundenavn |
| org_number | text | Organisasjonsnummer (valgfritt) |
| industry | text | Bransje |
| employees | text | Antall ansatte |
| logo_url | text | URL til kundens logo |
| compliance_score | integer | Total compliance-score (0-100) |
| active_frameworks | text[] | Aktive regelverk |
| onboarding_completed | boolean | Om onboarding er fullfort |
| last_activity_at | timestamptz | Siste aktivitet |
| created_at | timestamptz | Opprettet |
| status | text | Status (active, inactive, onboarding) |
| contact_person | text | Kontaktperson |
| contact_email | text | E-post |

RLS-policy: Brukere kan kun se sine egne MSP-kunder (`msp_user_id = auth.uid()`).

## Ny side: `/msp-dashboard`

### Layout
Bruker standard layout med Sidebar + main content (container max-w-7xl mx-auto).

### Header
- Tittel: "Partneroversikt"
- Undertittel: "Oversikt over dine kunder og deres compliance-status"
- Knapp: "+ Legg til kunde" (apner en dialog for a registrere ny kunde manuelt)

### Oppsummeringsrad (4 MetricCards)
- **Totalt antall kunder** (alle aktive)
- **Gjennomsnittlig compliance-score** (snitt av alle kunders score)
- **Kunder under onboarding** (status = 'onboarding')
- **Kunder med lav score** (score under 50%)

### Kundeliste
En grid med kundekort som viser:
- **Kundelogo** (fra logo_url, eller initialer-avatar som fallback)
- **Kundenavn** (bold)
- **Bransje** og **antall ansatte** (badge)
- **Aktive regelverk** (badges, f.eks. "GDPR", "ISO 27001")
- **Compliance-score** (sirkelprogress eller prosent i farge: gron 80+, gul 50-79, rod under 50)
- **Status-badge** (Aktiv / Under onboarding / Inaktiv)
- **Siste aktivitet** (relativ tid, f.eks. "2 dager siden")

Ved klikk pa et kort navigeres man til `/msp-dashboard/:customerId` som viser en read-only versjon av kundens dashbord med de viktigste widgetene.

### Kundedetalj-side (`/msp-dashboard/:customerId`)
Viser:
- Kundens navn og logo i header
- Compliance-score og aktive regelverk
- Forenklet dashbord med: StatusOverviewWidget, CriticalTasksWidget, DomainComplianceWidget
- Knapp "Tilbake til partneroversikt"

### Legg til kunde-dialog
Enkel dialog med felter:
- Kundenavn (obligatorisk)
- Org.nummer (valgfritt)
- Bransje (select)
- Antall ansatte (select)
- Kontaktperson og e-post
- Logo (filopplasting til company-logos bucket)

## Navigasjon
Legger til "Partneroversikt" i sidebar under Admin-seksjonen med Building2-ikon, kun synlig for MSP-brukere (kan styre med en sjekk mot msp_customers-tabellen eller en egen rolle).

## Filer som opprettes/endres

### Nye filer
- **Database-migrasjon**: Ny tabell `msp_customers` med RLS
- **`src/pages/MSPDashboard.tsx`**: Hovedside med kundeliste
- **`src/pages/MSPCustomerDetail.tsx`**: Kundedetalj-side
- **`src/components/msp/MSPCustomerCard.tsx`**: Kundekort-komponent
- **`src/components/msp/MSPMetricsRow.tsx`**: Oppsummeringsrad
- **`src/components/msp/AddMSPCustomerDialog.tsx`**: Dialog for a legge til kunde

### Endrede filer
- **`src/App.tsx`**: Nye ruter `/msp-dashboard` og `/msp-dashboard/:customerId`
- **`src/components/Sidebar.tsx`**: Nytt navigasjonspunkt "Partneroversikt"
