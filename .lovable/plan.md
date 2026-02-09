

## Vendor Management as a Visible Feature with Tiered Capabilities

Rather than creating a completely separate paid module, the recommendation is to make Vendor/Third-Party Management a **prominently visible feature area** with capabilities gated by subscription tier. This keeps the core vendor registry accessible to all users while making advanced features (AI analysis, benchmarking) a reason to upgrade.

### Why Not a Separate Module?

- Vendor management is a **regulatory requirement** (GDPR Art. 28, ISO 27001 A.15, NIS2) -- all customers need it
- Splitting it out would leave a gap in the core compliance offering
- The premium value lies in **AI analysis and benchmarking**, not in basic vendor tracking

### Architecture: Feature Tiers

```text
+---------------------------------------------------+
|  STARTER (included)                                |
|  - Vendor registry (list, add, categorize)         |
|  - Basic vendor profile with existing tabs         |
|  - Document upload (up to 5 per vendor)            |
+---------------------------------------------------+
|  PROFESSIONAL (included)                           |
|  - Unlimited document uploads                      |
|  - AI-powered vendor compliance analysis           |
|  - Compliance scoring per vendor                   |
+---------------------------------------------------+
|  ENTERPRISE (included)                             |
|  - Everything in Professional                      |
|  - Vendor benchmarking (compare against peers)     |
|  - Portfolio-level risk dashboard                  |
|  - Export vendor compliance reports                 |
+---------------------------------------------------+
```

### Changes

**1. Sidebar: Rename and add sub-navigation**

Rename "Leverandorer" to "Tredjepartsstyring" (Third-Party Management) in the sidebar to communicate the full scope. Add it as a slightly more prominent item, possibly with a sub-menu:

- Vendor Overview (current /assets page)
- Vendor Comparison (new, gated to Enterprise)

**2. Vendor Profile: Add Documents tab and Analysis tab**

On the `AssetTrustProfile` page, add two new tabs:

- **Documents** -- upload and tag reports (penetration tests, DPIAs, SOC2, ISO certs). All tiers can upload; Starter is limited to 5 docs per vendor.
- **Analysis** -- AI-driven compliance assessment. Shows overall score + category breakdown. Gated to Professional+. Starter users see a teaser/upgrade prompt.
- **Benchmark** -- compare vendor scores against category averages using radar charts (Recharts). Gated to Enterprise. Professional users see a teaser.

**3. Database: New tables**

- `vendor_documents` -- stores file metadata (path in storage, type, notes, asset_id)
- `vendor_analyses` -- stores AI analysis results (jsonb scores, findings, linked documents)
- Both with RLS policies for authenticated users

**4. Backend: New edge function**

- `analyze-vendor` -- reads uploaded documents from storage, sends to AI (Gemini), returns structured compliance assessment with scores across categories (data handling, security, privacy, availability)

**5. Upgrade prompts and feature gating**

- Use the existing `useSubscription` hook and `isDomainIncluded` pattern
- When a Starter user clicks "Analyze Vendor", show a card explaining the feature with an upgrade button
- When a Professional user views the Benchmark tab, show a preview with upgrade prompt

**6. Dashboard visibility**

- The existing `ThirdPartyWidget` and `ThirdPartyManagementWidget` already appear on relevant role dashboards -- these will pull real data from the new tables instead of hardcoded values

### Technical Details

| File | Change |
|------|--------|
| `src/locales/en.json`, `nb.json` | Rename "Vendors" to "Third-Party Management" / "Tredjepartsstyring" in sidebar nav. Add keys for Documents, Analysis, Benchmark tabs and gating messages |
| `src/components/Sidebar.tsx` | Update the nav item label from `nav.assets` to use the new key |
| **New:** `src/components/asset-profile/tabs/DocumentsTab.tsx` | Upload UI with document type selector, file list, delete. Uses Lovable Cloud storage |
| **New:** `src/components/asset-profile/tabs/AnalysisTab.tsx` | AI analysis results display, trigger button, score breakdown. Subscription-gated |
| **New:** `src/components/asset-profile/tabs/BenchmarkTab.tsx` | Radar/bar chart comparing vendor vs category average. Subscription-gated |
| `src/pages/AssetTrustProfile.tsx` | Add Documents, Analysis, and Benchmark tabs |
| **New:** `supabase/functions/analyze-vendor/index.ts` | Edge function: reads docs from storage, calls Gemini, returns structured JSON |
| **Migration** | Create `vendor_documents` and `vendor_analyses` tables, create storage bucket `vendor-documents`, add RLS policies |
| `src/hooks/useSubscription.ts` | No changes needed -- existing tier logic handles gating |

### User Flow

1. User navigates to "Tredjepartsstyring" in the sidebar (goes to /assets)
2. Clicks a vendor to open the Trust Profile
3. Uploads a penetration test PDF and a DPIA under the "Documents" tab
4. Clicks "Analyze Vendor" -- AI processes documents and produces compliance scores
5. Views breakdown: overall score + per-category (data handling, security, privacy, availability)
6. (Enterprise) Switches to "Benchmark" tab to compare this vendor against others in the same category
7. (Starter) Sees upgrade prompt when trying to trigger analysis

### Gating Logic

The existing `useSubscription().subscription?.plan?.name` value is used:
- `starter` -- basic features + document upload (capped at 5)
- `professional` -- AI analysis unlocked
- `enterprise` -- benchmarking unlocked

No new subscription tables or addon logic needed -- this fits within the existing tier structure.

