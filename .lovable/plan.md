

## Problem

When a user expands the "Styring" (Governance) control area and sees the document upload checklist, there's no indication that Mynder Core already functions as their governance tool. The user might think they need to create a separate governance framework from scratch, when in reality Mynder Core covers the baseline. They may still have **additional** governance documents (e.g., board-approved policies, organizational ISMS documents) to upload.

## Plan

### 1. Add contextual info banner in the Governance document checklist

In `InlineDocumentChecklist.tsx`, when `controlArea === "governance"`, render an informational banner above the document list explaining:

- **Norwegian**: "Mynder Core fungerer som ditt styringsrammeverk. Dokumentene nedenfor er valgfrie tilleggsdokumenter som kan styrke din modenhetsvurdering — for eksempel egne policyer, styrevedtak eller organisasjonsspesifikke retningslinjer."
- **English**: "Mynder Core serves as your governance framework. The documents below are optional additions that can strengthen your maturity assessment — such as your own policies, board decisions, or organization-specific guidelines."

This will be a subtle info-styled banner (blue/muted with an `Info` icon) placed between the header and the document rows.

### 2. Adjust the "Styringsrammeverk" document row label

Change the third expected doc for governance from:
- "Styringsrammeverk / governance-dokument" → "Eget styringsrammeverk (valgfritt)" / "Custom Governance Framework (optional)"

This makes it clear that uploading a separate governance document is supplementary, not required.

### Files to modify
- `src/components/trust-controls/InlineDocumentChecklist.tsx` — Add contextual banner for governance area; update label for the governance framework doc row.

