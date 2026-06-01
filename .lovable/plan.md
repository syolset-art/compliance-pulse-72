## Tolkning

"Phils" tolkes som "pills" — de runde badges/pillene i aktivitetsloggen på Mynder-veiledning-fanen (`/assets/:id` → Mynder-veiledning → Aktivitetslogg). I dag har hver rad opptil fire piller (fase, "Lukker gap", "Manuell", status-pille) pluss actor-info, som gjør loggen visuelt støyete.

## Mål

Strammere, enklere aktivitetslogg — fjern alle dekorative piller fra hver rad. Behold kun det som faktisk er nødvendig for å forstå raden.

## Endringer i `src/components/asset-profile/tabs/VendorActivityTab.tsx`

Per aktivitetsrad (linje ~270–337):

**Fjernes:**
- Fase-badge (`phaseConf`)
- "Lukker gap"-badge
- "Manuell"-badge
- Status-pillen som klikkbar knapp (erstattes av en liten farget prikk)
- Actor + actorRole-linjen (flyttes inn i utvidet detaljpanel ved klikk)

**Beholdes / forenkles:**
- Ikon + tidslinje-strek i venstre kolonne (uendret)
- Tittel (`titleNb` / `titleEn`)
- Relativ dato (høyre side, mindre)
- Liten farget statusprikk (3px) ved siden av dato — beholder visuell signal uten pill
- Klikk på raden åpner detaljpanel som før (der actor, status-editor og full info vises)
- "Closes gap" indikeres fortsatt via venstre grønn kantlinje (eksisterer allerede via `border-l-2 border-success`)

**Status-redigering:** flyttes til detaljpanelet (`ActivityDetailPanel`) i stedet for inline pill-knapp på raden. Klikk på prikken eller raden åpner panelet; ingen separat toggleStatusEditor på rad-nivå.

**Sammendragslinjen øverst** (linje 225–246, "X aktivitet(er) i loggen" + "venter på Lara-oppfølging") beholdes — den er informativ, ikke dekorativ.

**Statusfilter-knappene øverst** (linje 200–221) beholdes — disse er funksjonelle filter, ikke piller på rader.

## Resultat

Hver rad reduseres fra 2–3 visuelle linjer med 3–5 piller til én ren linje: `[ikon] Tittel … dato`. Detaljer hentes ved klikk. Totalhøyden per rad ~halveres.

## Filer som endres

- `src/components/asset-profile/tabs/VendorActivityTab.tsx` (kun rad-rendring i loggen, ingen datamodell-endring)

## Out of scope

- Endringer i `RegisterActivityDialog`, `MaturityHistoryChart`, Lara-banneret eller andre seksjoner på Mynder-veiledning.
- Endring av aktivitetsdata eller status-typer.
