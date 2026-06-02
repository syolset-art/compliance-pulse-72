When the user picks "Lag tilbud" from the "Legg til aktivitet"-menyen, do not show a "Tilbud opprettet"-toast. Instead open the **Tjenester**-fanen (`assessment`) hvor brukeren faktisk kan jobbe med tilbud i `MSPMaturityServiceMatrix`.

### Change

**`src/components/msp/PartnerActionMenu.tsx`** — `handle("offer")` case (linje 88–91):
- Fjern `toast.success("Tilbud opprettet", ...)`.
- Behold `logPartnerActivity(...)`.
- Kall `onSwitchTab("assessment")` slik at brukeren havner på Tjenester-fanen.

Det er det eneste stedet "Lag tilbud" som aktivitet kaster toast i stedet for å navigere. Andre flyter (`QuestionnaireDispatchCard` → `MSPCreateOfferDialog`, `MSPMaturityServiceMatrix` "Lag tilbud") åpner allerede dialog/seksjon og endres ikke.

### Files
- `src/components/msp/PartnerActionMenu.tsx`