

## Plan: Bytt fra credits-modell til plan-basert prising

### Bakgrunn
I dag bruker Mynder en credits-først modell (10 gratis/mnd, pakker à 490/990/1990 kr, moduler 4900 kr/mnd). Du vil heller ha rene abonnementsplaner for forutsigbar inntekt – uten credits-pakker som kunden må kjøpe separat.

### Ny prismodell – forslag

Tre tydelige planer + tillegg per regelverk (som i dag).

```text
┌─────────────────┬─────────────────┬─────────────────┐
│   STARTER       │   PROFESJONELL  │   ENTERPRISE    │
│   Gratis        │   2 490 kr/mnd  │   Ta kontakt    │
│                 │   (24 900 kr/år)│                 │
├─────────────────┼─────────────────┼─────────────────┤
│ For å komme     │ For SMB som vil │ For konsern og  │
│ i gang          │ vokse trygt     │ regulerte bransjer│
├─────────────────┼─────────────────┼─────────────────┤
│ ✓ 1 arbeidsomr. │ ✓ Ubegrensede   │ ✓ Alt i Prof.   │
│ ✓ 5 leverandører│   arbeidsområder│ ✓ SSO / SAML    │
│ ✓ 5 systemer    │ ✓ Ubegrenset    │ ✓ DPA + BCP     │
│ ✓ Trust Profile │   leverandører  │ ✓ Dedikert CSM  │
│ ✓ 1 regelverk   │   og systemer   │ ✓ SLA 99,9 %    │
│ ✓ Lara (basic)  │ ✓ Lara ubegrenset│ ✓ MSP-tilgang  │
│                 │ ✓ Slette-agent  │ ✓ Custom regelv.│
│                 │ ✓ 3 regelverk   │ ✓ API-tilgang   │
│                 │ ✓ PDF-eksport   │                 │
└─────────────────┴─────────────────┴─────────────────┘

Tillegg (alle planer):
+ Ekstra regelverk: 290 kr/mnd per stk (NIS2, DORA, ISO osv.)
+ Ekstra arbeidsområde (kun Starter): 190 kr/mnd
```

**Hvorfor denne strukturen virker:**
- **Forutsigbar MRR** – ingen credits-saldo å bekymre seg for
- **Ingen "skremmende" pay-per-use** – kunden vet hva de betaler
- **Naturlig oppgradering** – soft-gate på 5 enheter pusher Starter → Profesjonell
- **Add-ons gir oppside** – regelverk selges separat (matcher dagens FRAMEWORK_ADDONS)
- **AI-bruk inkludert** – Lara og agenter er en del av planen, ikke en motor som teller ned

### Endringer i koden

**1. `src/lib/planConstants.ts`** – kjernen
- Erstatt `CREDIT_PACKAGES` og `MODULES` med tre planer: `starter`, `professional`, `enterprise`
- Behold `FRAMEWORK_ADDONS` (per-regelverk pris) – fungerer som i dag
- Definer `PLAN_LIMITS` (vendors, systems, work_areas, frameworks_included)
- Behold `BillingInterval` (monthly/yearly med 2 mnd rabatt)

**2. `src/pages/Subscription.tsx`** (eller tilsvarende)
- Ny 3-kolonne plan-velger (Starter / Profesjonell / Enterprise)
- Yearly/monthly toggle øverst
- Tydelig "Mest populær"-badge på Profesjonell
- Fjern credits-pakke-seksjonen helt
- Behold regelverk-marketplace nedenfor som "Tillegg"

**3. Fjern credits-UI**
- `src/hooks/useCredits.ts` – marker som deprecated, eller fjern hvis ingen avhengigheter
- Sidebar credits-indikator → erstatt med plan-badge ("Profesjonell")
- `VendorActivateDialog.tsx` og `SystemActivateDialog.tsx` – fjern credits-snakk, vis i stedet "Inkludert i Profesjonell" eller "Oppgrader for å aktivere"
- `DeletionAgentPromoCard.tsx` – fjern pris helt, vis "Inkludert i Profesjonell"

**4. Soft-gate logikk**
- Når Starter-bruker når 5 leverandører/systemer → upgrade-dialog som peker på Profesjonell (ikke credits-kjøp)

**5. Database (valgfritt nå)**
- `company_credits`-tabellen kan beholdes inntil videre (ingen breaking change)
- Senere migrasjon: `company_subscriptions` med `plan_id` + `billing_interval`

### Hva brukeren ser

- **Sidebar**: liten plan-badge "Profesjonell" der credits-baren var
- **Dashboard**: ingen credits-widget
- **Prisside**: ren 3-kolonne sammenligning + regelverk som tillegg under
- **Aktiver-dialoger**: "Inkludert i din plan" eller "Oppgrader til Profesjonell"

### Migreringsstrategi (for eksisterende demo-brukere)
Alle eksisterende brukere mappes til **Profesjonell** automatisk i demo – ingen kunde havner i en låst tilstand.

### Spørsmål før jeg bygger
Jeg foreslår priser (Gratis / 2 490 kr / Enterprise) som matcher norsk SMB-marked og dagens 4 900 kr per modul. Vil du:
- Justere prisene før implementering, eller
- At jeg bygger med disse og du justerer tall i `planConstants.ts` etterpå?

Si fra hvis priser/plannavn skal endres, ellers implementerer jeg som beskrevet.

