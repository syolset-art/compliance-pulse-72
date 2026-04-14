

## Plan: Moderniser sidebar-menydesign

### Problem
Seksjonskategoriene (Styringsverktøy, Registre) vises som puslete uppercase-tekst uten visuell identitet. Menyen mangler hierarki og moderne preg.

### Design-retning
Inspirert av moderne SaaS-sidebarer (Linear, Notion, Vercel): tydelig visuelt hierarki med ikoner på seksjonsnivå, subtile fargeaksenter, og bedre spacing.

### Endringer i `src/components/Sidebar.tsx`

**1. Seksjonsoverskrifter med ikon og stil**
- Gi hver seksjon et eget ikon (f.eks. `Briefcase` for Styringsverktøy, `Database` for Registre)
- Erstatt den nakne `text-[11px] uppercase`-teksten med en linje som har ikon + normal-cased tittel
- Legg til en subtil venstrelinje (`border-l-2 border-primary/30`) på aktive seksjoner

**2. Aktiv-state med fargeprikk**
- Aktive menylenker får en liten farget prikk (4px sirkel i `primary`) til venstre i stedet for bare bakgrunnsfarge
- Beholder hover-effekten, men gjør den mer subtil med `bg-sidebar-accent/30`

**3. Bedre visuell separasjon**
- Legg til tynne `border-b border-sidebar-border/50`-separatorer mellom seksjonene i stedet for bare `pt-3`
- Dashboard-lenken får en litt større padding og en subtil gradient-bakgrunn når aktiv

**4. Seksjonskollaps med animasjon**
- Wrap child-items i en `div` med `transition-all duration-200` og `max-height`-animasjon for mykere åpning/lukking

**5. Trust Center visuell oppgradering**
- Legg til en subtil gradient-kant (`bg-gradient-to-r from-primary/10 to-transparent`) bak Trust Center-knappen for å skille den som premium-seksjon

### Visuell struktur
```text
┌─────────────────────────────────┐
│  [Logo]            [🌐] [🌙]   │
├─────────────────────────────────┤
│  ● Dashboard                    │
│                                 │
│  🌍 Trust Center           ▾   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                 │
│  📋 Styringsverktøy         ▾   │
│     ● Krav                      │
│       Arbeidsområder            │
│       Oppgaver                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                 │
│  🗄️ Registre                ▾   │
│       Leverandører              │
│       Systemer                  │
│       Enheter                   │
└─────────────────────────────────┘
```

### Tekniske detaljer
- Kun endringer i `Sidebar.tsx` og eventuelt `index.css` for en kort animasjonsklasse
- Nye ikoner: `Briefcase` (eller `Wrench`) for Styringsverktøy, `Database` for Registre fra lucide-react
- Fjerner `text-[11px] uppercase tracking-wider` til fordel for `text-xs font-semibold` med ikon
- Legger til `transition-all duration-200 overflow-hidden` for collapse-animasjon

