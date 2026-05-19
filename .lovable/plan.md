## Mål
Gjøre fanen **«Pågående oppdrag»** mer dialog-/wizard-basert, der **Lara gjør jobben** og partner bare bekrefter eller laster opp ett bevis. Mindre lister, mer "neste handling".

## Ny opplevelse

Erstatt dagens lange liste av leveranser → kontrollpunkter → checkboxer med en **Lara-veileder per oppdrag** som driver én aktivitet av gangen.

```
┌─────────────────────────────────────────────────────────┐
│ 🟣 Lara · Awareness-program 2025          [Levert 3/8]  │
│                                                          │
│ "Hei Truls! Neste steg er å bekrefte at e-læringen       │
│  er rullet ut til ledergruppen. Jeg har allerede:        │
│   ✓ Generert deltakerliste                               │
│   ✓ Sendt invitasjon via Outlook                         │
│   ✓ Utkast til gjennomføringsrapport ligger klar"        │
│                                                          │
│ Hva trenger du fra meg?                                  │
│ ┌──────────────────┐  ┌──────────────────┐              │
│ │ 📄 Se rapport-   │  │ ⬆ Last opp eget │              │
│ │   utkast fra Lara│  │   bevis          │              │
│ └──────────────────┘  └──────────────────┘              │
│                                                          │
│ [✓ Bekreft ferdig og berik Trust Profile]               │
│ [Hopp over · Spør kunden i stedet]                       │
└─────────────────────────────────────────────────────────┘
              ●─○─○─○─○─○─○─○   (steg 3 av 8)
```

### Strukturen

1. **Oppdragvelger på toppen** — kompakt segmented control eller dropdown: «Awareness 2025», «Pentest Q1», «NIS2 …». Viser totalprogresjon som tynn linje.
2. **Lara-kort i midten (eneste fokus)** — viser:
   - Aktivt steg (kontrollpunkt-id + aktivitetstittel + framework-pill).
   - **Lara-tråd** med bullet-liste over hva hun allerede har gjort (autonomous-handlinger).
   - **Anbefalt handling**: tekst som forklarer hva som trengs nå.
3. **To primære actions per steg**:
   - **«Se utkast fra Lara»** — åpner dialog med ferdig generert rapport/dokument som partner kan akseptere som bevis (genereres on-demand fra Lovable AI for demo).
   - **«Last opp eget bevis»** — åpner ConfirmActivityDialog (gjenbruker eksisterende komponent) — kun fil + ev. notat.
4. **Bekreft-knapp** — primær: «Bekreft ferdig og berik Trust Profile». Etter klikk: kort sukkess-animasjon → automatisk neste steg.
5. **Stepper** under kortet — visuell progress-prikker (●○○○) for alle aktiviteter i oppdraget. Klikkbare for å hoppe.
6. **Når alle steg er ferdige**: kortet bytter til en grønn «Oppdrag levert»-tilstand med oppsummering (X kontrollpunkter oppfylt · Y bevis lagt ved · TP-økning +12 pp) og «Send leveranserapport til kunde»-CTA.

### Lara gjør jobben — for hvert aktivitetstrinn

Lara-tråden viser 1–4 punkter avhengig av aktivitetstype:
- **Awareness**: «Generert deltakerliste», «Sendt påminnelser», «Samlet kvitteringer».
- **Pentest**: «Hentet rapport fra leverandørportal», «Mappet funn mot kontroller».
- **Policy**: «Skrevet utkast basert på ISO 27001 Annex A.5.10», «Tilpasset kundens domene og roller».
- **Risikovurdering**: «Identifisert 12 trusler», «Foreslått tiltak».

Hver linje har et lite ikon (Bot/Sparkles). Punktene er hardkodet per aktivitet i `DELIVERIES` (ny `laraSteps?: string[]` per `DeliveryActivity`) — ingen ekte AI-kall i denne iterasjonen, men strukturen er klar.

### «Se utkast fra Lara»-dialog

Enkelt mock-preview:
- Header: filtype-ikon + foreslått navn («Gjennomføringsrapport-awareness-Q1.pdf»).
- Body: kort innholdsblokk (overskrift, 3–5 punkter Lara har fylt ut, signaturlinje).
- Footer: «Avvis», «Rediger», **«Bruk som bevis»** (primær — markerer aktivitet ferdig + legger til som bevis-fil med kilde «Generert av Lara»).

### «Last opp eget bevis»

Gjenbruker `ConfirmActivityDialog` uforandret.

## Tekniske endringer (kun frontend)

**Filer:**
- `src/components/msp/MSPMaturityServiceMatrix.tsx` — bytt ut hele `<TabsContent value="deliveries">`-blokken med ny `<DeliveryWizard />`.
- `src/components/msp/DeliveryWizard.tsx` (ny) — Lara-kortet, stepper, oppdragvelger, sukkess-tilstand.
- `src/components/msp/LaraDraftDialog.tsx` (ny) — utkast-preview.

**Datamodell-utvidelse** (i `MSPMaturityServiceMatrix.tsx`):
```ts
interface DeliveryActivity {
  // ... eksisterende felt
  laraSteps?: string[];        // hva Lara har gjort autonomt
  laraDraft?: {                // utkast Lara har klar
    title: string;
    fileName: string;
    summary: string[];         // bullet-punkter for preview
  };
}
```
Seed `DELIVERIES` med disse feltene for demo-realisme.

**Wizard-state** holdes lokalt i `DeliveryWizard`: `activeDeliveryId`, `activeActivityIndex`. Reduksjon-handlere (`confirmActivity`, `undoActivity`) flyttes ned som props eller via callback — eksisterende state og handler i `MSPMaturityServiceMatrix` beholdes som sannhetskilde.

**Eksisterende fane-toggle**: «Pågående oppdrag»-fanen erstattes med wizard-visningen. Tittel og count-badge beholdes.

## Visuell stil
- Lara-kort: subtil primær-tint (`bg-primary/5` + `border-primary/20`), runde hjørner, romslig padding.
- Lara-avatar/ikon øverst venstre (Sparkles i sirkel) med liten "tenker"-puls når aktiv.
- Stepper: små prikker, primær for ferdig, ring for aktiv, muted for kommende.
- Knapper: én klar primær per steg. Sekundære som ghost.
- Suksess-tilstand: grønn ring + konfetti-pulse (CSS, ingen lib).

## Spørsmål
1. Skal **Lara-utkastet** (knappen «Se utkast fra Lara») være hardkodet mock-innhold per aktivitet i denne runden, eller vil du at jeg kobler det til Lovable AI for å generere innholdet on-demand? Mock går raskest; AI gir wow-effekt men koster credits per visning.
2. Skal det fortsatt være mulig å se **gammel listevisning** (kontrollpunkter + alle aktiviteter samlet) som en sekundær «Detaljer»-fane, eller fjerner vi den helt til fordel for wizard-en?
