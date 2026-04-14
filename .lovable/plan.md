

## Plan: Fjern «Del»-knappen fra forespørselskortene

### Endring

**Fil: `src/components/customer-requests/CustomerRequestCard.tsx`**
- Fjern hele action-raden (linje ~134-155) som inneholder «Del»-dropdown og «Administrer deling»-knappen
- Fjern ubrukte imports: `DropdownMenu*`, `ManageSharingDialog`, `Send`, `ChevronDown`, `Mail`, `ShieldCheck`, `Settings2`
- Fjern `dialogOpen` state, `handleConfirmSharing`, `handleAddToTrustProfile` og `ManageSharingDialog`-rendringen
- Fjern `onShare` fra props-interfacet
- Fjern «Delt med X»-badge (linje 116-119) da den også er knyttet til denne logikken

**Fil: `src/components/customer-requests/InboundRequestsContent.tsx`**
- Fjern `handleShare`-funksjonen og `onShare`-propen fra `CustomerRequestCard`

Ingen databaseendringer.

