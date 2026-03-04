

## Plan: Speile LLM-sikkerhetstjeneste-aktivering i enhetsvisningen

### Problem
Aktivering av "AI/LLM-sikkerhet" i sikkerhetstjenestekatalogen er lokal state i `SecurityServicesSection` og reflekteres ikke i enhetenes compliance-sjekkliste eller LLM-bruksoversikt. Brukeropplevelsen brytes — man aktiverer en tjeneste, men enhetene viser fortsatt "ubegrenset" og "fail".

### Løsning
Introdusere en delt state-mekanisme som lar DeviceComplianceTab vite om LLM-sikkerhetstjenesten er aktivert, og oppdatere visningen deretter.

### Implementering

**1. Ny hook: `src/hooks/useActivatedServices.ts`**
- Global state (via React context eller enkel localStorage-basert hook) som holder styr på hvilke sikkerhetstjenester som er aktivert
- Eksporterer `activatedServiceIds` og `activateService(id)`/`isServiceActive(id)`
- `SecurityServicesSection` skriver til denne når bruker aktiverer en tjeneste
- `DeviceComplianceTab` leser fra denne for å sjekke om `adv-dlp-ai` er aktiv

**2. Oppdater `DeviceComplianceTab`**
- Importer `useActivatedServices`
- Når `adv-dlp-ai` er aktiv: 
  - LLM-brukskortene viser `accessLevel: "managed"` i stedet for `"unrestricted"` (visuelt override)
  - ISO-kontrollpunktet "LLM-tilgang sikret" endres til "pass"
  - Vis en liten badge/info som sier "Beskyttet av Acronis Advanced DLP for AI"
- Compliance-scoren øker automatisk

**3. Oppdater `SecurityServicesSection`**
- Når bruker aktiverer en tjeneste via `handleActivate`, skriv også til `useActivatedServices`

**4. Visuell flyt i DeviceComplianceTab ved aktivert LLM-sikkerhet**
- LLM-kort som var røde (unrestricted) → grønne (managed via DLP)
- Advarselsbanner forsvinner
- Ny info-linje: "DLP for AI aktivert — all LLM-trafikk overvåkes"
- Kontrollpunktet "LLM-tilgang sikret" → grønt hakmerke

### Filer

| Fil | Endring |
|-----|---------|
| `src/hooks/useActivatedServices.ts` | Ny — delt state for aktiverte sikkerhetstjenester |
| `src/components/devices/DeviceComplianceTab.tsx` | Les fra useActivatedServices, override LLM-visning |
| `src/components/asset-profile/tabs/SecurityServicesSection.tsx` | Skriv til useActivatedServices ved aktivering |

