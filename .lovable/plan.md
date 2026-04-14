

## Plan: Abonnementsstyrt synlighet av Mynder Core og Registre

### Analyse

Produkthierarkiet har tre nivåer av tilgang:

| Seksjon | Tilgjengelighet | Betingelse |
|---|---|---|
| Dashboard, Trust Center, Regelverk & krav, Meldinger | **Alltid synlig** | Gratis for alle |
| Mynder Core (Arbeidsområder, Oppgaver, Avvik, Rapporter) | **Betinget** | Krever Basis eller høyere |
| Registre (Leverandører, Systemer, Enheter) | **Betinget** | Krever Basis eller høyere (modulbasert) |

### Tilnærming

Seksjonene Mynder Core og Registre skal **alltid vises i sidebaren**, men med en visuell indikator og oppgraderingsknapp for brukere på gratisplanen. Å skjule dem helt ville gjort det vanskelig for brukere å oppdage funksjonaliteten.

### Endringer

**1. `src/components/Sidebar.tsx`**
- Importere `useSubscription` og hente `currentTier`
- For Mynder Core og Registre-seksjonene: dersom `currentTier === "free"`, vis seksjonen med redusert opacity og et lite `Lock`-ikon / «Oppgrader»-badge ved siden av tittelen
- Klikk på en låst seksjon navigerer til `/subscriptions` i stedet for å ekspandere undermenyene
- Undermenylenker rendres ikke når låst (for å unngå navigasjon til sider som ikke fungerer)

**2. `src/hooks/useSubscription.ts`**
- Legge til hjelpere: `hasModule(moduleId: "systems" | "vendors"): boolean` og `hasCoreAccess: boolean` som sjekker `currentTier !== "free"`
- Eksportere disse fra hooken

### Visuell struktur

```text
┌─────────────────────────────────┐
│  ● Dashboard                    │
│  🌍 Trust Center           ▾   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ⚖️ Regelverk & krav            │
│  ✉️ Meldinger                   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  📋 Mynder Core      🔒 Oppgr. │  ← Dimmed + lock badge
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  🗄️ Registre          🔒 Oppgr. │  ← Dimmed + lock badge
└─────────────────────────────────┘
```

Når brukeren har Basis/Premium vises seksjonene normalt med full funksjonalitet som i dag.

### Tekniske detaljer
- `useSubscription` kalles i `SidebarContent`-komponenten
- Låst tilstand: `opacity-50`, `Lock`-ikon (h-3 w-3), liten `Badge` med «Oppgrader»
- Klikk-handler bytter mellom `navigate("/subscriptions")` (låst) og `setOpen(!open)` (ulåst)
- Ingen nye tabeller eller migrasjoner nødvendig — bruker eksisterende `currentTier` fra abonnementet

