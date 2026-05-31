# Demo-modus: Auto-aktivering av Trust Profile

## Mål
Gjør det enkelt å filme aktiveringen av Trust Profile: ett klikk → nullstilling → wizard spilles av med rolige pauser → publisert profil med modenhet over 40%.

## Trigger
- **URL-parameter**: `/trust-center/profile?demo=activation` starter demoen.
- **Knapp**: Liten "Spill av demo"-knapp på den låste landingen (`Din Trust Profile gjør deg klar`), kun synlig når URL-en *ikke* allerede har `?demo=activation`. Klikket navigerer til samme route med parameteren.
- Vanlig oppførsel (uten parameter/knapp) er uendret — ingen risiko for produksjon.

## Nullstilling
Når demoen starter på `TrustCenterProfile`:
1. Fjern `localStorage.mynder.trustprofile.activated` slik at låst landing vises et øyeblikk.
2. Sett `publish_mode: "ecosystem"` på self-asset (avpubliser) og nullstill demo-metadata-felter som ble fylt under forrige aktivering (kontakter, MFA, kryptering, policy-flagg, mfl. — samme felter som `seedFromActivation` setter), slik at trustScore faller tilbake til "low".
3. Invalider relevante queries (`self-asset-profile`, `asset-for-trust-eval`, `asset-docs-count`).
4. Vis kort den låste landingen i ~1,2 s, så åpne wizarden i `autoPlay`-modus.

Etter at demoen er ferdig fjernes `?demo=activation` fra URL-en med `replaceState` for ikke å re-trigge ved refresh.

## Auto-play av wizarden (ca. 40 s totalt)
Ny prop på `ActivateTrustProfileWizard`: `autoPlay?: boolean`.

Når `autoPlay = true` advancer wizarden seg selv etter at hvert steg er rendret, med pauser som gir tid til å lese:

| Steg | Handling | Pause |
| --- | --- | --- |
| 1 Organisasjon | Auto-utfyll firma/website hvis tomt, så klikk "Fortsett" | 4 s |
| 2 Lara skanner | Bruker eksisterende auto-advance når `revealed === findings.length` (≈8 s med `SCAN_STEPS_MS`) | — |
| 3 Bekreft | Behold prefylt beskrivelse, klikk "Til dokumenter" | 5 s |
| 4 Dokumenter | Ingen opplastning, klikk "Til kritiske leverandører" | 4 s |
| 5 Kritiske leverandører | Hopp over (tom rad), klikk "Til modenhet" | 4 s |
| 6 Modenhet | Behold Laras forhåndsutfylte svar, klikk "Velg synlighet" | 6 s |
| 7 Synlighet | Behold default, klikk "Publiser & aktiver" | 5 s |

Implementasjon: `useEffect` per steg som setter en `setTimeout` ved mount og kaller wizardens eksisterende handlers (`next`, `handlePublish`/equivalent for steg 7). Timeoutene ryddes opp ved unmount/steg-skift. Knappene fungerer fortsatt manuelt — auto-play overstyrer ikke bruker-klikk.

## Modenhet over 40%
- `seedFromActivation` setter allerede `mfa_org`, `encryption_org`, `documented_policies`, `incident_handling`, `access_control` osv. til "yes" basert på scan-resultatet — det gir reell trustScore ≈ 50–60%.
- I tillegg sørger den eksisterende "aktivert"-fallback'en i `TrustCenterProfile.tsx` (gulv på 52% når aktivert) for at modenhet aldri vises lavere enn medium etter publisering.

## Teknisk
**Filer som endres:**
- `src/pages/TrustCenterProfile.tsx` — lese `?demo=activation`, nullstillingsrutine, "Spill av demo"-knapp på låst landing, sende `autoPlay`-prop til wizarden.
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` — ny `autoPlay` prop, `useEffect` med per-steg-timere som kaller eksisterende `next()`/publiser-handler.
- (Liten) ny helper i `src/lib/demoSeedTrustProfile.ts` for å nullstille demo-metadata, gjenbrukt av demoen.

**Ingen endringer** i datamodell, RLS, edge functions eller andre sider.

## Kvalitetssjekk
- Verifisere at uten `?demo=activation` ser brukeren ingen forskjell.
- Manuell test: `/trust-center/profile?demo=activation` → wizarden lander på publisert profil med trustScore ≥ 52% etter ~40 s uten manuell interaksjon.
- Avbryt-test: lukker wizarden manuelt under auto-play stopper timerne.
