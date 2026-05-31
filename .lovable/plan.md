# Underleverandørliste + Lara-analyse

Utvider steg 5 i aktiveringsveiviseren med mulighet for å laste opp eller lenke til en samlet underleverandørliste. Etter aktivering analyserer Lara listen og viser leverandørene i en ryddig tabell på Trust Profile-siden — med status for om hver leverandør selv har en Trust Profile (TP) i Mynder.

## 1. UI — steg 5 i veiviseren

Under de inntil 5 kritiske leverandørene legges en ny seksjon: **"Har du en samlet liste over alle underleverandører?"**

Tre valg (knapper):
- **Last opp liste** — drag-and-drop for CSV / XLSX / PDF. Viser filnavn + "Fjern".
- **Lim inn offentlig lenke** — input-felt for URL (typisk `/subprocessors`-side eller Trust Center hos leverandøren). Liten hjelpetekst: *"Bruk dette hvis Lara ikke fant siden automatisk."*
- **Har ikke / hopp over** — nullstiller begge.

Informasjonsboks over: *"Mange virksomheter har en åpen oversikt over underleverandører. Last opp eller lim inn lenken — så analyserer Lara listen og kobler hver leverandør mot Mynder-katalogen."*

## 2. Datamodell

Utvider `ActivationValues` i `src/lib/demoSeedTrustProfile.ts`:

```ts
subprocessorList?: {
  source: "upload" | "url";
  fileName?: string;
  url?: string;
  analyzedAt?: string;
  vendors?: AnalyzedSubprocessor[];
};
```

Ny type `AnalyzedSubprocessor`:
```
{ name; category; country?;
  hasTrustProfile: boolean;   // matched mot Mynder-katalog
  trustProfileScore?: number; // 0–100 hvis TP finnes
  dpaType: "standard" | "individual" | "unknown";
  source: "matched" | "unmatched"; }
```

## 3. Lara-analyse (demo)

Ny helper `src/lib/demoSubprocessorAnalysis.ts`:
- `analyzeSubprocessorFile(file)` — leser CSV/XLSX (én leverandør per rad), eller for PDF/ukjent: returnerer en mock-liste på 8–14 kjente leverandører.
- `analyzeSubprocessorUrl(url)` — returnerer mock-liste basert på domenet.
- Begge matcher navn mot `VENDOR_CATALOG` (allerede laget) for kategori + DPA-type, og mot en utvidet katalog over kjente Mynder-TP-deltakere (Microsoft, Google, AWS, Stripe, HubSpot osv. får `hasTrustProfile: true` + tilfeldig score 72–94).

Kalles fra `handlePublish` rett etter `seedFromActivation` — kjører som en synlig "Lara analyserer leverandørliste…" overlay (gjenbruker eksisterende `isCalculating`-state med ekstra delsteg). Toast etterpå: *"Lara analyserte X leverandører — Y har egen Trust Profile."*

## 4. Trust Profile — ny tabellvisning

Ny komponent `src/components/trust-center/profile/SubprocessorTable.tsx`, lastet inn på `/trust-center/profile` som et nytt kort under "Kritiske leverandører" (eller egen tab hvis seksjonen blir lang).

Kolonner:
| Leverandør | Kategori | Trust Profile | DPA | Land |
|---|---|---|---|---|
| Microsoft 365 | Skylagring | grønn pille "TP 87" + lenke til offentlig profil | Standard | Irland |
| Lokal Regnskap AS | Regnskap | grå "Ikke i Mynder" + knapp "Inviter" | Individuell | NO |

Funksjoner:
- Sortering på kolonner (header-klikk)
- Filter-chips: "Har TP" / "Mangler TP" / "Standard DPA"
- Søk på navn
- Tom-tilstand hvis ingen liste lastet opp: CTA "Legg til leverandørliste" → åpner steg 5 i veiviseren
- "Sist analysert: <dato>" + "Analyser på nytt"-knapp (re-kjører Lara-mock)

Bruker eksisterende `Badge`, `Table` fra shadcn — Apple-like, minimalistisk. Status-pille følger eksisterende risk-farger (grønn ≥75, oransje 50–74, grå hvis ingen TP).

## 5. Tekniske detaljer

**Filer som endres:**
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` — ny seksjon i `CriticalVendorsStep` (eller egen `SubprocessorListBlock`), state `subprocessorList`, sendes med i `handlePublish`.
- `src/lib/demoSeedTrustProfile.ts` — utvider `ActivationValues`, persisterer `subprocessorList` i seed (lagres i localStorage / company_profile-feltet som allerede brukes).
- `src/lib/vendorCatalog.ts` — legger til flagg `hasTrustProfile: boolean` på katalog-oppføringer.

**Filer som opprettes:**
- `src/lib/demoSubprocessorAnalysis.ts` — analyse-helpers + mock parser.
- `src/components/trust-center/profile/SubprocessorTable.tsx` — tabellkomponent.

**Filer som oppdateres for visning:**
- `src/pages/TrustCenterProfile.tsx` — render `<SubprocessorTable>` under kritiske leverandører.

**Avhengigheter:** ingen nye npm-pakker. CSV parses enkelt manuelt (split på `\n` / `,`); XLSX i demo-mode returnerer mock-liste uten faktisk parsing for å holde bundle slank.

**Ingen DB-endringer** — alt lagres i eksisterende seed/localStorage-flyt, i tråd med resten av Trust Profile-aktiveringen.
