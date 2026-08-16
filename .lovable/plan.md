# Ryddigere og mer agentisk «Bruk og kontekst»

## Problemet
Fire like store bokser side om side med mye hjelpetekst, forklaringer og lenker blir rotete. Samtidig mangler det viktigste feltet: **hva leverandøren faktisk brukes til**. GDPR-rolle alene sier ikke nok.

## Ny struktur på fanen

```text
1) Laras forslag (agentisk banner øverst)
   «Basert på bransje, personvernerklæring og beskrivelsen foreslår Lara:
    Bruksformål: Lønn og HR · Databehandler · Kritikalitet Middels · Risiko Middels»
   [Godta alle]  [Se begrunnelse]

2) Hva brukes leverandøren til?   (nytt hovedfelt, full bredde)
   - Fritekst + [Foreslå med Lara]
   - Hurtigvalg (chips): Lønn/HR, IT-drift, Regnskap, Markedsføring,
     Kundedata/CRM, Skylagring, Support, Sikkerhet, Annet
   - Valgt formål driver forslagene for GDPR-rolle, kritikalitet og risiko

3) Kompakt oppsummeringsrad (4 pill-verdier på én linje, ikke fire kort)
   Kritikalitet · Prioritet · GDPR-rolle · Risiko
   Klikk på en verdi → utvides inline med selector, hjelpetekst og
   «Påvirker …»-lenke. Kun én utvidet om gangen.

4) Detaljer som i dag (sensitive kategorier, prosesser) — under raden
```

## Laras forslag – hva de bygger på
- **Bransje / leverandørkategori** (`vendor_category`)
- **Personvernerklæring** (`privacy_policy_url` — nevnes bare når den er registrert)
- **Beskrivelse av hva leverandøren gjør på vegne av virksomheten** (`description` + det nye bruksformålet)

Forslagskortet viser kildene som små merker («Bransje», «Personvernerklæring», «Beskrivelse») slik at brukeren ser hva forslaget hviler på. Brukeren kan alltid overstyre; manuell overstyring beholder dagens «Satt manuelt av …»-merke og begrunnelse for risiko.

## Teknisk
- Nytt bruksformål lagres i `assets.metadata.usage_purpose` (fritekst) og `metadata.usage_tags` (chips). Ingen migrasjon nødvendig — `metadata` er allerede jsonb.
- Ny helper `src/lib/vendorContextSuggestion.ts`: `suggestVendorContext({ vendorCategory, description, usagePurpose, hasPrivacyPolicy, sensitive })` → `{ usageSuggestion, gdprRole, criticality, sources[], reasons[] }`. Regelbasert v1, samme mønster som `vendorRiskSuggestion.ts` (som gjenbrukes for risikonivået).
- `VendorUsageTab.tsx` deles opp i mindre komponenter under `src/components/asset-profile/usage/`:
  - `LaraContextBanner.tsx` (forslag + Godta alle)
  - `VendorPurposeCard.tsx` (fritekst + chips + Foreslå)
  - `ContextPillRow.tsx` (kompakt rad med inline-utvidelse per felt)
  Eksisterende lagringslogikk (`handleFieldChange`, sensitive kategorier, risiko-overstyring) beholdes uendret.
- Norsk/engelsk via samme `isNb`-mønster.
- Ansvarlig for responsivitet: pill-raden wrapper på mobil, utvidet panel går i full bredde.

## Verifisering
- Sett bruksformål → se at Laras forslag for GDPR-rolle/kritikalitet/risiko oppdateres.
- «Godta alle» lagrer alle feltene; manuell endring av risiko beholder begrunnelsesfeltet.
- Sjekk mobil- og nettbrettbredde.
