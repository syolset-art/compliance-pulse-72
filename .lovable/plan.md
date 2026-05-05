## Mål

Når brukeren publiserer Trust Profilen skal alt være samlet i ett Trust Center på Mynder Trust Engine — med direkte deling til LinkedIn/Facebook, en snarvei tilbake til "min profil" fra Trust Engine-forsiden, og en venstre sidemeny som lar besøkende lese dokumentasjon, sertifikater og policyer **uten å forlate** Trust Centeret.

---

## 1. Suksessdialog: legg til sosiale delingsknapper

I publiseringsdialogen (`TrustCenterProfile.tsx`, `publishStep === "success"`) legge til tre nye delingsknapper under "Kopier lenke":

- **LinkedIn** — åpner `https://www.linkedin.com/sharing/share-offsite/?url={publicUrl}`
- **Facebook** — åpner `https://www.facebook.com/sharer/sharer.php?u={publicUrl}`
- **E-post** — `mailto:?subject=...&body={publicUrl}`

Bruk `lucide-react` `Linkedin`, `Facebook`, `Mail` ikoner. Knappene grupperes i en kompakt rad: "Del profilen" med outline-knapper i merkevarefarger.

---

## 2. Trust Engine-forsiden: "Min Trust Profile"-snarvei

I `src/pages/TrustEngine.tsx` legge til en seksjon over søkefeltet (kun synlig når brukeren er innlogget og har et `self`-asset med `publish_mode != 'private'`):

- Et eget kort: "Min Trust Profile" med firmalogo + Trust Score
- Knapp: "Åpne min profil" → `/trust-engine/profile/{minAssetId}`
- Hvis ikke publisert ennå: "Publiser din Trust Profile" → `/trust-center/profile`

Spørringen henter brukerens egen `assets` der `asset_type=self` og `created_by = auth.uid()` (eller den første self-asset i deres organisasjon).

---

## 3. Publisert Trust Center: nytt layout med venstre sidemeny

Dette er hovedendringen. I dag bruker `PublicTrustProfile.tsx` `TrustCenterProfile` rett ut uten sidemeny. Vi lager en ny vertikal navigasjon som "låser" besøkende inn i brukerens Trust Center.

### Ny komponent: `src/components/trust-center/PublicTrustCenterLayout.tsx`

```text
+----------------------------------------------------------+
| Mynder Trust Engine [tilbake til søk]   Open Database    |
+----------------------------------------------------------+
| [Logo]                                                   |
| Acme AS Trust Center                                     |
| Trust Score 87% · Sist signert 3. mai 2026               |
+--------+-------------------------------------------------+
| Sidebar|  Hovedinnhold                                   |
|        |                                                 |
| Profil |  (default = Trust Profile)                      |
| Doku-  |                                                 |
| menter |                                                 |
| Serti- |                                                 |
| fikater|                                                 |
| Policy |                                                 |
| Kontakt|                                                 |
| Del v  |                                                 |
+--------+-------------------------------------------------+
```

Venstre sidemeny (sticky, ca 220px):
- **Trust Profile** (default — viser hele `TrustCenterProfile` som nå)
- **Dokumentasjon** — viser alle publiserte dokumenter i en lesbar liste (PDF-viewer i panelet)
- **Sertifiseringer** — egen seksjon med ISO/SOC2 etc.
- **Policyer** — privacy, security, AUP etc.
- **Kontakt** — kontaktblokken alene
- **Del profilen** — viser delingsalternativene (lenke + LinkedIn/Facebook/e-post)

Når besøkende klikker en menypunkt, byttes innholdet **inne i layoutet** — ingen full-side navigation. Bruk lokal `useState` for aktiv seksjon, eller URL-fragment (`#dokumenter`).

### Dokumentvisning (uten å forlate Trust Centeret)

I "Dokumenter"-seksjonen vises hver fil som en kort-rad. Klikk åpner et innebygd PDF/IFrame-panel i samme view (eller eksisterende `previewDoc`-Dialog som allerede finnes i `TrustCenterProfile`). Eksterne lenker åpnes i nytt vindu, men interne dokumenter vises i en in-line viewer.

### Filer

- **Ny:** `src/components/trust-center/PublicTrustCenterLayout.tsx` — venstre sidemeny + innhold-switcher
- **Ny:** `src/components/trust-center/PublicDocumentList.tsx` — listevisning + innebygd preview
- **Endret:** `src/pages/PublicTrustProfile.tsx` — bruker det nye layoutet i stedet for å rendre `TrustCenterProfile` direkte
- **Endret:** `src/pages/TrustCenterProfile.tsx` — tar inn ny prop `hideHeader?: boolean` så vi unngår dobbel header når den vises inne i det publike layoutet; legger til delingsknapper i suksessdialog
- **Endret:** `src/pages/TrustEngine.tsx` — "Min Trust Profile"-kort på toppen for innloggede brukere

---

## 4. Tekniske notater

- Sidemenyen bruker `Sidebar`/`SidebarMenu` fra shadcn med `collapsible="icon"` så den krymper på mobil.
- Bruk eksisterende `vendor_documents`-spørring (`useQuery(['vendor-documents-tc', assetId])`) i den nye `PublicDocumentList` for å unngå duplikat-logikk.
- Aktiv seksjon synkroniseres med URL-hash slik at delbare lenker som `…/profile/{id}#sertifikater` fungerer.
- Header på `PublicTrustProfile` beholdes (Mynder Trust Engine-stripen) — brukerens Trust Center-tittel ligger under, slik at det er tydelig at innholdet eies av brukeren mens hosten er Mynder.
- Ingen DB-endringer kreves; alle publiserte dokumenter er allerede tilgjengelige via `vendor_documents` med `visibility = 'published'`.
