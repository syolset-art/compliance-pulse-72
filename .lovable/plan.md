## Mål
Endre rolle skal skje inline i radene under "Teammedlemmer" — ingen modal.

## Endringer i `src/pages/AdminAccessManagement.tsx`

1. **Fjern «Endre rolle»-dialogen** og tilhørende state (`editMember`, `editReason`, samt hele `<Dialog>`-blokken nederst).
2. **Erstatt rolle-badgen i hver rad** med en kompakt `Select` (samme stil som badge, ghost-trigger med dropdown-pil) som viser nåværende rolle.
   - Listen henter fra `visibleRoles` (kun aktiverte roller).
   - `onValueChange` oppdaterer `members` direkte via `setMembers`.
   - Toast bekrefter: «{Navn} har nå rollen {NyRolle}».
3. **Behold pennen** kun som visuell affordance ved siden av select-en (eller fjern den helt for å unngå dobbeltkontroll — anbefaler å fjerne).
4. **Admin-advarsel inline:** når man bytter til `admin`, vis en liten warning-tekst (`AlertTriangle` + tekst) som glir inn under raden i 3 sekunder før den fader ut — eller bruk toast med warning-variant. Anbefaler toast for å holde radhøyden stabil.
5. **Invitasjons-rader (status `invited`):** select skal fortsatt være redigerbar, slik at man kan endre rolle før brukeren aksepterer.

## Det som beholdes
- "Administrer roller"-dialogen (organisasjonens aktiverte roller) — uendret.
- "Inviter bruker"-dialogen — uendret.
- Rollebeskrivelser i kortene øverst — uendret.

## Teknisk
- Bruk eksisterende shadcn `Select` med `SelectTrigger className="h-7 text-xs border-dashed"` for et lett, ikke-tungt utseende.
- Ingen nye filer, ingen DB-endringer (demo-state).
