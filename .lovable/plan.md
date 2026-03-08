

## Plan: Separate Compliance and Controls into dedicated pages

### Current state

- **Controls** (`MynderControls`) exists at `/compliance-checklist` and `/resources/controls` — shows the 4-domain control overview (Governance, Operations, Identity & Access, Supplier & Ecosystem)
- **Compliance** (`ComplianceChecklist`) exists at `/compliance-checklist` route (but currently MynderControls is mounted there) — has framework-based requirement tracking with filters and progress
- **Regulations** (`/regulations`) — framework activation and management
- Neither Compliance nor Controls has a dedicated primary sidebar entry

### Proposed structure

```text
Sidebar (new section: "Compliance & Security")
├── Compliance     → /compliance       (framework compliance status)
├── Controls       → /controls         (security controls by domain)
├── Regulations    → /regulations      (framework activation — stays in admin)
└── Calendar       → /compliance-calendar (stays as-is)
```

### Changes

**1. Sidebar — Add "Compliance & Security" section**
- Add two new primary nav items: **Compliance** (`/compliance`, Shield icon) and **Controls** (`/controls`, CheckCircle2 icon)
- Remove `/compliance-calendar` from main nav; group it under this section instead
- This creates a clear "security home" in the sidebar

**2. New route: `/compliance`**
- Mount the existing `ComplianceChecklist` page at `/compliance`
- This is the framework-based view: ISO 27001 requirements, progress headers, agent capabilities, filters
- Update page title/header to "Compliance Status" to distinguish from controls

**3. New route: `/controls`**
- Mount `MynderControls` at `/controls`
- This is the domain-based control overview (Governance, Operations, Identity & Access, Supplier & Ecosystem)
- Keep existing content as-is

**4. Route cleanup in App.tsx**
- Add `/compliance` → `ComplianceChecklist`
- Add `/controls` → `MynderControls`
- Keep `/compliance-checklist` and `/resources/controls` as redirects for backward compatibility

**5. Dashboard links**
- Update "View maturity details" CTA in `ComplianceStatusHero` to point to `/controls`
- Update any other internal links referencing the old paths

### What stays the same
- All page content remains unchanged
- Regulations page stays in admin submenu
- Calendar stays at `/compliance-calendar`

### Result
Users get two clear, distinct pages in the sidebar:
- **Compliance** = "Are we meeting regulatory requirements?"
- **Controls** = "What security measures do we have in place?"

