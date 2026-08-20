# Dokumentasjon-fanen på leverandør: fra arkiv til proveniens

## Er fanen verdifull?
Ja — men i dag er den et filarkiv. Den svarer på "hvilke filer ligger her", ikke på "hva vet vi om denne leverandøren, og hvor kommer kunnskapen fra". Vi beholder fanen, men bygger den om rundt kilde (proveniens) og dekning, i tråd med hvordan Dokumentasjon allerede fungerer på regelverk og i Trust Center.

## Slik ser det ut i dag
- `VendorDocumentsTab` er to seksjoner: "Interne dokumenter" (`DocumentsTab`) og "Eksterne dokumenter" (Lara-innboks).
- `DocumentsTab` viser en tabell med Dokument / Type / Gyldig til / Status / Tilgang, og deler internt på `source` (`manual_upload` vs `vendor_portal` / `email_inbox`), men kilden vises aldri for brukeren.
- Forespørsler om dokumentasjon ligger i en egen seksjon uten kobling til dokumentene de gjelder.
- Ingenting i fanen kjenner til Sara (lokal agent) eller leverandørens Trust Profile.

## Hva vi bygger

### 1. Fire kilder, ett felles språk
Hver dokumentrad får et lite kildeikon med tooltip — ingen pills, samme stramme stil som regelverkslisten:
- Dokumentikon = manuelt opplastet av deg
- Sara-ikon (rund S) = hentet av lokal agent i egen infrastruktur
- Konvolutt/portal-ikon = sendt inn av leverandøren, som svar på en forespørsel
- Trust Engine-merke = hentet automatisk fra leverandørens Trust Profile

Kildeutledning legges i en ny `src/lib/vendorDocumentSource.ts` som mapper `vendor_documents.source` til visning, slik at logikken kan gjenbrukes.

### 2. Dekningsheader øverst
En kompakt linje som svarer "hva har vi kontroll på": antall dokumenter, hvor mange som er gyldige, hvor mange som utløper, og fordeling per kilde. Ingen store bokser.

### 3. Ett samlet filter i stedet for to seksjoner
Fanen får én liste med filterrad: Alle / Lastet opp / Fra agent / Fra leverandør / Fra Trust Engine. Lara-innboksen (eksterne funn til godkjenning) blir en tynn varsellinje øverst ("3 dokumenter venter på godkjenning") som åpner dagens godkjenningsflyt, ikke en egen stor seksjon.

### 4. Etterspurt dokumentasjon kobles til
Forespørsler vises som gråtonede "venter"-rader i samme liste, med hvem det er sendt til og når — slik at hull og etterspørsler står side om side. Når leverandøren svarer, blir raden et ekte dokument med leverandørkilde.

### 5. Sara-tilbud når agenten ikke er installert
Hvis Sara ikke er aktiv: en diskret linje om at agenten kan hente leverandørdokumentasjon automatisk fra egne kilder (gjenbruker eksisterende `SaraEvidencePromo`/onboarding). Er Sara aktiv: statuslinje med sist innhentet, og "Installer Sara"-knappen står som fullført.

### 6. Trust Engine (fase 2)
Egen, tydelig merket blokk: dersom leverandøren har overtatt sin Trust Profile, hentes dokumentasjon automatisk derfra og markeres som verifisert kilde. Til den er aktivert, vises blokken som "Kommer" med CTA "Inviter til Trust Engine" som gjenbruker dagens invitasjonsflyt.

## Teknisk
- Endres: `src/components/asset-profile/tabs/VendorDocumentsTab.tsx` (ny struktur), `DocumentsTab.tsx` (kildekolonne, filter, forespørsler i samme liste), `DocumentRequestsSection.tsx` (blir rader, ikke egen seksjon).
- Nytt: `src/lib/vendorDocumentSource.ts` (kildemapping + dekningsberegning), liten `DocumentSourceIcon`-komponent.
- Gjenbruk: `SaraIcon`, `useSaraAgent`, `DocumentActionButtons`, `InviteVendorDialog`, `LaraInboxTab`-godkjenningslogikk.
- Ingen databaseendringer: `vendor_documents.source` finnes allerede; Trust Engine-kilde og agentkilde legges til som nye verdier i samme felt.
- Alle nye tekster som i18n-nøkler i `nb.json`/`en.json`.
