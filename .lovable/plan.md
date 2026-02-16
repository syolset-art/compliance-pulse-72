
# Utgaende leverandorforesporsler - Samlet oversikt

## Konsept
I dag har "Kundeforesporsler"-siden kun innkommende foresporsler (kunder som spor dere). Det som mangler er den andre siden: at dere kan sende foresporsler til deres egne leverandorer og folge opp status samlet.

Losningen: Utvide Kundeforesporsler-siden med to faner pa toppniva:

- **Innkommende** (eksisterende funksjonalitet - kunder som spor dere)
- **Utgaende** (nytt - foresporsler dere har sendt til leverandorer)

## Brukerflyt for utgaende foresporsler

1. Brukeren gar til "Kundeforesporsler" i menyen
2. Velger fanen "Utgaende"
3. Ser en samlet oversikt med:
   - Metrikk-kort: Totalt sendt, Avventer svar, Mottatt, Forfalt
   - Filterbar: Sok, type foresporsler, leverandorkategori, status
   - Liste med alle sendte foresporsler, gruppert per leverandor
4. Kan sende ny foresporsler via "Send foresporsler"-knapp som apner en veiviser

## Veiviser for a sende foresporsler

Tre steg:

**Steg 1 - Velg type**
Radioknapper: Leverandorvurdering, DPA, ISO-dokumentasjon, SOC 2-rapport, GDPR-rapport

**Steg 2 - Velg leverandorer**
- Hent leverandorer fra assets-tabellen (asset_type = "vendor")
- Filtrer pa vendor_category og gdpr_role (de nye feltene)
- Multi-select med checkboxer
- "Velg alle databehandlere" som hurtigvalg

**Steg 3 - Bekreft og send**
- Oppsummering med frist-dato
- Bekreft-knapp

## Demo-data

For prototypen legges det til demo-data som viser typiske foresporsler en stor kunde som Helse Vest IKT ville sende:

| Leverandor | Type | Status | Frist |
|------------|------|--------|-------|
| Microsoft Norge | Leverandorvurdering | Mottatt | 2026-01-15 |
| Atea AS | DPA-fornyelse | Avventer | 2026-03-01 |
| AWS (Amazon) | SOC 2-rapport | Forfalt | 2026-02-01 |
| Visma | ISO 27001 dokumentasjon | Mottatt | 2026-02-10 |
| Basefarm | Leverandorvurdering | Under arbeid | 2026-04-01 |

## Menyendring

Oppdatere sidebar-menyelementet fra "Kundeforesporsler" til "Foresporsler" for a dekke begge retninger. Beholde eksisterende ikon (FileQuestion).

## Teknisk implementasjon

### Nye filer
- `src/components/customer-requests/OutboundRequestsTab.tsx` - Oversikt over utgaende foresporsler med metrikk, filtre og liste
- `src/components/customer-requests/OutboundRequestCard.tsx` - Kort for hver utgaende foresporsler
- `src/components/customer-requests/SendRequestWizard.tsx` - 3-stegs dialog for a sende nye foresporsler

### Endrede filer
- `src/pages/CustomerRequests.tsx` - Legge til toppniva-faner (Innkommende / Utgaende), flytte eksisterende innhold under "Innkommende"
- `src/components/Sidebar.tsx` - Endre menynavn fra "nav.customerRequests" til "nav.requests"
- `src/locales/nb.json` og `src/locales/en.json` - Nye oversettelser

### Datamodell
Alle utgaende foresporsler lagres som demo-data i koden (DEMO_OUTBOUND_REQUESTS array) uten databaseendringer, i trad med prototypetilnaermingen.
