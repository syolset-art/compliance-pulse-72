

## Forbedre aktivitetslisten — klarere oppgaver med status og avhuking

### Problemet (fra bildet)

Listen med oppgaver og ventende aktiviteter er vanskelig å forstå:
- Alle elementer ser like ut — ingen visuell gruppering eller hierarki
- Ingen mulighet til å markere oppgaver som utført eller pågående
- Ingen synlig tildelt person per oppgave
- Brukeropprettede aktiviteter blander seg inn uten kontekst
- "Venter svar"-elementene nederst ser ut som oppgaver, men er passive ventepunkter

### Løsning

**Redesign av oppgaveradene i `VendorTPRMStatus`** med tre forbedringer:

#### 1. Interaktiv checkbox for statusendring
- Erstatte den passive fargedotten med en klikkbar **Checkbox** per oppgave
- Klikk = marker som utført (oppdaterer status i DB for DB-oppgaver, eller viser toast for kontrolloppgaver)
- Checkbox viser tre tilstander visuelt:
  - Tom sirkel = åpen
  - Halvsirkel/strek = pågående  
  - Avhuket = utført (raden fades ut og flyttes til "Utført"-fanen)

#### 2. Tydelig ansvarlig person per rad
- Vise **hvem** som er ansvarlig under oppgavetittelen (f.eks. "Jan Olsen" eller "Ikke tildelt")
- For kontrolloppgaver: bruke den overordnede `responsiblePerson`
- For DB-oppgaver: bruke `assigned_to`-feltet fra tasks-tabellen

#### 3. Visuell gruppering med bedre hierarki
- Oppgaver som krever handling: hvit bakgrunn med venstre fargekant (rød for høy prioritet, gul for middels)
- "Venter svar"-elementer: tydelig adskilt med en liten overskrift "Venter på svar" og dempet styling
- Kontrolloppgaver merket med et lite shield-ikon + "Kontroll"-label

### Teknisk plan

**Fil 1: `src/components/trust-controls/VendorTPRMStatus.tsx`**
- Importere `Checkbox` fra ui-komponenter
- Legge til `onTaskStatusChange`-callback i props for å oppdatere task-status
- Oppgaverader: erstatte fargedot med Checkbox, legge til `onClick`-handler
- Vise ansvarlig person som grå tekst under tittelen
- Legge til venstre border-farge basert på prioritet (`border-l-4 border-l-destructive` for høy)
- Separere "Venter svar"-seksjonen med en liten heading

**Fil 2: `src/components/asset-profile/tabs/VendorOverviewTab.tsx`**
- Legge til `onTaskStatusChange`-funksjon som oppdaterer task-status via Supabase
- Sende denne som ny prop til `VendorTPRMStatus`
- Invalidere query-cache etter statusendring

### Visuelt resultat

```text
┌─────────────────────────────────────────────────┐
│ ☐ Databehandleravtale verifisert     Høy        │
│   Last opp i dokumentfanen                      │
│   👤 Jan Olsen              Gå til dokumenter → │
├─────────────────────────────────────────────────┤
│ ☐ Sikkerhetskontakt definert         Høy        │
│   Legg til i leverandørprofilen                 │
│   👤 Ikke tildelt             Rediger profil →  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Venter på svar (3)                              │
│ ⚠ Hendelse rapportert          Venter svar      │
│   Jan Olsen — 3 måneder siden                   │
└─────────────────────────────────────────────────┘
```

### Filer som endres
1. `src/components/trust-controls/VendorTPRMStatus.tsx` — UI-redesign av oppgaverader
2. `src/components/asset-profile/tabs/VendorOverviewTab.tsx` — statusendring-logikk

