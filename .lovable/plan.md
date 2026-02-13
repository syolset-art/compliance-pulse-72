
# Kundeforesporsler - Side for compliance-foresportsler fra kunder

## Hva vi bygger
En ny side der brukeren kan se og haandtere foresportsler fra kunder som ber om innsikt i compliance-informasjon (leverandorvurderinger, sertifikater, DPA-er osv.). Inspirert av referansebildet med metrikk-kort, soek/filter, fane-navigasjon og foresportsel-kort med fremdrift.

## Sidestruktur

### 1. Header
- Tittel: "Kundeforesportsler"
- Undertittel: "Svar pa complianceforesportsler fra dine kunder"
- Handlingsknapper oppe til hoyre (fremtidig: "Svar flere samtidig", "Automatiser svar")

### 2. Metrikk-kort (4 stk)
- Totale foresportsler (ikon: Inbox)
- Ventende (ikon: Clock, farge: amber)
- Under arbeid (ikon: Send)
- Forfalt (ikon: AlertCircle, farge: red)

### 3. Sok og filter-rad
- Sokefelt: "Sok i foresportsler..."
- Dropdown-filtre: Alle kunder, Alle typer, Alle statuser

### 4. Fane-navigasjon
- Avventer (med teller)
- Fullfort (med teller)
- Alle (med teller)
- Arkivert

### 5. Foresportsel-kort
Hvert kort viser:
- Ikon + tittel (type foresportsel, f.eks. "Norsk leverandorvurdering")
- Kundenavn + status-badge (Forberedelse / Klar / Sendt)
- Fremdriftslinje med prosent
- "Del ferdig"-knapp (grenn, primary action)
- "Oppdater oppgave"-lenke

## Teknisk implementasjon

### Database: Ny tabell `customer_compliance_requests`
```sql
CREATE TABLE customer_compliance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  request_type TEXT NOT NULL DEFAULT 'vendor_assessment',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  progress_percent INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  user_id UUID NOT NULL
);

ALTER TABLE customer_compliance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON customer_compliance_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own requests"
  ON customer_compliance_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own requests"
  ON customer_compliance_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
```

### Ny side: `src/pages/CustomerRequests.tsx`
- Folger eksisterende layout-moenster med `Sidebar` + `container max-w-7xl mx-auto`
- Bruker `useTranslation` for norsk/engelsk
- Bruker `useQuery` for a hente data fra databasen
- Demo seed-data settes inn nar siden er tom (som i LaraInbox)

### Ny komponent: `src/components/customer-requests/CustomerRequestCard.tsx`
- Gjenbrukbart kort for hver foresportsel
- Viser fremdriftslinje, kundenavn, status-badge, handlingsknapper

### Routing: Oppdater `App.tsx`
- Ny rute: `/customer-requests`

### Sidebar: Legg til navigasjonslenke
- Legge til "Kundeforesportsler" i sidebar under hovednavigasjonen
- Ikon: `Inbox` eller `FileQuestion`

### Lokalisering: Oppdater `nb.json` og `en.json`
- Legg til oversettelses-noekler for alle tekster pa siden

### Responsivt design
- Metrikk-kort: `grid-cols-2 md:grid-cols-4`
- Filter-rad: stables vertikalt pa mobil
- Foresportsel-kort: full bredde, knapper stables pa mobil

## Demo-data
Siden inkluderer demo seed-data som vises nar tabellen er tom:
- "Norsk leverandorvurdering" fra "Allier AS" (100%, Forberedelse)
- "ISO 27001 dokumentasjon" fra "TechCorp AS" (60%, Under arbeid)
- "DPA foresponse" fra "Nordic Solutions" (30%, Ventende)

## Filer som opprettes/endres
- **Ny**: `src/pages/CustomerRequests.tsx` - Hovedsiden
- **Ny**: `src/components/customer-requests/CustomerRequestCard.tsx` - Kort-komponent
- **Endret**: `src/App.tsx` - Ny rute
- **Endret**: `src/components/Sidebar.tsx` - Navigasjonslenke
- **Endret**: `src/locales/nb.json` - Norske oversettelser
- **Endret**: `src/locales/en.json` - Engelske oversettelser
- **Database**: Ny migrasjon for `customer_compliance_requests`-tabellen
