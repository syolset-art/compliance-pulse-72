## Mål

Tilbud generert fra Tjenesteområde skal automatisk ha med partnerens **navn, logo og organisasjonsnummer** — hentet fra det vi vet om dem, men redigerbart i en innstilling på Tjenesteområde.

## Brukerflyt

1. På `/msp-services` (Tjenesteområde) vises et nytt kort **"Tilbudsmerking"** øverst.
2. Feltene **Partnernavn**, **Organisasjonsnummer** og **Logo** er forhåndsutfylt fra `company_profile` (det vi allerede vet om partneren). De er markert som "Hentet automatisk".
3. Brukeren kan overstyre hvert felt og laste opp en logo. Lagres lokalt (samme mønster som dagens partner-innstillinger) — overstyringer vinner over auto-data.
4. Når en bruker genererer et tilbud (Lara fra modenhetsmatrise eller spørreundersøkelse), vises **logo + navn + orgnr** øverst i både forhåndsvisningen og den nedlastede PDF-en — uten ekstra steg.

## Endringer

### Ny hook: `src/hooks/usePartnerBranding.ts`
- Leser `company_profile` (name, org-felt) for å gi default `partnerName` + `orgNumber`.
- Slår sammen med lokal overstyring fra `localStorage` (`msp-partner-branding-v1`): `{ name?, orgNumber?, logoDataUrl? }`.
- Returnerer ferdig sammensatt `{ name, orgNumber, logoDataUrl, isAutoName, isAutoOrg }`.

### Ny UI-komponent: `src/components/msp/PartnerBrandingCard.tsx`
- Card med tre felter + logo-opploader (file → base64 dataURL, maks ~300 KB), "Tilbakestill til automatisk"-knapp per felt, og "Lagre"-knapp.
- "Slik ser det ut i tilbudet"-mini-preview til høyre (logo + navn + orgnr i samme layout som PDF-headeren).

### Oppdatering: `src/pages/MSPServiceCatalog.tsx`
- Rendrer `PartnerBrandingCard` over `MSPServiceCatalogTab`, i en kollapsbar/diskré seksjon slik at det ikke stjeler fokus fra tjenestebiblioteket.

### Oppdatering: `src/components/msp/MSPCreateOfferDialog.tsx`
- Nye valgfrie props: `partnerOrgNumber?: string`, `partnerLogoDataUrl?: string`.
- Hvis ikke sendt inn → bruk `usePartnerBranding()` internt som fallback (så alle eksisterende call sites virker uten endring).
- **Forhåndsvisning**: header-rad får logo (h-8, venstrejustert) + `partnerName` + `Org.nr {orgNumber}` under navnet. Footer-linje får `· Org.nr {orgNumber}`.
- **PDF (jsPDF)**: hvis `logoDataUrl` finnes, `doc.addImage(...)` i headeren (skaler til 36 pt høyde); orgnr printes på linjen under partnernavnet og i footeren.

### Call sites
- `MSPMaturityServiceMatrix.tsx` og `QuestionnaireDispatchCard.tsx` trenger ingen endring — dialogen henter brandingen selv via hooken når props ikke sendes inn.

## Teknisk

- Ingen DB-migrasjon — vi gjenbruker `company_profile` for auto-data og `localStorage` for overstyringer (konsistent med `MSPPartnerSettings`).
- Logo lagres som base64 dataURL i localStorage for å unngå storage-bucket-oppsett i denne iterasjonen; klart skalerbart til Supabase Storage senere ved å bytte ut én funksjon i hooken.
- jsPDF støtter `addImage` for PNG/JPEG dataURL direkte — ingen ekstra pakker.

## Ikke i scope nå

- Flere logoer per kunde, EHF-/fakturaoppsett, opplasting til Supabase Storage. Disse kan komme i neste runde uten å bryte denne strukturen.