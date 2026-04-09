

## Plan: Utvidbar rolleliste for compliance og risikostyring

### Kontekst
Dagens roller: Administrator, Compliance-ansvarlig, Behandlingsansvarlig, CISO, DPO, IT-ansvarlig, Medlem.

### Foreslåtte tilleggsroller

Basert på ISO 27001, GDPR, NIS2, AI Act og ESG-rammeverk er disse rollene relevante:

| Rolle | Nøkkel | Begrunnelse |
|---|---|---|
| **Risikoeier** | `risk_owner` | Eier og følger opp risikoer i risikoregisteret. Sentral i ISO 27001 og NIS2. |
| **Internrevisor** | `internal_auditor` | Utfører interne revisjoner og kontroller. Krav i ISO 27001 og SOC 2. |
| **AI Governance-ansvarlig** | `ai_governance` | Styring av AI-systemer iht. AI Act. Allerede definert i `useUserRole.ts`. |
| **Bærekraftsansvarlig (ESG)** | `esg_officer` | ESG-rapportering og CSRD-compliance. Allerede foreslått i `rolesSuggestions.ts`. |
| **Hendelsesansvarlig** | `incident_manager` | Håndterer sikkerhets- og personvernhendelser. Kritisk for NIS2 (72t rapportering). |
| **Systemeier** | `system_owner` | Ansvarlig for spesifikke systemer/assets. Vanlig i ISO 27001-kontekst. |
| **HR / Opplæringsansvarlig** | `training_officer` | Ansvarlig for sikkerhetsopplæring og bevisstgjøring av ansatte. |
| **Leverandøransvarlig** | `vendor_manager` | Tredjepartsstyring, DPA-oppfølging og leverandørvurderinger. |

### Implementasjon

1. **Utvide rollelisten** i `AdminAccessManagement.tsx` med de nye rollene, inkludert ikon, norsk/engelsk label og beskrivelse.

2. **Gjøre roller aktiverbare** — Legge til en «Administrer roller»-seksjon der brukeren kan aktivere/deaktivere hvilke roller som er tilgjengelige i sin organisasjon. Roller som ikke er aktivert vises ikke i rollelisten ved invitasjon.

3. **Oppdatere `useUserRole.ts`** — Synkronisere `AppRole`-typen og labels med de nye rollene.

4. **Oppdatere `rolesSuggestions.ts`** — Koble foreslåtte roller til de nye nøklene slik at onboarding-forslag matcher.

5. **Lagre aktiverte roller** — Enten i `company_profile` (som en `active_roles`-array) eller i en ny tabell, slik at valget persisteres.

### Teknisk tilnærming
- Legge til et `active_roles` text[]-felt på `company_profile`-tabellen via migrasjon
- Bygge en toggle-basert UI for å aktivere/deaktivere roller
- Filtrere rollelisten i invitasjonsdialogen basert på aktiverte roller
- Medlem forblir alltid aktiv og kan ikke deaktiveres

