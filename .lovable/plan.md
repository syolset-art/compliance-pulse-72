
# Redesign: AI-analyse klar - Steve Jobs-inspirert

## Mål
Transformere "AI-analyse klar" komponenten fra et sentrert, standard kort-design til en elegant, minimalistisk presentasjon inspirert av Apple's designfilosofi: **"Simplicity is the ultimate sophistication."**

## Design-prinsipper (Steve Jobs-stil)
- **Asymmetrisk layout** - venstre-justert innhold med generøs whitespace
- **Hierarki gjennom størrelse** - stor, modig risiko-indikator som fokuspunkt
- **Subtile animasjoner** - silk-smooth transitions, ingen overdreven bevegelse
- **Premium materialfølelse** - glassmorphism og myke skygger
- **Minimalistisk typografi** - færre ord, større impact

## Visuell transformasjon

### Før (nåværende)
```text
┌─────────────────────────────────────┐
│ ● AI-analyse klar    Høy sikkerhet  │
├─────────────────────────────────────┤
│                                     │
│        ┌──────────────────┐         │
│        │ ✓ Minimal risiko │         │  <- Sentrert
│        └──────────────────┘         │
│          Beskrivelse her            │
│                                     │
│   [ Bekreft og lagre ]  [ Juster ]  │
│                                     │
└─────────────────────────────────────┘
```

### Etter (Steve Jobs-stil)
```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ● Analyse klar                                    │
│                                                     │
│   ╔═══════════════════╗                             │
│   ║  ✓                ║                             │
│   ║  Minimal          ║                             │
│   ║  risiko           ║   ← Stor badge, venstre    │
│   ╚═══════════════════╝                             │
│                                                     │
│   Beskrivelse av AI-bruk i prosessen               │
│   med generøs linjehøyde og whitespace             │
│                                                     │
│   [ Bekreft og lagre ]       [ Juster ]            │
│                                                     │
│   ─────────────────────────────────────            │
│   Vis detaljer                              ▼      │
└─────────────────────────────────────────────────────┘
```

## Implementeringsdetaljer

### 1. Ny layout-struktur
**Fil:** `src/components/process/AIHeroSummary.tsx`

- Fjern sentrering (`items-center text-center`)
- Bruk asymmetrisk grid: `grid grid-cols-1 lg:grid-cols-[auto_1fr]`
- Risiko-badge som stort, frittstående element på venstre side
- Tekst og handlinger flyter til høyre med generøs spacing

### 2. Forbedret risiko-indikator
- **Større ikon** (h-10 w-10 i stedet for h-7 w-7)
- **Vertikal layout** for badge: ikon over tekst
- **Subtil glow-effekt** med `animate-glow-pulse` for minimal/limited risk
- **Glassmorphism-bakgrunn** ved bruk av `glass-card` utility

### 3. Premium header
- Fjern header-bakgrunn for cleaner look
- Minimalistisk status-indikator (bare den pulserende prikken + "Klar")
- Konfidensgrad flyttes til en mer diskret posisjon

### 4. Forbedrede call-to-action knapper
- Primærknapp med gradient (`bg-gradient-mynder`)
- Hover-effekt med `hover-lift` og `shadow-elevated`
- Asymmetrisk plassering: primærknapp større enn sekundær

### 5. Animasjoner
- `animate-float-in` på hele kortet ved første visning
- `transition-silk` på alle interaktive elementer
- Subtil `scale-in` på risiko-badge

## Teknisk plan

### Endring 1: Oppdater RISK_CONFIG styling
Legge til nye styling-properties for larger presentation:
```typescript
const RISK_CONFIG = {
  minimal: {
    // ... existing
    glowClass: "animate-glow-pulse",
    gradientBg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
  },
  // ... andre nivåer
}
```

### Endring 2: Refaktorere hovedlayout
Erstatte sentrert layout med asymmetrisk:
```tsx
<div className="p-8">
  {/* Status pill - minimalistisk */}
  <div className="flex items-center gap-2 mb-6">
    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
    <span className="text-sm font-medium text-muted-foreground">Klar</span>
  </div>

  {/* Risiko-indikator - venstre-justert, stor */}
  <div className={cn(
    "inline-flex flex-col items-center gap-2 p-6 rounded-2xl",
    "glass-card shadow-luxury mb-6",
    riskConfig.glowClass
  )}>
    <span className={cn("text-4xl", riskConfig.color)}>
      {riskConfig.icon}  // Større ikon
    </span>
    <span className={cn("text-xl font-bold tracking-tight", riskConfig.color)}>
      {riskConfig.label}
    </span>
  </div>

  {/* Beskrivelse */}
  {purpose && (
    <p className="text-muted-foreground text-base leading-relaxed max-w-lg mb-8">
      {purpose}
    </p>
  )}

  {/* Handlinger - asymmetrisk */}
  <div className="flex flex-wrap gap-4">
    <Button className="h-12 px-8 bg-gradient-mynder hover-lift">
      <Check className="h-5 w-5 mr-2" />
      Bekreft
    </Button>
    <Button variant="outline" className="h-12 px-6 hover-lift">
      <Settings2 className="h-4 w-4 mr-2" />
      Juster
    </Button>
  </div>
</div>
```

### Endring 3: Forbedre "Vis detaljer" toggle
- Flytt til bunnen med tydeligere visuell separator
- Bruk subtil hover-effekt

## Resultat
En premium, Apple-inspirert presentasjon som:
- Føles mer profesjonell og selvsikker
- Har tydelig visuelt hierarki
- Bruker whitespace strategisk
- Matcher den eksisterende luxury branding i prosjektet
