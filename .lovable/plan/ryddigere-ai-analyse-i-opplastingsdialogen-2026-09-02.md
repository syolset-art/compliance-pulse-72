# Ryddigere AI-analyse i opplastingsdialogen

Målet er mindre støy i «AI-analyse ferdig»-steget, tydeligere begrunnelse for AI-skår, og konsekvent visning av AI-forslag som oransje rosett.

## Endringer

1. **Fjern «Gyldig»-banneret**
   Den horisontale statuspillen (Gyldig / Utløper snart / Utgått) fjernes fra review-steget. Datoene under «Gyldig fra / Gyldig til» dekker informasjonen. Advarsler ved utgått dokument beholdes kun der de faktisk er kritiske: som kort hjelpetekst under «Gyldig til».

2. **AI-konfidensgrad med forklaring**
   Konfidensblokken blir eneste statusindikator. Ved siden av prosenten legges et info-ikon med hover/klikk som forklarer hvorfor skåren er høy eller lav, basert på det analysen faktisk fant:
   - hva slags dokumenttype som ble gjenkjent og hvilke signaler som traff (tittel, parter, datoer, nøkkelbegreper)
   - om gyldighetsdatoer ble funnet i dokumentet eller er satt som standard
   - hvor mange regelverk som ble koblet med høy relevans
   Teksten bygges fra eksisterende klassifiseringsdata (sammendrag, datoer, relevante regelverk), ikke fra nye AI-kall.

3. **AI-forslag som oransje rosett**
   Alle «AI-forslag»- og «AI»-pillene (dokumenttype, gyldig fra, gyldig til, foreslåtte regelverk) erstattes med den eksisterende oransje agent-rosetten fra Pin-systemet. Hover viser hva forslaget bygger på (agentanalyse av dokumentinnholdet, dato for analysen, og hvilket signal forslaget kommer fra).

4. **Visningsnavn kun ett sted**
   Filraden øverst og det separate «Visningsnavn»-feltet viser i praksis samme navn. Filraden blir ren filreferanse (filnavn + størrelse + bytt fil), og navnet redigeres kun i «Visningsnavn»-feltet.

## Teknisk

- Fil: `src/components/asset-profile/UploadDocumentDialog.tsx` (review-steget).
- Rosett: gjenbruk `PinRosette` / eksisterende agent-verifisert-stil fra `src/components/pin/`, med `Tooltip` for begrunnelse.
- `expiryStatusConfig` beholdes kun der den fortsatt brukes (lagret-steget); ubrukte deler ryddes bort.
- Ingen endringer i datamodell, edge functions eller lagringslogikk.
