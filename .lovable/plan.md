# Lara-anbefaling for manglende grunnlag — tilbake til opprinnelig design

## Hva som endres

I dag vises tom-tilstanden som et eget stort kort (`RequestBaselineCard`) med en manuell velger for leverandørtype (Microsoft / BankID / Helse Vest-leverandør). Det bryter med måten Lara ellers anbefaler, og det ber brukeren om informasjon systemet allerede har.

Ny oppførsel:

1. **Samme Lara-design som ellers.** Meldingen «Vi mangler grunnlag fra …» vises i det vanlige Lara-anbefalingsbanneret (kompakt banner → «Vis plan» → oppgavekort), akkurat som andre anbefalinger på leverandørprofilen og dashbordet. Det egne kortet fjernes.
2. **Lara vet allerede hvilken leverandørtype dette er.** Ingen manuell velger. Signalene (offentlig fotavtrykk og mandatstyrke) utledes fra dataene vi har om leverandøren — navn/organisasjon, leverandørtype, bransje, land og kritikalitet. For NAV (Arbeids- og velferdsdirektoratet) betyr det: offentlig virksomhet med stort offentlig fotavtrykk og svakt kundemandat → Lara anbefaler **kartlegging av offentlige kilder med agenten**, og sier hvorfor.
3. **Opplasting er alltid mulig.** «Jeg har allerede dokumentasjon (ROS, DPIA, DPA, sertifikater)» er en egen, alltid tilgjengelig handling — både som sekundær handling i Lara-oppgaven og som eget valg i dialogen. Den er en annen oppgave enn å be om grunnlag, og skal ikke skjules for leverandørtyper der Lara anbefaler offentlig kartlegging.

## Innhold i Lara-oppgaven (tom tilstand)

- Tittel: «Vi mangler grunnlag fra {leverandør}»
- Kategori: leverandørtype/segment Lara har utledet (f.eks. «Offentlig virksomhet · stort offentlig fotavtrykk»)
- Lara ser: kort begrunnelse for anbefalt innhentingsmetode, tilpasset leverandøren
- Primær handling: anbefalt metode (for NAV: «La agenten kartlegge offentlige kilder»)
- Sekundær handling: «Se alle innhentingsmetoder» (åpner dialogen)
- Tredje handling: «Last opp dokumentasjon jeg allerede har»

## Teknisk

- `src/lib/vendorSourcingMethod.ts`
  - Ny `inferVendorSignals(input)` som utleder `SourcingSignals` fra leverandørdata (navn, vendorType, bransje, land, kritikalitet) med regler for: offentlig sektor/direktorat, global skyleverandør, regulert fellestjeneste, liten/lokal underleverandør. Returnerer også en kort segment-etikett brukt som kategori i Lara-oppgaven.
  - `VendorArchetype`-velgeren og `archetype`-feltet i `VendorSourcingState` beholdes ikke som UI, men typen kan bli stående som intern fallback for lagret state.
- `src/components/asset-profile/MynderGuidanceTab.tsx`
  - Når `needsBaseline` er sann: bygg én `LaraPlanTask` fra `inferVendorSignals` + `recommendSourcingMethod` og send den til den eksisterende `LaraRecommendationBanner` i stedet for `RequestBaselineCard`.
  - Primærhandling starter anbefalt metode direkte; sekundær åpner `RequestBaselineDialog`; «Les mer»-slot brukes til opplasting av eksisterende dokumentasjon (`setDocRequestType("general")`).
- `src/components/asset-profile/guidance/RequestBaselineCard.tsx` slettes.
- `src/components/asset-profile/guidance/RequestBaselineDialog.tsx`
  - Tar imot utledede signaler i stedet for `archetype`.
  - Får et fast alternativ nederst: «Jeg har allerede dokumentasjon — last opp ROS/DPIA/DPA».
- `src/components/asset-profile/VendorStatusBanner.tsx` bruker samme `inferVendorSignals` slik at banneret og veiledningen aldri gir motstridende anbefaling.
