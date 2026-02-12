

# Klikkbar DPIA-detaljer med begrunnelse for utdatering

## Oversikt
Nar en DPIA (eller annet dokument) er markert som utlopt i dokumenttabellen, skal brukeren kunne klikke pa det for a se en detaljert forklaring: **hvorfor** dokumentet anses som utdatert, basert pa vanlig praksis og regulatoriske krav.

## Bakgrunn: Nar er en DPIA utdatert?

Ifolgene GDPR Art. 35(11) og veiledning fra europeiske tilsynsmyndigheter, ma en DPIA gjennomgas og oppdateres nar:

1. **Tid har gatt** - Vanlig praksis er revisjon hvert 1-3 ar (avhengig av risiko)
2. **Behandlingen har endret seg** - Nye formaal, nye datakategorier, nye mottakere
3. **Teknologien har endret seg** - Nye systemer, nye integrasjoner, nye AI-modeller
4. **Risikobildet har endret seg** - Nye trusler, sikkerhetsbrudd, regulatoriske endringer
5. **Organisatoriske endringer** - Ny leverandor, nye behandlingsansvarlige, nye underdatabehandlere

## Endringer

### 1. Ny komponent: DocumentDetailDialog
En dialog som apnes nar brukeren klikker pa et utlopt dokument i tabellen. Viser:

- Dokumentnavn, type og utlopsdato
- **Begrunnelse for utdatering** - automatisk generert basert pa dokumenttype og hvor lenge det har vart utlopt
- **Regulatorisk referanse** (f.eks. GDPR Art. 35(11) for DPIA)
- **Anbefalt handling** - konkret forslag til hva som bor gjores
- Knapp for a ga direkte til "Be om oppdatering"-dialogen

### 2. Oppdatere DocumentsTab
Gjore dokumentrader klikkbare nar de har status "Utlopt". Klikk apner DocumentDetailDialog.

### 3. Begrunnelseslogikk per dokumenttype
Definere standardbegrunnelser for hver dokumenttype:

| Dokumenttype | Begrunnelse | Referanse |
|---|---|---|
| DPIA | GDPR Art. 35(11) krever revisjon nar risikoen endres, og beste praksis er minst hvert 1-3 ar | GDPR Art. 35(11) |
| DPA | Databehandleravtaler bor revideres arlig for a sikre oppdatert underdatabehandlerliste og sikkerhetstiltak | GDPR Art. 28 |
| SOC 2 | SOC 2-rapporter dekker en definert periode og ma fornyes arlig for a bekrefte kontrollmiljoet | AICPA |
| ISO 27001 | Sertifikater er gyldige i 3 ar med arlige tilsyn. Utlopt sertifikat betyr usikker sikkerhetsstatus | ISO/IEC 27001 |
| Penetrasjonstest | Bor utfores minst arlig, og alltid etter vesentlige endringer i infrastruktur | Best practice / OWASP |
| NDA | Utlopte taushetserklaeringer gir ingen rettslig beskyttelse av konfidensiell informasjon | Kontraktsrett |

## Tekniske detaljer

**Ny fil: `src/components/asset-profile/DocumentDetailDialog.tsx`**

Komponenten tar inn et dokument-objekt og viser:
```typescript
interface DocumentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    file_name: string;
    document_type: string;
    valid_from: string | null;
    valid_to: string | null;
    version: string | null;
    notes: string | null;
  } | null;
  onRequestUpdate: (docType: string) => void;
}
```

Begrunnelsesdata lagres som en konstant mapping (`EXPIRY_REASONS`) med felter for `title`, `reason`, `reference`, `recommendation` og `reviewFrequency` per dokumenttype.

**Endring i DocumentsTab.tsx:**
- Legge til state for valgt dokument og dialog-synlighet
- Gjore dokumentnavnet klikkbart (spesielt for utlopte dokumenter) med visuell indikasjon (understrek/hover)
- Apne DocumentDetailDialog ved klikk

## Filer som endres
- **Ny**: `src/components/asset-profile/DocumentDetailDialog.tsx` - Dialog med begrunnelse og detaljer
- **Endret**: `src/components/asset-profile/tabs/DocumentsTab.tsx` - Klikkbare dokumentrader + integrere ny dialog

