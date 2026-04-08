

## Plan: Konsekvensvarsel og tiltak ved «Nei» / «Vet ikke» i KI-sjekklisten

### Hva endres

Når brukeren svarer **Nei** eller **Vet ikke** på et sjekklistepunkt, vises umiddelbart et kontekstuelt varsel som inneholder:

1. **Mulige hendelser/konsekvenser** — hva kan gå galt (f.eks. «Brudd på AI Act Art. 50 — risiko for bøter opptil 3% av omsetning»)
2. **Ansvarsplassering iht. AI Act** — hvem har ansvaret (tilbyder, bruker, importør)
3. **Tiltaksforslag** — konkret handling som bør gjennomføres
4. **Rapportflagg** — markering om at dette blir synlig som et åpent tiltak i samsvarsrapporten

### Tekniske endringer

**1. Utvide `FEATURE_CHECKLIST_MAP` i `src/lib/processAISuggestions.ts`**

Hvert sjekkpunkt får nye felter i tillegg til `question` og `helpText`:

```text
consequence: string     — Hva kan skje ved manglende etterlevelse
aiActReference: string  — Artikkelhenvisning i AI Act
responsibility: string  — Hvem har ansvaret (tilbyder/bruker/begge)
suggestedAction: string — Konkret tiltak
```

**2. Oppdatere `ChecklistItem`-interface i `ProcessAIDialog.tsx`**

Legge til de nye feltene slik at de følger med fra generering til visning.

**3. Ny UI-blokk for «Nei» og «Vet ikke» i sjekklisten**

- **Nei**: Rød varselblokk med konsekvens, AI Act-referanse, ansvar og foreslått tiltak. Badge: «Kommer i rapport som åpent tiltak».
- **Vet ikke**: Beholder eksisterende gul hjelpetekst, men legger til en mildere versjon av konsekvens og anbefaling om å avklare.

**4. Lagre flaggede tiltak ved fullføring**

Når veiviseren fullføres, inkluderes sjekkpunkter med «Nei»/«Vet ikke» i `compliance_checklist`-feltet med status `action_required` / `needs_clarification`, slik at rapporten kan plukke dem opp.

**5. Erstatte «AI» med «KI» i alle norske strenger**

Alle brukersynlige tekster i de berørte filene oppdateres til å bruke «KI» i stedet for «AI».

### Eksempel på brukeropplevelse

Spørsmål: *«Informeres brukerne om at de kommuniserer med KI?»*
Bruker svarer **Nei** →

```text
⚠️ Mulig konsekvens
Brudd på KI-forordningen Art. 50 — brukere har rett til å vite
at de samhandler med et KI-system. Manglende informasjon kan
medføre bøter opptil 3% av global omsetning.

📋 Ansvar: Tilbyder (deployer) av KI-systemet
🔧 Foreslått tiltak: Implementer tydelig merking i brukergrensesnittet

🔴 Dette vil vises som et åpent tiltak i samsvarsrapporten
```

### Berørte filer
- `src/lib/processAISuggestions.ts` — utvide datamodell med konsekvenser og ansvar
- `src/components/process/ProcessAIDialog.tsx` — ny UI for Nei/Vet ikke, oppdatere interface og lagring

