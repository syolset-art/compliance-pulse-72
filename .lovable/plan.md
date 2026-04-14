

# Plan: Oppdater meldingsstatuser til kommunikasjonsrelevante verdier

## Problemet
Statusene bruker oppgaveterminologi (`in_progress`, `pending`, `completed`) i stedet for meldingsterminologi. En melding er ikke «under arbeid» — den er sendt, mottatt, lest, besvart osv.

## Nye statuser

### Innkommende meldinger (Inbound)
| Gammel status | Ny status | Norsk | Engelsk |
|---|---|---|---|
| `pending` | `new` | Ny | New |
| `in_progress` | `read` | Lest | Read |
| `completed` | `responded` | Besvart | Responded |
| `archived` | `archived` | Arkivert | Archived |

### Utgående meldinger (Outbound)
| Gammel status | Ny status | Norsk | Engelsk |
|---|---|---|---|
| `awaiting` | `sent` | Sendt | Sent |
| `in_progress` | `awaiting` | Venter på svar | Awaiting reply |
| `received` | `received` | Mottatt | Received |
| `overdue` | `overdue` | Forfalt | Overdue |

## Filer som endres

| Fil | Endring |
|---|---|
| `CustomerRequestCard.tsx` | Oppdater `getStatusConfig()` med nye statuser og labels |
| `InboundRequestsContent.tsx` | Oppdater demo-data statuser + tab-filtrering |
| `OutboundRequestsTab.tsx` | Oppdater demo-data statuser |
| `OutboundRequestCard.tsx` | Oppdater status-badge logikk |
| `CustomerRequestsTab.tsx` | Oppdater `getStatusBadge()` med nye statuser |

## Teknisk
- Kun rename av statusverdier i demo-data og visningslogikk
- Ingen database-endringer (demo-data er hardkodet)
- Tab-filtrering i InboundRequestsContent oppdateres: «Åpne» = `new` + `read`, «Fullført» → «Besvart» = `responded`

