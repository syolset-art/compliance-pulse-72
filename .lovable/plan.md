

## Plan: Endre «Forespørsler» til «Meldinger» på siden og i oversettelser

### Endringer

**1. `src/pages/CustomerRequests.tsx`** (linje 26, 30-31)
- Endre sidetittelen fra `"Forespørsler"` → `"Meldinger"` og `"Requests"` → `"Messages"`
- Endre underteksten til `"Håndter innkommende og utgående meldinger"` / `"Manage inbound and outbound messages"`

**2. `src/locales/nb.json`**
- `customerRequests.title`: `"Kundeforespørsler"` → `"Meldinger"`
- `customerRequests.subtitle`: oppdater til meldinger-terminologi
- `customerRequests.search`: `"Søk i forespørsler..."` → `"Søk i meldinger..."`
- `customerRequests.empty`: `"Ingen forespørsler her"` → `"Ingen meldinger her"`
- `customerRequests.metrics.total`: `"Totale forespørsler"` → `"Totale meldinger"`
- `nav.customerRequests`: `"Kundeforespørsler"` → `"Meldinger"`
- `nav.requests`: `"Forespørsler"` → `"Meldinger"`

**3. `src/locales/en.json`** — samme endringer på engelsk (Requests → Messages)

**4. Øvrige filer med hardkodet tekst** — søke gjennom og oppdatere eventuelle steder der «forespørsler»/«requests» brukes i kontekst av denne meldingsfunksjonen (ikke compliance-krav-kontekst som GDPR-innsynsforespørsler, som beholder sitt navn).

