

# Plan: Integrere Compliance-sjekkliste i brukergrensesnittet

## Nåværende situasjon

Det vi har bygget:
- ✅ Database: `compliance_requirements` med 93 ISO-kontroller, 12 GDPR-krav, 8 AI Act-krav
- ✅ Database: `requirement_status` for å spore fremgang
- ✅ Komponenter: `ComplianceChecklistPreview`, `RequirementCard`, `AgentCapabilityBadge`
- ✅ Hook: `useComplianceRequirements` for datahåndtering

Det som mangler:
- ❌ Integrasjon i `DomainComplianceWidget` på dashboard
- ❌ Full sjekkliste-side (f.eks. `/compliance-checklist`)
- ❌ Filtrering på Oppgave-siden basert på krav

## Løsning: Tre integrasjonspunkter

### 1. Dashboard-widget viser sjekkliste-preview

Når du klikker på "Personvern" eller "Informasjonssikkerhet" i `DomainComplianceWidget`, skal den vise `ComplianceChecklistPreview` i stedet for bare prosent.

```text
┌──────────────────────────────────────────────────────────────┐
│  🔒 Informasjonssikkerhet                           [Ekspander]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ISO 27001 Readiness                                         │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░  42% (39/93 controls)                   │
│                                                              │
│  🤖 AI: 35   ✨ Hybrid: 42   👤 Manual: 16                   │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  🔴 Requires Your Attention (5)                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  ⬜ A.5.24 Incident Management          👤 Manual  [Start →] │
│  ⬜ A.6.3 Security Awareness            👤 Manual  [Start →] │
│  ⬜ A.7.1 Physical Security             👤 Manual  [Start →] │
│  + 2 more...                                                 │
│                                                              │
│  ✅ Completed (39)                                           │
│  ✅ A.5.1 Information Security Policy                        │
│  ✅ A.5.2 Information Security Roles                         │
│  + 37 more...                                                │
│                                                              │
│  [📋 View Full ISO 27001 Checklist]   [💬 Ask Lara]         │
└──────────────────────────────────────────────────────────────┘
```

### 2. Ny dedikert sjekkliste-side

Opprett `/compliance-checklist` (eller `/iso-checklist`) med full visning av alle krav:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  🔒 ISO 27001 Compliance Checklist                                       │
│                                                                          │
│  39 of 93 Controls Completed                           39% Ready         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░                                    │
│                                                                          │
│  [Filter: All ▼] [Category: All ▼] [Agent: All ▼] [Priority: All ▼]     │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│  📁 Organizational Controls (A.5.1 - A.5.37)           22/37 ✓          │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  ✅ A.5.1 Information Security Policies        🤖 AI Ready    Completed  │
│  ✅ A.5.2 Information Security Roles           ✨ Hybrid      Completed  │
│  ⏳ A.5.3 Segregation of Duties                🤖 AI Ready    72% ▓▓▓░░ │
│  ⬜ A.5.4 Management Responsibilities          👤 Manual      Not Started│
│  ...                                                                     │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│  📁 People Controls (A.6.1 - A.6.8)                    5/8 ✓            │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  ✅ A.6.1 Screening                            ✨ Hybrid      Completed  │
│  ⬜ A.6.3 Information Security Awareness       👤 Manual      Not Started│
│  ...                                                                     │
│                                                                          │
│  [📊 Export Progress Report]  [📄 Generate Evidence Pack]               │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3. Oppgave-siden støtter requirement-filtrering

Fra sjekklisten kan brukere klikke på et krav for å gå til `/tasks?requirement=A.5.24` og se relaterte oppgaver.

## Filer som endres/opprettes

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `src/components/widgets/DomainComplianceWidget.tsx` | **Oppdater** | Integrer `ComplianceChecklistPreview` |
| `src/pages/ComplianceChecklist.tsx` | **Ny** | Full sjekkliste-side for ISO/GDPR/AI Act |
| `src/App.tsx` | **Oppdater** | Legg til route `/compliance-checklist` |
| `src/components/Sidebar.tsx` | **Oppdater** | Legg til menylenke til sjekklisten |
| `src/pages/Tasks.tsx` | **Oppdater** | Støtt `?requirement=` filter-parameter |

## Implementeringssteg

### Steg 1: Integrer sjekkliste i Dashboard-widget
Oppdater `DomainComplianceWidget` til å bruke `ComplianceChecklistPreview` når et domene utvides.

### Steg 2: Opprett full sjekkliste-side
Bygg `ComplianceChecklist.tsx` med:
- Velg rammeverk (ISO 27001, GDPR, AI Act)
- Filtrer etter kategori, status, agent-kapasitet
- Vis alle krav gruppert etter kategori
- Eksportmulighet

### Steg 3: Legg til navigasjon
- Route i `App.tsx`
- Menylenke i `Sidebar.tsx`
- "View Full Checklist"-knapp fra widget

### Steg 4: Oppgave-filtrering
Utvid `Tasks.tsx` til å støtte `?requirement=A.5.24` og vise bare oppgaver knyttet til det kravet.

## Brukerflyt

```text
Dashboard
    │
    └──► DomainComplianceWidget
              │
              ├──► Klikk "Informasjonssikkerhet"
              │         │
              │         ▼
              │    Sjekkliste-preview vises
              │         │
              │         ├──► ✅ Se hva som er fullført (grønt)
              │         ├──► ⬜ Se hva som mangler (må gjøres)
              │         │
              │         └──► [View Full Checklist] 
              │                   │
              │                   ▼
              │              /compliance-checklist?framework=iso27001
              │                   │
              │                   ├──► Alle 93 kontroller
              │                   ├──► Filtrer og sorter
              │                   └──► Klikk på krav → /tasks?requirement=A.5.1
              │
              └──► Oppgavesiden
                        │
                        └──► Viser oppgaver knyttet til valgt krav
```

## Fordeler

1. **Klar synlighet** - Du ser umiddelbart hva som er gjort vs. hva som gjenstår
2. **ISO-ready** - Full 93-kontroll sjekkliste for sertifisering
3. **Agent-transparent** - Tydelig hva AI gjør vs. hva du må gjøre selv
4. **Prioritert** - Kritiske manuelle oppgaver vises først
5. **Navigerbar** - Ett klikk fra sjekkliste til relaterte oppgaver

