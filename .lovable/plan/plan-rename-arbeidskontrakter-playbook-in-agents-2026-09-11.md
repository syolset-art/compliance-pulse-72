# Plan: Rename "Arbeidskontrakter" → "Playbook" in Agents

## Goal
Replace the Norwegian term "Arbeidskontrakter" with "Playbook" everywhere it appears in the Agents module, keeping navigation and i18n consistent.

## Scope
- Sidebar menu item and any submenu labels
- Route path `/agents/contracts` → `/agents/playbooks`
- Page title, tab label, and empty-state copy on the contracts/playbooks page
- Button labels and headings that refer to creating/editing an arbeidskontrakt
- English translation key/value pairs ("Work contracts" → "Playbooks")
- Norwegian translation key/value pairs ("Arbeidskontrakter" → "Playbook")
- Component/file names only if they are clearly named after the old term and do not risk breaking other imports

## Out of scope
- Changing the underlying data model or API names (e.g. `agent_contracts` table remains unchanged)
- Renaming generic "contract" concepts outside the Agents module

## Steps
1. Search the codebase for occurrences of "Arbeidskontrakter", "arbeidskontrakter", and the `/agents/contracts` route.
2. Update the Sidebar Agents submenu label from "Arbeidskontrakter" to "Playbook".
3. Change the route declaration from `/agents/contracts` to `/agents/playbooks` and update the corresponding component route.
4. Update page title, tab label, and any CTA/empty-state text on the contracts page.
5. Update i18n translation files for both `en` and `no` where the term appears.
6. Verify that no hardcoded references to the old route or label remain in navigation helpers, breadcrumbs, or activation targets.
7. Run TypeScript check to confirm no broken imports or missing keys.

## Acceptance criteria
- The Agents sidebar item reads "Playbook" instead of "Arbeidskontrakter".
- Navigating to the item loads `/agents/playbooks`.
- Both Norwegian and English UI use "Playbook" consistently.
- TypeScript check passes with no errors.
