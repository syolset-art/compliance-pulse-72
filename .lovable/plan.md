Replace the partner-name combobox in the "Legg til partner" dialog with a plain text input that shows suggestions as the user types, without purple hover styling.

### What to change
In `src/components/company/CompanyInfoForm.tsx` (lines 644–709):

1. **Replace the trigger Button with an Input**  
   Remove the `PopoverTrigger` containing the `Button` with `role="combobox"`. Instead, render a standard `Input` field that:
   - Accepts free-text typing
   - Opens the suggestion popover on focus or when the user starts typing
   - Does NOT turn purple on hover/focus

2. **Keep the suggestion list**  
   Keep the `PopoverContent` with `Command`/`CommandList`, but:
   - Override `CommandItem` hover/focus styles so they use neutral grays (`bg-muted`, `text-foreground`) instead of the theme's purple (`bg-primary`, `text-primary`)
   - Remove or neutralize the `Shield` icon inside each `CommandItem` so the row does not highlight in purple

3. **Preserve existing behaviour**
   - Selecting a suggestion still pre-fills partner type and role description
   - Typing a non-matching name still works ("Ingen treff i Mynder Trust" + manual add)
   - The `draftPartnerName` state and `selectPartner` logic stay the same

### Files to edit
- `src/components/company/CompanyInfoForm.tsx` — the partner picker dialog only