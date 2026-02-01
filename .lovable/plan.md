

# Plan: Universal Compliance Checklist System with Agent-Friendly UX

## Understanding Your Vision

You want customers to see their compliance journey as a clear **checklist** - like Microsoft Compliance Manager - where they can immediately understand:
1. **What's completed** (green checkmarks) vs **what's missing** (needs attention)
2. **What the AI agents can handle automatically** vs **what they must do manually**
3. **Progress toward certification/readiness** for each framework (ISO 27001, GDPR, AI Act, etc.)

This applies to ALL frameworks, not just GDPR - customers pursuing **ISO 27001 certification** especially need this clear visibility.

## Key Concepts

### Framework Requirements Registry

Instead of only tracking tasks, we create a **requirements registry** that defines what each framework demands. Each requirement can be:
- **Completed** (green checkmark)
- **In Progress** (AI or human working on it)
- **Not Started** (needs attention)
- **Not Applicable** (documented as N/A)

### Agent vs. Manual Classification

Each requirement shows WHO can complete it:
- **AI Can Handle** (Robot icon) - Agent can complete autonomously
- **Hybrid** (Sparkles icon) - Agent assists, human approves
- **Manual Required** (User icon) - Human must complete, agent advises

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  ✅  A.5.1 Information Security Policy                       🤖 AI Ready  │
│      Status: Completed · Agent generated draft, awaiting review            │
├────────────────────────────────────────────────────────────────────────────┤
│  ⬜  A.5.7 Threat Intelligence                                ✨ Hybrid    │
│      Status: In Progress · Agent gathering data from your security tools   │
├────────────────────────────────────────────────────────────────────────────┤
│  ⬜  A.6.3 Information Security Awareness                     👤 Manual    │
│      Status: Not Started · You need to set up training program            │
└────────────────────────────────────────────────────────────────────────────┘
```

## UI Design: Compliance Checklist Preview

When a user clicks on a framework (e.g., ISO 27001 or Privacy), they see this elegant preview:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔒 ISO 27001 Certification Readiness                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │            54 / 93 Controls                                         │   │
│  │            ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  58%                           │   │
│  │                                                                     │   │
│  │   🤖 AI Handling: 28    ✨ Hybrid: 18    👤 Manual: 8             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🔴 Critical - Requires Your Attention (8)                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ⬜ A.5.24 Incident Management Planning                       👤 Manual    │
│     You need to define incident response procedures                        │
│     [Start Task →]                                                          │
│                                                                             │
│  ⬜ A.6.3 Information Security Awareness                      👤 Manual    │
│     Set up employee security training program                              │
│     [Start Task →]                                                          │
│                                                                             │
│  ⬜ A.7.1 Physical Security Perimeters                        👤 Manual    │
│     Document physical security controls for your premises                   │
│     [Start Task →]                                                          │
│                                                                             │
│  + 5 more requiring manual action...                                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✨ AI Working On (12)                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ⏳ A.8.9 Configuration Management          ▓▓▓▓▓▓▓░░░  72%  🤖 Agent     │
│     Lara is analyzing your system configurations                           │
│                                                                             │
│  ⏳ A.5.7 Threat Intelligence               ▓▓▓▓░░░░░░  45%  🤖 Agent     │
│     Pulling threat data from your security tools                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Completed (54)                                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ✅ A.5.1 Information Security Policies                       🤖 Agent     │
│  ✅ A.5.2 Information Security Roles                          ✨ Hybrid    │
│  ✅ A.5.3 Segregation of Duties                               🤖 Agent     │
│  ✅ A.8.1 User Endpoint Devices                               🤖 Agent     │
│                                                                             │
│  + 50 more completed...                                                     │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  [📋 View Full Checklist]    [📊 Export Progress Report]             ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Model

### Table: `compliance_requirements`

Stores the master list of requirements for each framework (static reference data):

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `framework_id` | TEXT | e.g., "iso27001", "gdpr", "ai-act" |
| `requirement_id` | TEXT | e.g., "A.5.1", "GDPR-Art30", "AIAACT-Art6" |
| `category` | TEXT | e.g., "organizational", "people", "physical", "technological" |
| `name` | TEXT | English name |
| `name_no` | TEXT | Norwegian name |
| `description` | TEXT | Detailed description |
| `priority` | TEXT | "critical", "high", "medium", "low" |
| `domain` | TEXT | "privacy", "security", "ai" |
| `sla_category` | TEXT | "systems_processes", "organization_governance", "roles_access" |
| `agent_capability` | TEXT | "full" (AI can complete), "assisted" (hybrid), "manual" (human only) |
| `sort_order` | INT | Display order |

### Table: `requirement_status`

Tracks per-tenant progress on each requirement:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `requirement_id` | FK | Links to compliance_requirements |
| `status` | TEXT | "not_started", "in_progress", "completed", "not_applicable" |
| `progress_percent` | INT | 0-100 for in_progress items |
| `is_ai_handling` | BOOLEAN | Agent is actively working |
| `completed_at` | TIMESTAMP | When completed |
| `completed_by` | TEXT | "agent" or "user" |
| `evidence_notes` | TEXT | Documentation/evidence |
| `linked_tasks` | UUID[] | Related tasks |
| `linked_assets` | UUID[] | Related assets |
| `linked_processes` | UUID[] | Related processes |

## Requirements Data

### ISO 27001:2022 (93 Controls)

All 93 controls from Annex A, categorized by:
- **Organizational Controls** (A.5.1 - A.5.37): 37 controls
- **People Controls** (A.6.1 - A.6.8): 8 controls
- **Physical Controls** (A.7.1 - A.7.14): 14 controls
- **Technological Controls** (A.8.1 - A.8.34): 34 controls

With agent capability mapping:
- **AI Can Handle**: Configuration checks, policy templates, risk assessments, vendor evaluations
- **Hybrid**: Security awareness documentation, incident procedures, access reviews
- **Manual Only**: Physical security, training programs, executive approvals

### GDPR (12 Core Requirements)

| Requirement | Agent Capability |
|-------------|------------------|
| ROPA (Art. 30) | Full - Agent can populate from your assets |
| Lawful Basis (Art. 6) | Assisted - Agent suggests, you confirm |
| Consent Management (Art. 7) | Manual - Your process decision |
| Data Subject Rights (Art. 15-22) | Assisted - Agent drafts procedures |
| Transfer Impact (Art. 44-49) | Full - Agent scans for transfers |
| DPIA (Art. 35) | Assisted - Agent helps assess |
| Privacy Policy (Art. 13-14) | Full - Agent generates draft |
| Processor Agreements (Art. 28) | Assisted - Agent reviews contracts |
| Breach Procedures (Art. 33-34) | Manual - Your response plan |
| DPO Appointment (Art. 37-39) | Manual - Your organizational decision |

### AI Act (8 Core Requirements)

| Requirement | Agent Capability |
|-------------|------------------|
| Risk Classification (Art. 6) | Full - Agent classifies your AI systems |
| Technical Documentation (Art. 11) | Assisted - Agent generates templates |
| Transparency Info (Art. 13) | Full - Agent scans for disclosure needs |
| Human Oversight (Art. 14) | Manual - Your process design |
| Fundamental Rights (Art. 9) | Assisted - Agent helps assess |
| EU Database Registration | Assisted - Agent prepares submission |
| Conformity Assessment | Manual - Your certification decision |
| Post-market Monitoring | Assisted - Agent helps track |

### Other ISO Standards

Same approach applies to:
- **ISO 27701** (Privacy extension) - 31 additional controls
- **ISO 42001** (AI Management) - 39 controls
- **ISO 42005** (AI Impact Assessment) - Assessment framework

## UI Components

### New Components

| Component | Description |
|-----------|-------------|
| `ComplianceChecklistPreview.tsx` | Expandable checklist for dashboard widget |
| `RequirementCard.tsx` | Individual requirement with status, agent badge |
| `RequirementDetailDialog.tsx` | Full detail view with evidence, links |
| `AgentCapabilityBadge.tsx` | Robot/Sparkles/User icon badge |
| `FrameworkProgressHeader.tsx` | Progress bar with agent breakdown |
| `ISOChecklist.tsx` | Dedicated page for ISO 27001 full checklist |

### Updated Components

| Component | Change |
|-----------|--------|
| `DomainComplianceWidget.tsx` | Show checklist preview when expanded |
| `DomainActionDialog.tsx` | Replace with ComplianceChecklistPreview |
| `Tasks.tsx` | Filter by requirement, show agent capability |

## Navigation Flow

```text
Dashboard
    │
    ├──► DomainComplianceWidget
    │         │
    │         ├──► Click "Information Security" 
    │         │         │
    │         │         ▼
    │         │    Expand to show ISO 27001 Checklist Preview
    │         │         │
    │         │         ├──► Shows 5 critical manual items
    │         │         ├──► Shows AI-in-progress items
    │         │         ├──► Shows completed count
    │         │         │
    │         │         └──► [View Full Checklist] → /iso-checklist
    │         │
    │         └──► Click requirement item → /tasks?requirement=A.5.1
    │
    └──► ISO Checklist Page (/iso-checklist)
              │
              ├──► Filter by category, status, agent capability
              ├──► Edit requirement details
              ├──► Attach evidence
              └──► Export progress report
