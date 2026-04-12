

## Plan: Utvid Innstillinger-fanen med redigerbare felter

### Hva endres
Erstatter den nåværende «Administrasjon»-kortet (som bare har Rediger/Slett-knapper) med et fullverdig innstillingsskjema direkte i fanen.

### Ny struktur for Innstillinger-fanen

1. **Medlemmer-kort** — beholdes som i dag (Eier + delegerte roller)

2. **Arbeidsområde-detaljer** (nytt kort, erstatter «Administrasjon»)
   - **Navn** — redigerbart tekstfelt med inline-lagring
   - **Ansvarlig person** — gjenbruk `ResponsiblePersonEditor`-komponenten (allerede finnes)
   - **Beskrivelse** — redigerbart textarea med en «Foreslå med Lara»-knapp (Sparkles-ikon) som autogenererer et beskrivelsesforslag basert på arbeidsområdets navn via Lara AI
   - **Status** — Switch-komponent for Aktiv/Inaktiv

3. **Faresone** (nytt kort, rødt/destruktivt område)
   - «Slett arbeidsområde»-knapp med bekreftelsesdialog (gjenbruker eksisterende `AlertDialog`)

### Teknisk gjennomføring

**Fil: `src/pages/WorkAreas.tsx`**
- Fjern «Administrasjon»-kortet (linje 1120-1144)
- Legg til nytt «Detaljer»-kort med:
  - Inline-redigerbar `Input` for navn (lagrer til `work_areas.name` on blur/Enter)
  - `ResponsiblePersonEditor` for ansvarlig person
  - `Textarea` for beskrivelse med lagre-knapp + «Foreslå med Lara»-knapp
  - `Switch` for aktiv-status (lagrer til `work_areas` — bruker eksisterende metadata-felt eller lifecycle-liknende felt)
- Legg til «Faresone»-kort med Slett-knapp
- Lara-forslag: kaller eksisterende Lara edge function med prompt "Generer en kort beskrivelse for arbeidsområdet: {navn}" og fyller inn textarea

### Filer som endres
- `src/pages/WorkAreas.tsx` — eneste fil

Ingen databaseendringer nødvendig — navn, beskrivelse og ansvarlig person finnes allerede i `work_areas`-tabellen. Status kan lagres i eksisterende felt.

