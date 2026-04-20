

## Plan: Demo for innkommende kundemelding (med e-postvisning)

Subtil demo-knapp i sidebaren som spiller av en sekvens som viser hvordan en e-postmelding fra Mynder ser ut når en kunde ber om leverandøroppdatering.

### Hva som bygges

**1. Subtil demo-knapp i `Sidebar.tsx`**
- Plasseres rett over Innstillinger-blokken (nederst)
- Stil: `text-[11px] text-muted-foreground hover:text-primary`, `Sparkles`-ikon (h-3 w-3), `border border-dashed border-primary/20 rounded-md`, `mx-3 mb-2 px-2 py-1`
- Tekst: "Demo: Kundemelding"
- Tooltip: "Spill av demonstrasjon: motta og besvar leverandøroppdatering"
- Klikk → dispatcher custom event `start-customer-request-demo`

**2. Ny komponent `src/components/demo/CustomerRequestDemoController.tsx`**
Mountes globalt i `App.tsx`. Lytter på event og kjører en orkestrert sekvens med narrasjons-toasts (~2-3 sek mellomrom):

| Steg | Hendelse | Visuell effekt |
|---|---|---|
| 1 | Toast: "Sparebank Vest sender en forespørsel..." | Info-toast |
| 2 | Bell-ikon i TopBar pulserer + rød dot | Notifikasjons-badge |
| 3 | **E-postvisning åpnes** (modal) — viser hvordan e-posten ser ut fra Mynder i kundens innboks | Stor modal/dialog |
| 4 | Auto-naviger til `/customer-requests` | Route-skifte |
| 5 | Demo-melding fades inn øverst i listen med highlight-glow | Ny rad med "NY"-badge |
| 6 | Toast: "Mynder har analysert og foreslår et utkast" | Info-toast |
| 7 | Auto-åpne meldingen → AI-foreslått svar med vedlegg | Drawer |
| 8 | Toast: "Du kan godkjenne svaret med ett klikk" + "Avslutt demo"-knapp | Info-toast |

**3. E-postvisning (`EmailPreviewModal.tsx`) — ny i steg 3**
Viser en realistisk e-post slik den ville sett ut i kundens innboks:
- **E-post-header** (grå, kompakt): Fra: `noreply@mynder.no`, Til: `compliance@sparebankvest.no`, Emne: "Forespørsel om leverandøroppdatering 2025"
- **E-postkropp** (hvit container, max-w-2xl, mx-auto):
  - Mynder-logo øverst
  - Hilsen: "Hei {kontaktperson},"
  - Brødtekst: "Sparebank Vest har bedt om en oppdatert leverandørstatus..."
  - Liste over hva som etterspørres (ISO 27001, DPA, Trust Profile-lenke)
  - Stor primær CTA-knapp: "Åpne forespørselen i Mynder" (deep purple `#5A3184`)
  - Footer med lenker (Personvern, Avregistrer)
- Stil matcher transactional email-templates (white bg, Apple-minimal, Mynder brand)
- "Lukk og fortsett"-knapp nederst i modal-footer

**4. Demo-state i `DemoSyncContext.tsx`**
- Legg til `customerRequestDemo: boolean` flag
- `startCustomerRequestDemo()` / `endCustomerRequestDemo()` helpers

**5. Demo-melding-injeksjon i `InboundRequestsContent.tsx`**
- Når `demoSync.customerRequestDemo === true`, prepend ekstra rad: "Sparebank Vest — Årlig leverandøroppdatering 2025", deadline 14 dager, etterspør ISO 27001 + DPA + Trust Profile
- Highlight-ring på raden (`ring-2 ring-primary/30`)

**6. Bell-pulse i TopBar**
- Lytter på `demoSync.customerRequestDemo` → `animate-pulse` på Bell + rød dot

**7. Floating "Avslutt demo"-pille**
- Synlig under hele sekvensen, øverst til høyre
- Stopper auto-flyt, fjerner demo-melding, lukker eventuelle åpne modaler

### Designtokens (Mynder-manualen)
- Demo-knapp: subtil `text-muted-foreground` → hover `text-primary`
- E-postmodal: hvit bg, deep purple `#5A3184` for CTA, Apple-minimal padding
- Highlight: `ring-2 ring-primary/30 animate-pulse`
- Ingen tunge skygger

### Lokalisering
NB/EN-varianter via `isNb`-mønster (NB primær for denne demoen).

### Filer som endres/opprettes
- `src/components/Sidebar.tsx` — subtil demo-knapp
- `src/components/demo/CustomerRequestDemoController.tsx` *(ny)* — orkestrering
- `src/components/demo/EmailPreviewModal.tsx` *(ny)* — e-postvisning
- `src/contexts/DemoSyncContext.tsx` — `customerRequestDemo` flag
- `src/components/customer-requests/InboundRequestsContent.tsx` — injiser demo-melding
- `src/components/TopBar.tsx` — Bell-pulse
- `src/App.tsx` — mount controller

### Ut av scope
- Faktisk e-postutsending
- Backend-persistering
- Demo for utgående meldinger