```

## Implementation Phases

### Phase 1: Database and Seed Data
1. Create `compliance_requirements` table
2. Create `requirement_status` table  
3. Seed ISO 27001:2022 all 93 controls with agent capability mapping
4. Seed GDPR core requirements
5. Seed AI Act requirements

### Phase 2: Core Components
1. Build `AgentCapabilityBadge` component
2. Build `RequirementCard` component
3. Build `ComplianceChecklistPreview` component
4. Build `FrameworkProgressHeader` component
5. Create `useComplianceRequirements` hook

### Phase 3: Dashboard Integration
1. Update `DomainComplianceWidget` to show checklist preview
2. Refactor `DomainActionDialog` to use new components
3. Add requirement filtering to Tasks page

### Phase 4: Full Checklist Pages
1. Build `ISOChecklist.tsx` page for full 93-control view
2. Build `RequirementDetailDialog` for editing/evidence
3. Add export functionality (PDF/Excel)
4. Add to navigation/routing

### Phase 5: AI Agent Integration
1. Connect requirements to existing tasks
2. Auto-update status when agent completes work
3. Show real-time agent progress on requirements
4. Generate tasks from incomplete requirements

## Benefits

1. **Clear visibility** - Customers see exactly what's done vs. what's missing
2. **Agent transparency** - Clear indication of what AI handles vs. manual work  
3. **ISO-ready** - Full 93-control checklist for certification pursuit
4. **Prioritized action** - Critical manual items shown first
5. **Microsoft-style familiarity** - Checklist format users recognize
6. **Direct navigation** - One click to relevant tasks
7. **Audit-ready** - Clear evidence of completion with timestamps
8. **Extensible** - Same pattern for ISO 27701, ISO 42001, NIS2, SOC 2

