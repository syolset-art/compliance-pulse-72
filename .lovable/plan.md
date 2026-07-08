## Mål
Gjøre statusen på hvert kontrollpunkt tydeligere, slik at brukeren umiddelbart ser tre ting:
1. **Fremdrift** — hvor langt kravet er kommet (Ikke besvart / Pågår / Implementert / Verifisert / Ikke relevant).
2. **Bevis-tillit** — hvordan det er dokumentert (Bevis påkrevd / Egenrapportert / Attestert / Verifisert / Utenfor scope), med attestant-navn og dato der det finnes.
3. **Vedlikehold** — når det må re-attesteres, og hvor mange bevis som er dekket (f.eks. «18/18», «Re-attesteres om 14 d»).

Modellen bygger på eksisterende `evidenceStatus.ts` (uploaded → classified → confirmed → attested → verified) og utvider raden i `FrameworkRequirementsList` visuelt — ingen ny datamodell i backend enda.

## Visuell struktur per rad (jf. bilde)

```text
[icon]  Kravtittel (Art. XX)                     [Bevis-badge] [Status-badge] [chev]
        ↳ Attestert av {navn} ({rolle}) · {dato}                    [18/18]
```

- **Ledende ikon** endrer form + farge per fremdrift:
  - Verifisert → grønn `ShieldCheck`
  - Implementert → blå `CheckCircle2`
  - Pågår → stiplet oransje `CircleDashed`
  - Ikke besvart → grå `Circle`
  - Ikke relevant → grå `CircleSlash` (dempet hele raden)
- **Bevis-badge** (venstre av to): "Verifisert", "Egenrapportert", "Bevis påkrevd", "Re-attesteres om Xd", "Utenfor scope". Ikon + fargekode fra tokens (`success`, `primary`, `warning`, `muted`).
- **Status-badge** (høyre): "Implementert", "Verifisert", "Pågår", "Ikke besvart", "Ikke relevant".
- **Attestasjons-subline** (kun når `attested`/`verified`): "Attestert av {navn} ({rolle}) · {dato}", liten skrift, samme farge som bevis-badge.
- **Bevis-teller** "X/Y" vises når krav har definert antall bevis.
- **Hele raden** dempes (`opacity-60`) når "Utenfor scope"/"Ikke relevant".

## Endringer

### 1. Nytt: `src/lib/requirementStatusModel.ts`
Rendyrket UI-modell som mapper til/fra eksisterende `EvidenceStatus`:

```ts
type ProgressStatus = "not_answered" | "in_progress" | "implemented" | "verified" | "not_applicable";
type EvidenceState = "required" | "self_reported" | "attested" | "verified" | "revalidation_due" | "out_of_scope";

interface RequirementUiState {
  progress: ProgressStatus;
  evidence: EvidenceState;
  attestedBy?: { name: string; role: string; date: string };
  evidenceCount?: { collected: number; required: number };
  revalidationDaysLeft?: number;
}
```

Med `getProgressConfig()` og `getEvidenceConfig()` som returnerer `{ labelNb, labelEn, icon, className }` — brukes både i regelverk-listen og evt. andre steder.

### 2. `src/components/regulations/FrameworkRequirementsList.tsx`
- Utvid `generateDemoStates` til å produsere `RequirementUiState` (bruker hash for variasjon: noen verifisert m/attestant, noen re-attestering, noen out_of_scope).
- Rendre nye badges + subline + teller ihht. mockup.
- Behold eksisterende ekspandering, filter-tabs og notat-flyt.
- Filter-tabs beholdes men mapper til ny modell (Ikke oppfylt = `not_answered`+`in_progress`, Delvis = `implemented`, Oppfylt = `verified`).

### 3. `src/components/compliance/RequirementCard.tsx`
- Bytt eksisterende `status`-ikon/badge til samme to-badge-mønster (`ProgressStatus` + `EvidenceState`) via `requirementStatusModel`.
- Legg til attestasjons-subline når det finnes.
- Kompakt variant beholder bare ledende ikon + bevis-badge til høyre.

### 4. `src/components/asset-profile/tabs/VendorControlsTab.tsx`
- Bytt dagens ene status-badge til samme mønster (bevis-badge + status-badge).
- Vis FileText-ikonet kun når `evidence !== "required"`.

## Fargebruk (semantiske tokens)
- `success` — Verifisert, Attestert
- `primary` — Implementert, Egenrapportert
- `warning` — Pågår, Re-attesteres, Bevis påkrevd (subtil)
- `muted` — Ikke besvart, Utenfor scope, Ikke relevant

Alle klasser via eksisterende tokens — ingen hardkodede farger.

## Utenfor scope
- Ingen ny DB-tabell eller migrasjon nå — modellen er UI-side og drives av demo-data + eksisterende evidence-status.
- Ingen endring i selve arbeidsflyten for å attestere/verifisere (den lever i evidence-registeret).
- Ingen ny tooltip-tekst — kun de vi allerede har.
