

## Vis alle dokumenter i én liste, slett og åpne direkte i vinduet

### Hva endres

**1. Fjern tab-oppdeling — vis alt i én flat liste**
- Erstatt `Tabs`-komponenten med én samlet liste over alle `vendorDocs`
- Grupper visuelt med overskrifter (Retningslinjer, Sertifiseringer, Dokumenter) men alt er synlig samtidig
- Beholder eksisterende sortering (nyeste først innen hver gruppe)

**2. Åpne filer direkte i et dialog-vindu (ikke naviger bort)**
- Klikk på dokumentraden åpner en forhåndsvisnings-dialog
- Henter signed URL fra `vendor-documents` storage bucket via `supabase.storage.from("vendor-documents").createSignedUrl()`
- PDF: vises i `<iframe>` inne i dialogen
- Bilder (jpg/png): vises med `<img>`
- Andre filer: viser filinfo + nedlastingsknapp som fallback
- Dialogen har full bredde (`sm:max-w-4xl`) med lukke-knapp

**3. Slett-funksjonalitet (allerede implementert)**
- Eksisterende slett via DropdownMenu og AlertDialog er på plass — ingen endring nødvendig

### Fil som endres
1. `src/pages/TrustCenterEvidence.tsx` — fjern Tabs, legg til forhåndsvisnings-dialog med signed URL

