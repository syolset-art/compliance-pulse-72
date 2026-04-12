

## Plan: Flytt «Brukere» inn under «Innstillinger» som «Medlemmer»

### Hva endres
1. **Fjern «Brukere»-fanen** som egen tab
2. **Utvid «Innstillinger»-fanen** med en «Medlemmer»-seksjon som har to tydelige grupper:
   - **Eier** — den ansvarlige personen for arbeidsområdet (fra `responsible_person`), vist med krone/eier-badge
   - **Delegerte roller** — liste med tre rolletyper:
     - *Systemansvarlig* — ansvar for systemer i arbeidsområdet
     - *Tiltaksansvarlig* — ansvar for valgte risikoscenarier i prosesser
     - *Prosessansvarlig* — ansvar for behandlingsaktiviteter
   - Hver rolle viser navn (eller «Ikke tildelt») med mulighet for inline-redigering
3. **Oppdater tab-listen** — fjern `users`-triggeren, oppdater badge-telling i header-stats

### Teknisk gjennomføring

**Fil: `src/pages/WorkAreas.tsx`**
- Fjern `TabsTrigger value="users"` og tilhørende `TabsContent value="users"`
- Fjern brukertelling fra header-stats (linje 782-785)
- Utvid `TabsContent value="settings"` med ny Medlemmer-seksjon:
  - Card med tittel «Medlemmer»
  - Seksjon 1: «Eier» — viser `selectedWorkArea.responsible_person` med Crown-ikon og badge
  - Seksjon 2: «Delegerte roller» — tre rader (Systemansvarlig, Tiltaksansvarlig, Prosessansvarlig) med inline-redigerbare navnefelt
  - Roller lagres foreløpig som demo/placeholder (ingen nye DB-tabeller nå, men klar for det)

### Filer som endres
- `src/pages/WorkAreas.tsx` — eneste fil

