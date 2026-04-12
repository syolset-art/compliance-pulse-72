

## Plan: Vis TPRM-påvirkning ved dokumentgodkjenning

### Hva endres

Når brukeren godkjenner et dokument (fra Lara-innboks eller manuell opplasting), skal bekreftelsesdialogen vise konkret hvordan dokumentet påvirker:
1. **TPRM-status** — f.eks. "Kontroll: 2/4 → 3/4" og eventuelt statusendring "Under oppfølging → Godkjent"
2. **Risiko** — om dokumentet dekker et risikogap
3. **Modenhet** — estimert effekt på compliance/trust score

### Teknisk tilnærming

**`ApprovalSuccessDialog.tsx`** utvides med nye props som inneholder nåværende TPRM-state, slik at dialogen kan beregne "før vs. etter":

- Legg til valgfrie props: `controlsBefore` (antall oppfylte krav før), `controlsTotal`, `tprmLevelBefore`, `tprmLevelAfter`, `riskLevel`
- Erstatt den generiske "+X poeng"-seksjonen med en strukturert TPRM-påvirkningsvisning:

```text
┌─────────────────────────────────────────┐
│ 📊 Effekt på oppfølgingsstatus         │
│                                         │
│  Kontroll:  2/4 → 3/4 krav oppfylt     │
│  Status:    🟡 Under oppfølging →       │
│             🟢 Godkjent                 │
│                                         │
│  Modenhet:  +5 poeng estimert           │
│  Risiko:    Dekker gap i datahåndtering │
└─────────────────────────────────────────┘
```

- Hvis dokumenttypen matcher en av de 4 TPRM-kontrollene (DPA, SLA, risikovurdering), beregnes ny kontrollgrad og eventuell statusendring
- Hvis dokumentet ikke matcher en TPRM-kontroll, vises kun modenhetspåvirkning

**`LaraInboxTab.tsx`** — Når `approveMutation.onSuccess` kalles, beregn TPRM-state før godkjenning og send med til `ApprovalSuccessDialog` via `ApprovedItemData`

**`UploadDocumentDialog.tsx`** — Etter vellykket opplasting (steg 4/suksess-visning), vis samme TPRM-påvirkningsinformasjon inline i dialogen

### Endringer per fil

1. **`src/components/ApprovalSuccessDialog.tsx`** — Utvid `ApprovedItemData` med TPRM-felter. Erstatt "+X poeng" med strukturert TPRM-påvirkningskort som viser kontrollgrad-endring, eventuell statusendring, modenhet og risikogap-dekning.

2. **`src/components/asset-profile/tabs/LaraInboxTab.tsx`** — Beregn kontrollstatus (antall oppfylte krav) fra eksisterende `vendor-documents` query-data før godkjenning, og inkluder dette i `ApprovedItemData`.

3. **`src/components/asset-profile/UploadDocumentDialog.tsx`** — I suksess-steget etter opplasting, vis en kompakt TPRM-påvirkningsbanner som viser om det opplastede dokumentet fyller et kontrollgap.

### Ingen databaseendringer

All beregning skjer client-side basert på eksisterende data (vendor_documents, asset criticality/risk_level).

