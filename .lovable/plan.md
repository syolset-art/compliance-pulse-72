

## Plan: Redesign av Abonnementssiden med kundereise-fokus

### Konsept

Bygge om siden fra en flat modulliste til en **kundereise-orientert opplevelse** som speiler den naturlige brukerreisen: Trust Center (gratis) → Regelverk-tillegg → Moduler (System/Leverandør). Designet skal selge verdien av Trust Center som unikt produkt og tydelig vise hvordan moduler automatiserer og oppdaterer Trust Center via AI.

### Ny sidestruktur

```text
┌─────────────────────────────────────────────────────┐
│  "Din compliance-reise"  (hero/heading)             │
│  Subtekst om verdiforslaget                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  STEG 1: TRUST CENTER (Gratis)                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ ✅ Aktiv  •  Shareable Trust Profile          │  │
│  │ Inkludert: GDPR, ISO 27001, 5 systemer,       │  │
│  │ 5 leverandører, alle Trust Center-sider       │  │
│  │                                    [Gå til →] │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  STEG 2: UTVID MED REGELVERK                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ NIS2 │ │ DORA │ │Åpen. │ │AI Act│ │ CRA  │     │
│  │50k/år│ │50k/år│ │50k/år│ │50k/år│ │50k/år│     │
│  │[Legg]│ │[Legg]│ │[Legg]│ │[Legg]│ │[Legg]│     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│  Info: "Utvid compliance uten moduler"              │
│                                                     │
│  STEG 3: AUTOMATISER MED MODULER                    │
│  "Moduler kobler inn AI som automatisk oppdaterer   │
│   Trust Center, genererer oppgaver og arbeidsområder"│
│                                                     │
│  [Månedlig / Årlig toggle + Spar 2 mnd badge]      │
│                                                     │
│  ┌─── Systemmodul ───┐  ┌─ Leverandørmodul ──┐     │
│  │ Basis   │ Premium  │  │ Basis   │ Premium  │     │
│  │ 1490/m  │ 2490/m   │  │ 1490/m  │ 2490/m   │     │
│  │ ≤20 sys │ ≤70 sys  │  │ ≤20 lev │ ≤70 lev  │     │
│  │ +Arb.omr│ +Priorit │  │ +DPA    │ +Priorit │     │
│  └─────────┴──────────┘  └─────────┴──────────┘     │
│                                                     │
│  ┌── Enterprise (dashed) ──────────────────────┐    │
│  │ Ubegrenset  •  Kontakt salg                 │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  OPPSUMMERING / BETALINGSMETODE                     │
│  (kun synlig om noe er valgt/aktivt)                │
└─────────────────────────────────────────────────────┘
```

### Viktige designvalg

1. **Steg-basert layout med nummererte seksjoner** — visuell fremdriftsindikator (1-2-3) som guider kunden gjennom reisen
2. **Trust Center-kortet** har grønn kant og checkmark, fremhever at det allerede er aktivt og gratis — med lenke til Trust Profile
3. **Regelverk-seksjonen kommer FØR moduler** — viser at man kan utvide compliance uten å kjøpe moduler
4. **Modul-seksjonen** har en tydelig value proposition om AI-automatisering av Trust Center, arbeidsområder og oppgaver
5. **Billing toggle** flyttes ned til modul-seksjonen (irrelevant for gratis Trust Center og årlig-prisede regelverk)
6. **Oppsummering** viser totalkostnad bare når det er aktive betalte elementer

### Filer som endres

- `src/pages/Subscriptions.tsx` — fullstendig omskriving av UI-strukturen

