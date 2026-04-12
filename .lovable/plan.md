

## Plan: Ny fanestruktur for leverandørens Trust Profile (5 faner)

### Nåværende tilstand
Leverandørprofilen har i dag 4 faner:
1. **Oversikt** — Validering + Kontroller + Relasjoner (blandet formål)
2. **Datahåndtering** — DPA, personvern, dataflyt
3. **Risiko og revisjon** — Risiko + Hendelser
4. **Dokumenter** — Dokumenter + Lara Innboks

Problemet er at «Oversikt» mangler et tydelig sammendrag, bruken/konteksten fra egen organisasjon er blandet inn i «Datahåndtering», og historikk/relasjoner/forespørsler er spredt.

### Ny fanestruktur

| # | Fane | Innhold | Perspektiv |
|---|------|---------|------------|
| 1 | **Oversikt** | Leverandørnavn, status (claimed/unclaimed), sist oppdatert. Trust Score + confidence + styrker/bekymringer. 4 domenekort (klikkbare). Primær CTA: «Send forespørsel» | Sammendrag |
| 2 | **Score & kontroller** | Domenekort utvides til score per kategori + kontrollpunkter med status + lenker til evidens | Leverandørens profil |
| 3 | **Bruk & kontekst** | Hvordan leverandøren brukes hos oss: prosesser, datatyper, integrasjoner, kritikalitet. Merket «Vår organisasjon» | Vår kontekst |
| 4 | **Dokumentasjon** | Alt evidens samlet: dokumenter + sertifiseringer + URL-er. Gruppert etter formål (DPA, privacy policy, security docs, sub-processor list). Merket «Leverandørens profil/evidens» | Leverandøren |
| 5 | **Historikk & relasjoner** | Revisjon/review cadence, risiko/tiltak, hendelser, relasjoner/leverandørkjede, forespørsler. Tydelig merket «Vår oppfølging (TPRM)» vs «Leverandørhendelser» | Blandet, merket |

### Tekniske endringer

**1. `src/pages/AssetTrustProfile.tsx`**
- Oppdater `vendorTabDefs` til 5 faner: `overview`, `controls`, `usage`, `evidence`, `history`
- Oppdater `TabsContent`-blokkene til å peke på nye/oppdaterte komponenter

**2. `src/components/asset-profile/tabs/VendorOverviewTab.tsx` — Redesign**
- Fjern Validering/Kontroller/Relasjoner-innhold
- Ny layout: Leverandørnavn + status-badge + sist oppdatert
- Trust Score-kort med confidence og kort «styrker/bekymringer»-liste
- 4 klikkbare domenekort (Governance, Operations, Identity, Supplier) som navigerer til tab 2
- Primær CTA-knapp «Send forespørsel / Be om dokumentasjon» (trigger RequestUpdateDialog)

**3. `src/components/asset-profile/tabs/VendorControlsTab.tsx` — Ny fil**
- Erstatter gammel ControlsTab-visning for leverandører
- Viser alle 4 domener med score-bar + utfoldbare kontrollpunkter
- Hvert kontrollpunkt: status-ikon + tekst + lenke til relevant dokument/evidens
- Bruker eksisterende `ControlsTab` og `ValidationTab` data

**4. `src/components/asset-profile/tabs/VendorUsageTab.tsx` — Ny fil**
- Merket med badge «Vår organisasjon»
- Henter fra DataHandlingTab-logikk: datakategorier, databehandlere, integrasjoner
- Viser kritikalitet, bruksområder, prosesser
- Fjerner DPA/privacy-felt som flyttes til Dokumentasjon

**5. `src/components/asset-profile/tabs/VendorEvidenceTab.tsx` — Ny fil**
- Merket med badge «Leverandørens profil/evidens»
- Samler DocumentsTab + LaraInboxTab + sertifiseringer
- Grupperer dokumenter etter formål (DPA, Privacy Policy, Security Docs, Sub-processor List, Sertifiseringer, Annet)

**6. `src/components/asset-profile/tabs/VendorHistoryTab.tsx` — Ny fil**
- To seksjoner tydelig merket:
  - «Vår oppfølging (TPRM)»: Revisjon/review cadence, risiko/tiltak, forespørsler (CustomerRequestsTab-data)
  - «Leverandørhendelser»: Hendelser/avvik (IncidentManagementTab)
- Relasjoner/leverandørkjede (RelationsTab)

### Filer som endres/opprettes
- `src/pages/AssetTrustProfile.tsx` — oppdatert tab-definisjon og TabsContent
- `src/components/asset-profile/tabs/VendorOverviewTab.tsx` — redesignet
- `src/components/asset-profile/tabs/VendorControlsTab.tsx` — ny
- `src/components/asset-profile/tabs/VendorUsageTab.tsx` — ny
- `src/components/asset-profile/tabs/VendorEvidenceTab.tsx` — ny
- `src/components/asset-profile/tabs/VendorHistoryTab.tsx` — ny
- `src/components/asset-profile/tabs/VendorRiskAuditTab.tsx` — fjernes (innhold flyttes)
- `src/components/asset-profile/tabs/VendorDocumentsTab.tsx` — fjernes (innhold flyttes)

Ingen databaseendringer nødvendig — alle data hentes fra eksisterende tabeller.

