

## Plan: Simulert arbeidsflyt for Lara-forslag

### Hva dette handler om

Når brukeren klikker et forslag (f.eks. "Identifiser høyrisiko-leverandører"), skal Lara gjennomføre en komplett arbeidsflyt:

1. **Analyse** — Lara undersøker data og presenterer funn
2. **Forslag til tiltak** — Lara foreslår konkrete handlinger med prioritet
3. **Plan-presentasjon** — Lara viser en strukturert plan med steg, tidsestimat og ansvarlig
4. **Godkjenning** — Brukeren får "Godkjenn plan" / "Endre" knapper
5. **Utførelse** — Ved godkjenning oppretter Lara oppgaver i systemet

### Teknisk tilnærming

**Oppdatere edge function (`supabase/functions/chat/index.ts`)**:
- Utvide system-prompten med instruksjoner for arbeidsflyt-mønsteret
- Lara skal ALLTID følge denne strukturen når et forslag-spørsmål mottas:
  - Steg 1: Hent og analyser relevant data, presenter funn med tall
  - Steg 2: Foreslå tiltak via `suggest_options` med valg som "Vis detaljer", "Lag handlingsplan", "Hopp over"
  - Steg 3: Presenter plan i strukturert format med checkboxes og tidslinjer
  - Steg 4: Bruk `suggest_options` med "✅ Godkjenn plan", "✏️ Endre", "❌ Avbryt"

**Ny tool: `create_action_plan`** i edge function:
- Genererer oppgaver i `tasks`-tabellen basert på godkjent plan
- Returnerer bekreftelse med lenke til oppgavesiden

**Oppdatere `ChatInterface.tsx`**:
- Ny meldings-type for "plan"-visning med visuell plan-layout (steg, tidslinje, prioritet)
- Spesiell rendering av plan-meldinger med:
  - Nummererte steg med status-ikoner
  - Prioritetsbadges (HIGH/MEDIUM/LOW)
  - Tidsestimat per steg
  - Trust Score impact per tiltak
  - "Godkjenn" / "Endre" knapper nederst

**Oppdatere `ContentViewer.tsx`**:
- Ny content_type `"action-plan"` som viser planen i full bredde i høyre panel

### Konkret flyt-eksempel

```text
Bruker klikker: "Identifiser høyrisiko-leverandører"

Lara (analyse):
"Jeg analyserer leverandørene i miljøet ditt..."
→ Henter fra assets-tabellen, filtrerer vendors

Lara (funn):
"Jeg fant 3 høyrisiko-leverandører:
 🔴 CloudProvider X — Mangler DPA, data i USA
 🔴 SaaS Tool Y — Ingen sikkerhetsrevisjon
 🟡 Analytics Z — Utdatert DPA
[Vis detaljer] [Lag handlingsplan]"

Bruker klikker: "Lag handlingsplan"

Lara (plan):
"Her er foreslått handlingsplan:"
→ Vises i content viewer med:
  1. Request DPA fra CloudProvider X (HIGH, 3 dager)
     → Trust Score +8%
  2. Sikkerhetsrevisjon av SaaS Tool Y (HIGH, 1 uke)
     → Trust Score +12%
  3. Forny DPA for Analytics Z (MEDIUM, 5 dager)
     → Trust Score +4%
[✅ Godkjenn plan] [✏️ Endre] [❌ Avbryt]

Bruker klikker: "✅ Godkjenn plan"

Lara (utført):
"✓ Plan godkjent! 3 oppgaver opprettet.
 Se dem under Oppgaver i menyen."
```

### Filer som endres/opprettes

- **Endres:** `supabase/functions/chat/index.ts` — Ny tool `create_action_plan`, utvidet system prompt med arbeidsflyt-instruksjoner
- **Endres:** `src/components/ChatInterface.tsx` — Ny plan-rendering med visuelt layout, godkjenn/endre-knapper, oppgave-opprettelse ved godkjenning
- **Endres:** `src/components/ContentViewer.tsx` — Ny `action-plan` content type
- **Endres:** `src/locales/en.json` og `src/locales/nb.json` — Nye tekster for plan-flyten

