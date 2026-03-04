

## Plan: Proaktiv NIS2-sjekkliste med handlingsknapper og Lara-agent-klassifisering

### Oversikt
Gjøre NIS2-sjekklisten proaktiv ved å (1) klassifisere hvert krav som "Lara kan løse", "Aktiverbar tjeneste" eller "Manuell", (2) legge til direkte handlingsknapper for å aktivere sikkerhetstjenester rett fra sjekklisten, og (3) vise hva Lara AI-agenten allerede har gjort og kan gjøre videre.

### Ny datamodell i `nis2Requirements.ts`

Utvide `NIS2Requirement`-interfacet med:
- `agentCapability`: `"ai_ready" | "activatable" | "hybrid" | "manual"` — klassifiserer hva Lara kan gjøre
- `agentAction`: beskrivelse av hva Lara gjør/kan gjøre for dette kravet
- `activatableServiceId?`: kobling til sikkerhetstjeneste-katalogen (f.eks. `"adv-backup"`, `"adv-dlp-ai"`, `"adv-security-edr"`)
- `activatableServiceLabel?`: visningsnavn for tjenesten

Klassifisering per krav:

| Krav | Type | Lara-handling |
|------|------|---------------|
| Risikoanalyse | `hybrid` | Lara kan generere risikorapport-utkast basert på enhetens metadata |
| Hendelseshåndtering | `activatable` | Kan aktivere SOC/MDR-tjeneste |
| Backup | `ai_ready` | Lara sjekker automatisk; kan aktivere backup-tjeneste |
| Forsyningskjede | `manual` | Krever manuell leverandørvurdering |
| Anskaffelsessikkerhet | `manual` | Krever intern policy |
| Sårbarhetshåndtering | `activatable` | Kan aktivere patch management-modul |
| Cyberhygiene | `activatable` | Kan aktivere Security Awareness Training |
| Kryptering | `ai_ready` | Lara sjekker automatisk |
| Tilgangskontroll | `activatable` | Kan aktivere MDM-modul |
| MFA | `hybrid` | Lara sjekker; krever manuell aktivering i AD/IdP |

### Oppdatert `NIS2AssessmentTab`

1. **Capability-badge per krav** (i kollapsert visning):
   - Grønn robot-ikon + "Lara håndterer" for `ai_ready`
   - Blå bolt-ikon + "Kan aktiveres" for `activatable`
   - Gul ikon + "Hybrid" for `hybrid`
   - Grå ikon + "Manuell" for `manual`

2. **Handlingsknapp i ekspandert innhold** (for `activatable` krav):
   - "Aktiver [tjenestenavn]"-knapp som kaller `useActivatedServices().activateService()`
   - Hvis allerede aktivert: grønn badge "Aktivert ✓" + tidspunkt
   - Knappen endrer kravstatus til "pass" automatisk ved aktivering

3. **Lara-handlingspanel** (for `ai_ready`/`hybrid`):
   - Viser hva Lara allerede har sjekket
   - For `hybrid`: "Lara kan lage utkast"-knapp (simulert — viser toast med "Utkast generert")

4. **Oppsummering øverst** utvidet med:
   - Breakdown: "X håndtert av Lara · Y kan aktiveres · Z krever manuell innsats"

### Filer

| Fil | Endring |
|-----|---------|
| `src/lib/nis2Requirements.ts` | Utvid interface + data med agentCapability, activatableServiceId |
| `src/components/devices/NIS2AssessmentTab.tsx` | Legg til capability-badges, aktiveringsknapper, Lara-handlingspanel, utvidet oppsummering |

