

## Rename "Send forespørsel" → contextually appropriate labels

The term "Send forespørsel" (Send request) feels formal and transactional. As a UX consideration, the label should match the user's mental model in each context:

### Proposed labels per location

| Location | Current (NB) | New (NB) | New (EN) |
|---|---|---|---|
| **AssetTrustProfile** CTA button | Send forespørsel | Be om oppdatering | Request update |
| **AssetTrustProfile** help card | Send forespørsel | Be om oppdatering | Request update |
| **OutboundRequestsTab** button | Send forespørsel | Ny melding | New message |
| **BulkSendConfirmDialog** title | Send forespørsel | Send melding | Send message |
| **VendorActionCards** button | Send forespørsel | Be om oppdatering | Request update |
| **VendorDashboard** help item | Send forespørsel | Be om oppdatering | Request update |
| **SendRequestWizard** title | Send forespørsel til leverandører | Send melding til leverandører | Send message to vendors |
| **TemplateLibrary** hint text | «Send forespørsel»-wizarden | «Send melding»-wizarden | "Send message" wizard |
| **Tasks** action label | Send forespørsel | Be om oppdatering | Request update |

### Rationale
- **"Be om oppdatering"** — used where the action is vendor-facing and specific (requesting docs/updates). Matches the existing `RequestUpdateDialog` title.
- **"Send melding"** / **"Ny melding"** — used in the Messages/outbound context where the framing is communication-oriented.

### Files to modify
1. `src/pages/AssetTrustProfile.tsx` (2 occurrences)
2. `src/components/customer-requests/OutboundRequestsTab.tsx`
3. `src/components/vendor-dashboard/BulkSendConfirmDialog.tsx`
4. `src/components/vendor-dashboard/VendorActionCards.tsx`
5. `src/pages/VendorDashboard.tsx`
6. `src/components/customer-requests/SendRequestWizard.tsx`
7. `src/components/customer-requests/TemplateLibrary.tsx`
8. `src/pages/Tasks.tsx`

