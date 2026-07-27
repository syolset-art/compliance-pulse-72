Oppgave: Oppdatere «Regelverk»-kortet på `AdminOrganisation.tsx` slik at det viser de regelverkene Mynder AS (partneren/organisasjonen selv) har aktivert, hentet fra `selected_frameworks`-tabellen.

Nåværende tilstand:
- `AdminOrganisation.tsx` henter aktiv regelverkstatus fra `domain_addons` (kolonne `status = 'active'`).
- Kortet viser bare antall aktiverte: «Aktivert: 0» — og selv dette tallet er feil fordi datakilden ikke er regelverkstabellen.
- Ingen visning av hvilke regelverk som faktisk er aktivert.

Endringer:
1. **Hent data fra riktig tabell**
   - Erstatt spørringen mot `domain_addons` med en spørring mot `selected_frameworks`:
     - `select('framework_id, framework_name, category, is_selected')`
     - Filtrer på `is_selected = true` (dette er organisasjonens egne valg).
   - Oppdater `frameworkNames`-state til å inneholde `framework_name` fra `selected_frameworks` i stedet for `domain_id` fra `domain_addons`.

2. **Oppdater statistikk og visning**
   - `stats.activeFrameworks` settes til antall rader hvor `is_selected = true`.
   - I «Regelverk»-kortet (linje ~360-383) legges det under «Aktivert: N» en kompakt liste over aktiverte regelverk, f.eks. som en rad med små badges/chips eller en semikolon-separert tekst.
   - Hvis ingen regelverk er aktiverte, vises en kort melding som inviterer brukeren til å redigere valg.

3. **Behold navigasjon og funksjonalitet**
   - «Rediger valg»-knappen og navigasjon til `/regulations` beholdes uendret.
   - Ingen endring på andre seksjoner på siden.

4. **Kategori-farger/ikoner (valgfri, subtil forbedring)**
   - Bruk `frameworkDefinitions.ts` til å slå opp kategori og eventuelt vise kategori-ikon eller farge på chips. Dette er subtilt og skal ikke ta for stor plass.

Fil som endres:
- `src/pages/AdminOrganisation.tsx`