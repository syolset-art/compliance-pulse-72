

# Plan: Legg til demo-data på Meldinger-siden

## Hva endres

### 1. Utvide innkommende demo-data (`InboundRequestsContent.tsx`)
- Legg til 2-3 ekstra innkommende meldinger med mer varierte typer og statuser for en rikere demo-opplevelse
- Inkluder en melding som nylig er mottatt (ny/ubehandlet) for å vise urgency

### 2. Legg til utgående demo-data (`OutboundRequestsTab.tsx`)
- Legg til hardkodede demo-forespørsler som vises når localStorage er tomt (samme mønster som InboundRequestsContent bruker)
- 4-5 utgående forespørsler med ulike statuser: `awaiting`, `in_progress`, `received`, `overdue`
- Realistiske leverandørnavn og forespørselstyper (DPA, leverandørvurdering, ISO 27001, SOC 2)

## Filer som endres

| Fil | Endring |
|-----|---------|
| `src/components/customer-requests/InboundRequestsContent.tsx` | Legg til 2 ekstra demo-meldinger |
| `src/components/customer-requests/OutboundRequestsTab.tsx` | Legg til `DEMO_OUTBOUND_REQUESTS` array og vis dem som fallback når localStorage er tomt |

## Teknisk
- Utgående: Endrer `loadOutboundRequests()` til å returnere demo-data som fallback når localStorage er tomt
- Innkommende: Utvider eksisterende `INITIAL_DEMO_REQUESTS` array
- Ingen database-endringer

