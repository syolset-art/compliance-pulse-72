

## Snu flyten: Last opp først, la AI klassifisere automatisk

### Nåværende flyt
1. Velg kategori manuelt (policy / sertifisering / dokument)
2. Fyll inn detaljer manuelt
3. Last opp fil (valgfritt)
4. Velg synlighet → Lagre

### Ny agentisk flyt
1. **Last opp fil** — brukeren drar/klikker en fil (det eneste steget som kreves)
2. **AI analyserer** — spinner med "Lara analyserer dokumentet..." → kaller `classify-document`-edge-funksjonen som allerede finnes
3. **AI-forslag vises** — pre-fylt kort med kategori, type, navn, datoer, oppsummering. Brukeren kan redigere alt, men trenger ikke det
4. **Bekreft og lagre** — én knapp. Synlighet default til "published"

### Teknisk plan

**Fil: `src/components/trust-center/AddEvidenceDialog.tsx`** — full omskriving av steg-flyten:

- **Steg 1 (ny): Filopplasting**
  - Drop-zone med drag-and-drop + klikk
  - Aksepterer PDF, DOC, DOCX, JPG, PNG
  - Når fil velges → gå automatisk til steg 2

- **Steg 2 (ny): AI-analyse**
  - Leser filinnhold med `FileReader` (text for PDF, fileName for binære)
  - Kaller `classify-document` edge function via `supabase.functions.invoke`
  - Viser animert laster-tilstand med Sparkles-ikon og "Lara analyserer..."
  - Ved suksess: pre-fyller `category`, `subType`, `displayName`, `expiryDate`, `issuedDate`, `notes` (summary)
  - Ved feil: fallback til manuell utfylling med toast-varsel

- **Steg 3 (ny): Bekreft/rediger**
  - Viser AI-forslaget i et kompakt kort med redigerbare felter
  - Badge "AI-foreslått" ved hvert pre-fylt felt
  - Brukeren kan overstyre alt
  - Synlighet-velger inline (ikke eget steg)
  - "Lagre"-knapp nederst

- **Beholde manuell fallback**: Liten lenke "Legg til uten fil" som hopper til det gamle manuelle skjemaet (kategori → detaljer)

**Mapping fra AI-klassifisering til skjemafelter:**
```
classification.documentType → category + subType
classification.documentTypeLabel → displayName (som default)
classification.summary → notes
classification.validFrom → issuedDate
classification.validTo → expiryDate
classification.expiryStatus → status hint i UI
```

**Fil: `src/pages/TrustCenterEvidence.tsx`**
- Ingen endringer nødvendig, dialogen styrer alt selv

### Filer som endres
1. `src/components/trust-center/AddEvidenceDialog.tsx` — omskrevet til upload-first + AI-klassifisering

