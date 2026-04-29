## Mål

Et godkjent dokument skal ikke stå evig. Det skal automatisk:
1. **Erstattes** når et nyere dokument av samme type godkjennes for samme leverandør
2. **Utløpe** når `valid_to` er passert

Begge skal være synlige – uten ny UI-kompleksitet. *Less is more.*

## Konsept (én livssyklus, tre tilstander)

`vendor_documents.status` brukes allerede. Vi standardiserer på fire verdier:
```text
current     → aktiv, teller mot trust score
superseded  → erstattet av nyere dokument (samme type, samme leverandør)
expired    → forbi valid_to
rejected    → avvist
```

Kun `current` beriker trust score. De andre vises bedempet i historikken.

## Endringer

### 1. Auto-erstatning ved godkjenning (én linje logikk)

I `LaraInboxTab.tsx` `approveMutation` – før vi setter inn det nye dokumentet:
```ts
// Marker tidligere current av samme type som superseded
await supabase.from("vendor_documents")
  .update({ status: "superseded" })
  .eq("asset_id", assetId)
  .eq("document_type", docType)
  .eq("status", "current");
```
Samme behandling i `UploadDocumentDialog.tsx` (manuell opplasting).

Resultatet: kun det nyeste dokumentet av hver type er `current`. Ingen UI-valg, ingen modal. Brukeren ser bare at "ISO 27001-sertifikatet" oppdateres.

### 2. Utløpshåndtering (avledet, ikke schedulert)

I stedet for cron eller batch-jobb – en `is_active`-helper som bruker app-logikk:
```ts
const isActive = doc.status === "current"
  && (!doc.valid_to || new Date(doc.valid_to) >= new Date());
```

Brukes overalt der `current` brukes i dag (trust score, oversikt, badges). Et utløpt dokument forblir teknisk `current` i basen men teller ikke. **Fordel:** ingen jobb som kan feile, alltid riktig.

Valgfri opprydning: en lett migrasjon som setter `status='expired'` hver gang noen åpner DocumentsTab (én batch-update på de få utgåtte). Holder dataen ren uten infrastruktur.

### 3. Synlig erstatningskjede (subtil)

I `DocumentsTab.tsx`:
- Standard filter: vis kun `current` + ikke-utløpt (allerede slik i dag for det meste)
- Liten "Vis historikk"-toggle øverst → viser også `superseded` og `expired` (gråtonet, samme rad-stil)
- Erstattet rad får liten label: *"Erstattet {dato} av {nytt filnavn}"*

Tracking gjøres ved å lagre `superseded_by` (uuid, nullable) på det gamle dokumentet når et nytt godkjennes.

### 4. Trust score reagerer

Der `vendorDocs` brukes til TPRM-beregning (allerede i `LaraInboxTab` og andre steder), legg til filter `status === 'current' && !isExpired`. Score faller automatisk når noe utløper – Lara kan da foreslå fornyelse.

### 5. Lett varsling

Eksisterende `document_expiry_notifications`-tabell finnes allerede. Vi trigger en notifikasjon når:
- Dokumentet utløper (oppdaget ved load)
- Dokumentet erstattes (info, ikke alarm)

Ingen ny tabell, ingen ny side – bare insert i eksisterende tabell.

## Database

Én migrasjon:
```sql
ALTER TABLE public.vendor_documents
  ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES public.vendor_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz;
```

Ingen nye tabeller. Ingen triggere. Ingen cron-jobber.

## Filer som endres

- **Migrasjon** – to kolonner på `vendor_documents`
- `src/components/asset-profile/tabs/LaraInboxTab.tsx` – marker forrige som superseded ved godkjenning
- `src/components/asset-profile/UploadDocumentDialog.tsx` – samme logikk for manuell opplasting
- `src/components/asset-profile/tabs/DocumentsTab.tsx` – "Vis historikk"-toggle, "Erstattet av"-label, auto-marker expired
- `src/lib/documentStatus.ts` (ny, ~20 linjer) – `isActiveDocument()` helper brukt på tvers

## Hva vi *ikke* gjør (less is more)

- Ingen ny "versjonshåndteringsside"
- Ingen modal som spør "vil du erstatte?" – nyeste vinner alltid, men det gamle er fortsatt søkbart
- Ingen bakgrunnsjobber
- Ingen ny status-enum – gjenbruker eksisterende `status`-felt
