

## Egen underside for "Slik beregner vi modenhet"

### Hva skal gjores

Opprette en dedikert underside `/resources/maturity` som forklarer modenhetsmodellen med en pedagogisk og lettfattelig innledning. Kortet "Slik beregner vi modenhet" pa Ressurssenteret endres fra a apne en kollapsbar seksjon til a navigere til denne nye undersiden.

### Innhold pa undersiden

Siden folger samme layout som FeatureGuide-sidene (maks bredde, tilbake-knapp, Sidebar).

**Seksjon 1 -- Innledning (klartsprak)**
- Overskrift: "Slik beregner vi modenhet"
- En varm, pedagogisk innledning som forklarer:
  - Hva compliance-modenhet betyr i praksis (ikke bare et tall, men et bilde pa hvor godt rustet virksomheten er)
  - At Mynder bruker PDCA-rammeverket (Plan-Do-Check-Act) som grunnlag
  - Hva PDCA er: en internasjonalt anerkjent metode for kontinuerlig forbedring, brukt i ISO-standarder
  - At prosessen ikke er lineaer -- man jobber syklisk og forbedrer seg over tid

**Seksjon 2 -- PDCA-rammeverket forklart**
- Visuell fremstilling av PDCA-syklusen med fire kort (Plan, Do, Check, Act) med enkel forklaring av hver
- Kobling til Mynders fem faser: hvordan Fundament og Implementering tilsvarer "Plan", Drift tilsvarer "Do", Intern Audit tilsvarer "Check", og Sertifisering/forbedring tilsvarer "Act"

**Seksjon 3 -- De fem fasene (gjenbruk av eksisterende stepper og fasedetaljer)**
- PhaseStepper-komponenten med fasenavn og status
- PhaseDetail for valgt fase med aktiviteter, forklaringer og Mynder-funksjonslenker
- Samme interaktive opplevelse som i dag, men pa egen side

**Seksjon 4 -- Modenhetsniva**
- Visuell fremstilling av de fem modenhetsnivaaene (Initial, Definert, Implementert, Maalt, Optimalisert) med prosentintervall
- Markering av brukerens navaerende niva

### Tekniske endringer

| Fil | Endring |
|-----|---------|
| `src/pages/MaturityMethodology.tsx` | Ny side med pedagogisk innhold, PDCA-forklaring, PhaseStepper og PhaseDetail |
| `src/App.tsx` | Ny route: `/resources/maturity` |
| `src/pages/Resources.tsx` | Endre "Slik beregner vi modenhet"-kortet fra collapsible-toggle til `navigate("/resources/maturity")`. Fjerne collapsible-seksjonen og tilhorende state (`maturityOpen`, `selectedPhase`, `learningOpen`, `defaultPhase`) samt sub-komponentene `PhaseStepper` og `PhaseDetail` |

### Design

- Folger eksisterende FeatureGuide-monster: Sidebar + maks-bredde innholdsomrade + tilbake-knapp
- All tekst pa norsk og engelsk (med `lang`-bryter som resten av appen)
- PDCA-syklusen vises som fire kort i et 2x2-grid med ikon og korttekst
- Modenhetsnivaaene vises som en horisontal progressjonslinje med markorer

