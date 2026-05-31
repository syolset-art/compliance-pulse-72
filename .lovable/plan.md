# Forenkle "Kritiske leverandører"-steget

Steget skal stille færre og mer presise spørsmål per leverandør — uten å gå ned i felter eller systemer. Autosuggest mot porteføljen/Mynder-katalogen beholdes (skjult kartlegging for brukeren).

## Ny struktur per leverandørkort

1. **Navn på leverandør** — beholdes som i dag (autosuggest mot `VENDOR_CATALOG` + portefølje).
2. **Hva gjør de for dere?** — én kort setning eller kategori.
   - Inputfelt (én linje) med placeholder `f.eks. "Skylagring", "HR-system", "Fakturering"`.
   - Når en kjent leverandør er valgt, foreslås `knownVendor.category` som ferdig forslag-chip brukeren kan trykke for å fylle inn (men kan overstyres fritt).
3. **Behandler de personopplysninger på dine vegne?** — `Ja` / `Nei` (segmentert knapperad).
   - Hvis **Ja**: vis sekundærspørsmål **"Hvilken kategori?"** med chips (multi-select):
     - `Ansattdata`, `Kundedata`, `Pasientdata`, `Annet`
   - Hvis **Nei**: skjul kategori-valget og hopp DPA-logikken til standardvisning.
4. **Har dere en DPA med dem?** — `Ja` / `Nei` / `Vet ikke` (segmentert knapperad, beholdes).
   - Spesialtilfellet for `dpaType === "standard"` (Microsoft, Google osv.) beholdes: vis info-boks om at standard DPA gjelder, og forhåndsvelg `Ja`.
   - Hvis bruker svarte `Nei` på personopplysninger, vises DPA-feltet fortsatt, men med en liten hjelpetekst: *"DPA er normalt ikke påkrevd når leverandøren ikke behandler personopplysninger."*

## Det som fjernes

- Hele "Hva har de tilgang til?"-blokken: chip-quickpicks (`accessQuickPicks`), valgte chips, og custom-tilgang-input.
- Tilhørende state: `accessChips`, `customAccess`, `toggleChip`, `setAccessChips`, samt prefilling av `access` ved `selectVendor`.

## Datamodell-endringer

`CriticalVendorRow` (rundt linje 69) utvides/erstattes:

```ts
type CriticalVendorRow = {
  name: string;
  purpose: string;                // ny — "Skylagring", "HR-system", …
  processesPersonalData: "yes" | "no" | null;  // ny
  dataCategories: string[];       // ny — kun relevant når processesPersonalData === "yes"
  dpa: "yes" | "no" | "unknown" | null;
  // access fjernes
};
```

`EMPTY_VENDOR_ROW` oppdateres tilsvarende. Submit-mappingen (linje ~451) oppdateres til å sende de nye feltene videre, og demo-seed (`demoTrustActivation.ts` hvis den fyller `access`) får tilsvarende justering.

## Filer som endres

- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`
  - `CriticalVendorRow`-typen + `EMPTY_VENDOR_ROW`
  - `VendorRowCard`-komponenten (linje 1513–1712): bytt ut access-blokken med formål + personopplysninger + kategori
  - Submit-mappingen for `criticalVendors`
- `src/lib/demoTrustActivation.ts` — hvis seed-data inneholder `access`-felt, oppdateres til `purpose` + `processesPersonalData` + `dataCategories` så demo-flyten fortsatt fungerer.

## Validering/Fortsett-knapp

`Fortsett` aktiveres når minst én rad har `name` utfylt (samme regel som i dag). Ingen av de nye feltene er påkrevd — de er hjelpeinformasjon.
