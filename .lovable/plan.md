

## Plan: "Veiledning fra Mynder"-fane med AI-foreslåtte aktiviteter

### Konsept
En ny fane (eller fornyet eksisterende) som viser AI-genererte handlingsforslag basert på det Mynder vet om leverandøren. Brukeren bekrefter med ett klikk i stedet for å fylle ut alt manuelt. Aktiviteter som lukker en kjent gap markeres tydelig.

### Endringer

**1. Ny datamodell — `src/utils/vendorGuidanceData.ts` (ny fil)**
```ts
type GuidanceLevel = "strategisk" | "taktisk" | "operasjonelt";
type Criticality = "kritisk" | "hoy" | "medium";

interface SuggestedActivity {
  id: string;
  titleNb/En, descriptionNb/En;       // f.eks. "Følg opp databehandleravtale"
  reasonNb/En;                         // "DPA ikke mottatt · påkrevd etter GDPR art. 28"
  criticality: Criticality;
  level: GuidanceLevel;
  themeNb/En;                          // "DPA & personvern"
  suggestedType: ActivityType;         // email | phone | meeting | manual
  suggestedPhase: Phase;
  gapId: string;                       // referanse til hva den lukker
}

generateGuidanceForVendor(vendorId) → { summaryNb, summaryEn, suggestions[] }
```

Demo-data: 3 forslag per leverandør (DPA, SLA, risikovurdering) som matcher bildet.

**2. Ny komponent — `src/components/asset-profile/MynderGuidanceTab.tsx`**

Layout (matcher screenshot):
- **Lilla synthesis-boks øverst:** "MYNDER SYNTETISERER" badge + statussammendrag. Tekst som "Leverandøren er under aktiv oppfølging. Siste strategiske aktivitet var et revisjonsmøte 15.03.2026. Det er 3 åpne punkter…"
- **"FORESLÅTTE AKTIVITETER (n)"-overskrift**
- **Forslagskort** (vertikal liste):
  - Tittel + kritikalitets-badge høyre (KRITISK rød / HØY oransje / MEDIUM gul)
  - Begrunnelse i lilla/primary tekst
  - 3 chips nederst: nivå (Taktisk/Strategisk/Operasjonelt) · tema · forslag-type ("E-post foreslått")
  - Hele kortet er klikkbart → åpner forhåndsutfylt RegisterActivityDialog
- **CTA nederst:** "+ Start tom aktivitet" (åpner samme modal uten prefill)

**3. Endringer i `RegisterActivityDialog.tsx`**
- Nytt prop: `prefillFromGuidance?: SuggestedActivity`
- Når satt: forhåndsfyll alle felter (type, fase, tittel, beskrivelse, tema)
- Vis lilla banner øverst i modalen: "🔮 Forhåndsutfylt av Mynder basert på [grunn]" + lenke "Tøm felt"
- Lagre setter `linkedGapId` på aktiviteten

**4. Endringer i `vendorActivityData.ts`**
- Legg til felt på `VendorActivity`: `linkedGapId?: string`, `criticality?: Criticality`
- Toast ved lagring av guided aktivitet: "Aktivitet lagret og koblet til gap" (grønn)
- Vanlig toast ellers: "Aktivitet lagret"

**5. Endringer i `VendorActivityTab.tsx` (Aktivitetslogg)**
- Aktiviteter med `linkedGapId` får grønn venstre-border + "Lukker gap"-badge
- Sortering: nyeste først (allerede slik)

**6. State-flyt**
- Bruk lokal state i `AssetTrustProfile` (eller liten zustand store) for `dismissedSuggestionIds`
- Når en aktivitet lagres med `linkedGapId`, legg gap-id i dismissed → forslaget forsvinner fra listen
- Synthesis-tekst regnes ut fra `suggestions.length` (3 → 2 åpne punkter)

**7. Faneintegrasjon i `AssetTrustProfile.tsx`**
- Bytt navnet på eksisterende guidance-fane til "Veiledning fra Mynder" (allerede sånn iflg. bildet)
- Sørg for at "Aktivitetslogg"-fanen viser korrekt count som inkluderer nye aktiviteter

### Visuelle detaljer (Apple-minimal, deep purple #5A3184)
- Synthesis-boks: `bg-primary/8 border border-primary/20 rounded-xl p-5`
- "MYNDER SYNTETISERER"-badge: solid primary, hvit tekst, uppercase tracking-wide
- Forslagskort: hvit bg, `border border-border` → hover `border-primary/40`
- Kritikalitet-badges: `bg-destructive/15 text-destructive` (kritisk), `bg-amber-500/15 text-amber-700` (høy), `bg-yellow-500/15 text-yellow-700` (medium)
- Chips: `bg-muted text-muted-foreground text-xs rounded-md px-2 py-0.5`
- Banner i modal: `bg-primary/10 border-l-4 border-primary p-3 rounded-r-md`

### Lokalisering
Alle strenger med NB/EN-varianter via `isNb`-mønsteret som ellers i koden.

### Ut av scope
- Ekte AI-generering (kun seedet demo-data)
- Backend-persistering av dismissed forslag (kun in-memory)
- Endringer på andre faner enn Veiledning og Aktivitetslogg

