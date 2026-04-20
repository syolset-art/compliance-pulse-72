

## Plan: Nytt menypunkt "AI Autonomi" i Innstillinger

Brukeren skal kunne styre hva Mynders AI-agenter får lov til å gjøre, per oppgavetype, med tydelige forklaringer av konsekvenser. Designet bygger på Mynders eksisterende 3-nivå autonomiskala (Automatisk / Assistert / Manuell — SAE-inspirert), og forankres mot **ISO/IEC 42001 (AIMS)** sine prinsipper for human oversight og **NIST AI RMF (Govern/Manage)** for risikobasert styring.

### Hva som bygges

**1. Nytt menypunkt i `PersonalSettings.tsx`**
- Legg til seksjon `{ id: "ai-autonomy", labelNb: "AI Autonomi", labelEn: "AI Autonomy", icon: Sparkles }` i `sections`-arrayet
- Plasseres rett etter "Agenter"

**2. Ny komponent `src/components/settings/AIAutonomySection.tsx`**

Layout (top → bottom):

**A. Intro-banner (lilla, primary/5)**
- Tittel: "Styr hva Mynders KI får gjøre"
- Kort tekst: forklarer at brukeren har full kontroll, at standardvalg følger ISO/IEC 42001 anbefaling om "meaningful human oversight", og at høyere autonomi gir hastighet men reduserer kontrollpunkter.
- Liten chip-rad: "Basert på ISO/IEC 42001" · "NIST AI RMF" · "EU AI Act art. 14"

**B. Globalt autonominivå (Master switch)**
- Stort kort med 3 valgkort side-om-side (radio-style):
  - 🟢 **Manuell** — "KI foreslår, du utfører alt"
  - 🟡 **Assistert** *(anbefalt — default)* — "KI lager utkast, du godkjenner før handling"
  - 🟣 **Automatisk** — "KI utfører selv innenfor definerte grenser"
- Hvert kort viser: ikon, navn, kort beskrivelse, "Konsekvens"-linje med 2 punkter (hva du sparer / hva du gir fra deg)
- Valgt kort får primary border + bg-primary/5

**C. Konsekvens-panel (dynamisk)**
Endrer seg basert på valgt globalt nivå. Viser et tydelig "Hva betyr dette?"-panel:
- ✓ grønne fordeler (hastighet, dekning)
- ⚠ gule risikoer (mindre kontroll, behov for stikkprøver)
- 🛡 kontrollpunkter som fortsatt finnes (audit log, rollback, override)

**D. Per-oppgave overstyring (Granulær matrise)**
Tabell-lignende kortliste der hver KI-oppgave kan ha sitt eget nivå (overstyrer global). Kategorier basert på Mynders moduler:

| Oppgavekategori | Eksempler | Standard | Anbefalt maks |
|---|---|---|---|
| **Dokumentanalyse** | Klassifisering, utløpsdato-uthenting | Automatisk | Automatisk |
| **Funn & gap-deteksjon** | Identifisere mangler i DPA, SLA | Assistert | Assistert |
| **Risikoscoring** | Beregne leverandørrisiko | Assistert | Automatisk |
| **Aktivitetsforslag** | Forslag i "Veiledning fra Mynder" | Assistert | Assistert |
| **Kommunikasjon utad** | Sende e-post til leverandør | Manuell | Assistert |
| **Endring av kontrollstatus** | Markere kontroll som lukket | Manuell | Assistert |
| **Publisering** | Publisere Trust Profile | Manuell | Manuell |

Hvert rad-kort har:
- Ikon + navn + 1-linjes beskrivelse
- Segmentert kontroll (Manuell/Assistert/Automatisk)
- Hvis bruker velger over "anbefalt maks" → vis ⚠ inline-advarsel: "Høyere enn anbefalt for denne oppgaven. Mynder vil logge alle handlinger for revisjon."

**E. Sikkerhetsnett (alltid på, read-only info)**
Kort med 4 punkter — viser kontrollene som *alltid* gjelder uansett autonominivå:
- 📋 Full revisjonslogg av alle KI-handlinger
- ↩ Angre-funksjon (24t)
- 🚫 Kill-switch (pause all KI umiddelbart)
- 👥 Eskalering til menneske ved usikkerhet > terskel

**F. Forankrings-footer**
Lite info-kort: "Designet etter ISO/IEC 42001 §6.1 (AI risk treatment) og §8.3 (human oversight). EU AI Act art. 14 krever meningsfull menneskelig overvåking for høyrisiko-systemer."

### Persistering
- Lagres i `localStorage` under `mynder-ai-autonomy-config` (demo)
- Struktur: `{ globalLevel: "assisted", overrides: { documentAnalysis: "automatic", ... }, killSwitch: false }`
- Toast ved hver endring: "Autonominivå oppdatert"

### Designtokens (Mynder-manualen)
- Primary: deep purple `#5A3184` for valgt nivå "Automatisk" og banners
- Success/grønn: `bg-success/10 text-success` for "Manuell" og fordeler
- Warning/gul-oransje: `bg-warning/10 text-warning` for "Assistert" og advarsler
- Cards: `border border-border rounded-xl p-5`, hover `border-primary/40`
- Konsekvens-panel: `bg-muted/30 border-l-4 border-primary`
- Apple-minimal — masse whitespace, ingen tunge skygger

### Filer som endres
- `src/pages/PersonalSettings.tsx` — legg til seksjon + render
- `src/components/settings/AIAutonomySection.tsx` *(ny)*

### Ut av scope
- Faktisk håndheving i AI-agentene (kun UI + lagret config)
- Backend-tabell for config (kommer når flyt er godkjent)
- Audit log-visning (egen side senere)

