

## Plan: Forenkle kravlisten på Regelverk-siden

### Problem
På `/regulations` vises hver krav-rad slik:

```
[ikon]  A.5.1.1  Informasjonssikkerhetspolicy        AUTOMATISK  100% ⌄
        Organisasjonen skal definere og godkjenne...
```

Den lille mono-koden foran tittelen (`A.5.1.1`, `Art. 32`, osv.) er teknisk referanse som de fleste brukere ikke trenger å se. Den konkurrerer visuelt med selve kravnavnet, og teksten er for liten (`text-xs` = 12px) til å være lesbar iht. WCAG/designmanualen.

### Endringer (kun `FrameworkRequirementsList.tsx`)

**1. Skjul referanse-koden i sammenslått tilstand**
- Fjern `{req.requirement_id}` chip-en fra rad-headeren
- Vis koden kun når raden er ekspandert, som en liten "Referanse: A.5.1.1"-linje nederst sammen med øvrig metadata

**2. Klar visuelt hierarki — "Krav → Beskrivelse → Handling"**
- Tittel: `text-base font-semibold` (i dag `text-sm`) — kravets navn er det viktigste
- Beskrivelse: `text-sm text-muted-foreground` (i dag `text-xs line-clamp-2`) — øk til `text-sm` og la den være full lengde når ekspandert, fortsatt clamp-2 i collapsed
- Status-tekst inni ekspandert: `text-base font-medium`

**3. AUTOMATISK/MANUELL-merket roes ned**
- Bytt fra ren tekst i farge til en liten outline-Badge med ikon (mer Apple-minimal, mindre "skriking")
- Behold tooltip uendret

**4. Ekspandert visning får en tydelig "Hva må gjøres?"-seksjon**
- Når status ≠ "met": legg til en kort, tydelig instruksjonsboks over "Dokumenter manuelt"-knappen som forklarer hva brukeren skal gjøre, basert på `agent_capability`:
  - `full` (AUTOMATISK): "Plattformen henter dette automatisk — ingen handling kreves."
  - `assisted` (ASSISTERT): "Lara forbereder et utkast. Gjennomgå og godkjenn."
  - `manual` (MANUELL): "Last opp et dokument eller skriv en kort beskrivelse av hvordan kravet er oppfylt."
- Behold "Dokumenter manuelt"-knappen, men gi den tydeligere label: "Dokumenter dette kravet"

**5. Overskrift-rad ovenfor listen**
- Behold "Krav og evaluatorer", men forstørr counter-tekst fra `text-xs` til `text-sm` for bedre lesbarhet
- Behold AUTOMATISK/MANUELL badges

**6. UU/WCAG**
- Sørg for `text-sm` (14px) som minimum for all lesbar tekst
- Status-prosent: behold men gjør den til `text-sm font-semibold` (mer lesbar)
- Behold `aria-expanded` semantikk via knappen (allerede `<button>`)

### Resultat — før/etter

```text
FØR (collapsed):
[✓] A.5.1.1  Informasjonssikkerhetspolicy           AUTOMATISK  100% ⌄
    Organisasjonen skal definere og godkjenne...

ETTER (collapsed):
[✓] Informasjonssikkerhetspolicy                    [🤖 Auto]  100% ⌄
    Organisasjonen skal definere og godkjenne en informasjonssikkerhetspolicy.

ETTER (expanded):
[✓] Informasjonssikkerhetspolicy                    [🤖 Auto]  100% ⌃
    Organisasjonen skal definere og godkjenne en informasjonssikkerhetspolicy
    som kommuniseres til alle ansatte og relevante interessenter.
    ─────────────────────────────────────────────────────────────
    Status: Oppfylt
    
    💡 Hva må gjøres?
       Plattformen henter dette automatisk — ingen handling kreves.
    
    [ Dokumenter dette kravet ]
    
    Referanse: A.5.1.1 · ISO 27001 Annex A
```

Ingen andre filer påvirkes. Ingen endringer i datamodell eller logikk — kun presentasjonslag.

