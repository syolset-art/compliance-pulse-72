## Mål
Brukeren skal ikke lenger velge dokumenttype selv. De laster bare opp filen — Lara analyserer, foreslår type, regelverk/krav og viser hvilke steder i dokumentet som underbygger forslaget. Brukeren aksepterer, avslår, eller gjør en manuell vurdering.

## Ny flyt i «Last opp partner-bevis»

```text
Steg 1  Last opp fil            (kun fil + valgfritt notat — ingen typevalg)
   ↓    Lara analyserer dokumentet
Steg 2  Laras vurdering
        • Foreslått type            Penetrasjonstest (konfidens 87 %)
        • Regelverk og krav         NIS2 Art.21.2.e · ISO A.8.8 …
        • Kilder i dokumentet       «s. 4: Ekstern pentest utført av …»
        • Modenhetsløft             +8 % Sikkerhet
        [Avslå forslaget]  [Vurder manuelt]  [Aksepter forslag]
Steg 3  Manuell vurdering (kun hvis valgt eller ved avslag)
        Dagens skjema: type-velger + avhuking av regelverk/kontroller/løft
```

- **Aksepter** → bevis lagres med Laras mapping, merket «Bekreftet av deg, foreslått av Lara».
- **Avslå** → går videre til manuell vurdering med blanke/nøytrale forslag, og avslaget logges på beviset.
- **Vurder manuelt** → samme skjema, men forhåndsutfylt med Laras forslag som brukeren kan endre.

## Kildehenvisninger
Hvert forslag (type og hvert regelverk) får en liste med utdrag fra dokumentet: sidetall/seksjon + kort sitat. Vises som subtile «Kilde»-linjer under hvert element, med mulighet til å ekspandere hvis det er flere. Uten sitater merkes forslaget som «lav dekning» slik at det ikke fremstår mer sikkert enn det er.

## Teknisk

**`src/lib/partnerEvidence.ts`**
- Utvid `FrameworkMapping` med `citations?: { page?: string; quote: string }[]`.
- Nytt felt på `PartnerEvidence`: `laraVerdict: "accepted" | "declined" | "manual"`, `laraSuggestedType`, `confidence`.
- Legg til `mockLaraAnalysis(fileName)` som utleder type fra filnavn/heuristikk og returnerer forslag med sitater (demo-fallback når edge-funksjonen ikke svarer).

**Edge-funksjon**
Gjenbruk `classify-evidence-document` og utvid promptet til også å returnere `citations` (sidetall + sitat) per foreslått kontrollpunkt, samt mapping mot partnerbevis-typene. Faller tilbake til mock ved feil eller manglende tekstuttrekk, slik at prototypen alltid viser noe.

**`PartnerEvidenceUploadDialog.tsx`**
- Fjern `Select` for type i steg 1.
- Steg 2 blir «Laras vurdering» (lesevisning med konfidens, kilder, tre handlingsknapper).
- Steg 3 er dagens avhukingsskjema, gjenbrukt som manuell vurdering.

**Visning av lagret bevis** (`PartnerEvidenceSection.tsx`): liten indikator på om mappingen er Lara-foreslått og akseptert, eller manuelt satt.
