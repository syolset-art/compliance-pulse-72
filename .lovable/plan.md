## Mål

Når brukeren publiserer Trust Profilen sin, skal flyten gjøre det tydelig at profilen nå ligger i **Mynder Trust Engine** (Mynders eide register over verifiserte Trust Profiler). Knappen skal hete kun **Publiser / Publish** (også når den er publisert fra før).

## Endringer

### 1. `src/pages/TrustCenterProfile.tsx` — knappetekster
- Endre knappen i "Ready to publish"-kortet fra "Publiser Trust Center" → **"Publiser" / "Publish"**.
- Endre knappen i "Published"-kortet fra "Oppdater publisering" → **"Publiser" / "Publish"** (samme tekst i begge tilstander, slik bruker bestilte).
- Endre dialog-knappen "Publiser nå" → **"Publiser" / "Publish"**.
- Endre dialog-tittel-følelsen til å nevne "publiseres til Mynder Trust Engine".

### 2. `src/pages/TrustCenterProfile.tsx` — suksesssteg
- Etter vellykket publisering legge til en tydelig CTA-blokk:
  - Lite Mynder-merke + tekst: *"Profilen din ligger nå i Mynder Trust Engine"*.
  - To knapper: **"Se profilen i Trust Engine"** (navigerer til `/trust-engine/profile/{asset.id}`) og **"Åpne Trust Engine"** (navigerer til `/trust-engine`).
- Legg URL-eksempelet om så det viser `trust.mynder.com/...` som hostet av Mynder Trust Engine.

### 3. `src/pages/TrustEngine.tsx` — vis kun publiserte profiler
- Filtrer søkeresultatene på `publish_mode` ulik `'private'` slik at registret kun lister organisasjoner som faktisk har trykket Publiser.
- Legg til en liten badge "Publisert" på hvert kort.
- Etter publisering blir Dintero (eneste demo-self-asset) automatisk synlig i `/trust-engine` siden `handlePublish` setter `publish_mode = 'all'`.

### 4. Demo-data
- Sett `publish_mode = 'all'` på Dintero sitt self-asset slik at det er synlig i Trust Engine fra start (ellers ser bruker tomt register).

## Teknisk

- Ingen schema-endringer; `assets.publish_mode` finnes allerede.
- Ingen nye routes; bruker eksisterende `/trust-engine` (oversikt) og `/trust-engine/profile/:assetId` (offentlig profil).
- Lokalisering: alle tekster mappes mot `isNb` etter eksisterende mønster (ingen i18n-keys i denne filen).
- Bruk eksisterende ikoner (`Globe`, `ExternalLink`, `Shield`) — ingen nye dependencies.

## Flyt etter endringene

```text
[Trust Profile] -> klikk "Publiser"
       |
       v
[Bekreftelses-dialog] -> klikk "Publiser"
       |
       v
[Spinner: "Publiserer til Mynder Trust Engine..."]
       |
       v
[Suksess-steg]
  - "Trust Center publisert!"
  - URL: trust.mynder.com/<slug>
  - CTA: "Se profilen i Trust Engine" -> /trust-engine/profile/<id>
  - CTA: "Åpne Trust Engine"          -> /trust-engine
```
