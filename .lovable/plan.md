## Mål

Når brukeren lurer på *hvorfor* et kontrollområde har en gitt modenhet, skal det være tydelig hva Lara faktisk har funnet av kilder — typisk informasjon hentet fra leverandørens nettsider — og hvordan dette henger sammen med dokumentene de selv laster opp under **Trust Center → Dokumentasjon**.

Vi løser det med en ny **Kilder**-komponent som vises inline når et kontrollområde utvides i "Modenhet per kontrollområde", side om side med dagens "Forventet dokumentasjon"-sjekkliste.

## Konsept

For hvert kontrollområde (Governance, Drift og sikkerhet, Identitet og tilgang, Personvern, Leverandører) viser vi tre lag — i samme rekkefølge slik at sammenhengen blir intuitiv:

```text
┌─ Kontrollområde (utvidet) ──────────────────────────────┐
│ • Kontroller (eksisterende liste)                       │
│ ─────────────────────────────────────────────────────── │
│  KILDER  — hva Lara har funnet                          │
│   ✓ Privacy policy (vendor.com/privacy)   [Aksepter]    │
│   ✓ ISO 27001-omtale (vendor.com/security)[Forkast]     │
│   + Legg til kilde manuelt                              │
│ ─────────────────────────────────────────────────────── │
│  DOKUMENTASJON  — egne opplastede dokumenter            │
│   (eksisterende InlineDocumentChecklist + lenke til     │
│    Trust Center → Dokumentasjon)                        │
└─────────────────────────────────────────────────────────┘
```

Kilder = "passive funn fra nettet" (lavere vekt). Dokumentasjon = "verifiserte filer" (høyere vekt). Begge teller inn i modenheten — vi gjør den koblingen synlig.

Kilder kan vær en del av det - men vi skal også ha med kontrollpunker - se under.  
Dersom kunden har aktivert Mynder Core kan Lara agenten hente dette og svar ja - at det er på plass (kunden har da oppgitt denne informasjonen som ledd i å bruke plattformen) og dersom Lara ikke kan finne informasjonen er den ikke huket av - men står mangler data - og brukeren må svare manuelt - eller at det er noe som agenten fant basert på dokumentasjon kunden har lastet opp - eller som vi finne på websidene til brukeren (personvernerklæing, databehandleravtale, åpenhetsrapport o.l).

  
**Governance & Accountability (100%)**

- Ansvar for sikkerhet og personvern
- Dokumenterte policyer
- Risikovurdering siste 12 mnd
- Hendelseshåndtering

---

### **Security (20%)**

- Tilgangsstyring (least privilege)
- MFA
- Kryptering
- Logging og overvåking
- Sikkerhetstesting

---

### **Privacy & Data Handling (60%)**

- Behandlingsoversikt (ROPA)
- Databehandleravtale (DPA)
- DPIA
- Registrertes rettigheter
- Kontroll over datalagringssted

---

### **Third-Party & Supply Chain (67%)**

- Leverandørkartlegging
- Kontroll på underleverandører
- Jevnlig oppfølging

## Komponentstruktur

**Ny komponent:** `src/components/trust-controls/SourcesPanel.tsx`

- Props: `assetId`, `controlArea`, `onNavigateToDocuments?`
- Viser en liste over `trust_profile_sources`-rader filtrert på `control_area`
- Status pr kilde: `suggested` (Laras forslag, blå chip), `accepted` (grønn), `rejected` (utgrået), `manual` (lagt til av bruker)
- Handlinger pr rad: Aksepter, Forkast, Gjenopprett (for forkastede), Slett (for manuelle), åpne kildelenke
- Knapp øverst: "Legg til kilde manuelt" (URL + tittel + valgfri kommentar)
- Tom-tilstand: "Lara har ikke funnet kilder ennå" + knapp "Be Lara analysere nettsidene"
- Footer-lenke: "Se alle dokumenter i Dokumentasjon" → `onNavigateToDocuments` (eksisterende mønster fra `InlineDocumentChecklist`)

**Oppdatert:** `src/components/trust-controls/TrustControlsPanel.tsx`

- I `isExpanded`-blokken (linje 452) renderer vi `<SourcesPanel>` rett under kontrollene og over `InlineDocumentChecklist`
- Liten seksjonsoverskrift "Kilder" og "Dokumentasjon" for å gjøre lagdelingen tydelig
- Knappen "Hvor kommer scoren fra?" øverst i utvidet visning som scroller til Kilder

**Oppdatert:** `useTrustControlEvaluation.ts`

- Henter også `trust_profile_sources` for asset
- Antall `accepted`/`manual` kilder per område mates inn som ekstra signal i `evidenceSummary` og brukes til en liten "Kilder: 3 aksepterte"-badge i area-headeren

## Datamodell

Ny tabell `trust_profile_sources`:

```text
id              uuid pk
asset_id        uuid fk → assets.id
control_area    text  (governance | risk_compliance | …)
title           text
url             text nullable
snippet         text nullable        -- Laras kort utdrag/begrunnelse
source_type     text  ('webpage' | 'document_link' | 'manual')
status          text  ('suggested' | 'accepted' | 'rejected' | 'manual')
discovered_by   text  ('lara' | 'user')
created_at, updated_at, decided_at, decided_by
```

RLS: select/insert/update for autentiserte brukere som eier asset (samme mønster som øvrige asset-relaterte tabeller — vi gjenbruker eksisterende policy-stil).

## Lara-analyse (edge function)

Ny funksjon: `supabase/functions/discover-trust-sources/index.ts`

- Input: `assetId`
- Henter asset (navn + nettside fra `assets.metadata.website`)
- Bruker Lovable AI Gateway (`google/gemini-2.5-flash`) med en strukturert prompt: "Gå gjennom typiske Trust/Security/Privacy-sider på {domain}. Returner JSON med funn pr kontrollområde."
- Hvis Firecrawl-konnektoren er tilkoblet, brukes `scrape`/`map` for å faktisk hente sider; hvis ikke, fallback til ren AI-inferens basert på domenet (markert tydelig som "AI-antatt")
- Skriver funnene som `status='suggested'` rader i `trust_profile_sources` (idempotent på `(asset_id, url, control_area)`)

Trigges:

- Lazy ved første expand av et område (samme mønster som `analyze-process-agent-fit`)
- Manuelt via "Be Lara analysere nettsidene"-knapp

## Kobling til Trust Center → Dokumentasjon

- I `SourcesPanel`-footeren: lenke "Konverter til dokument" pr akseptert kilde → åpner `AddEvidenceDialog` forhåndsutfylt med URL og tittel, slik at brukeren kan løfte en kilde til et formelt bevis
- I `TrustCenterPolicies` / dokumentasjonssidene: en liten info-stripe "Disse dokumentene utfyller kildene Lara har funnet — se kontrollområdet for full kontekst"
- Området-header viser tellere: `"Kilder: 3 · Dokumenter: 2"` slik at sammenhengen er synlig før utvidelse

## Filer som opprettes/endres

- ny: `src/components/trust-controls/SourcesPanel.tsx`
- ny: `src/hooks/useTrustProfileSources.ts` (queries + mutations: accept/reject/addManual/triggerDiscovery)
- ny: `supabase/functions/discover-trust-sources/index.ts`
- ny migrasjon: tabellen `trust_profile_sources` + RLS
- endret: `src/components/trust-controls/TrustControlsPanel.tsx` (render Sources i utvidet område + tellere i header)
- endret: `src/hooks/useTrustControlEvaluation.ts` (les inn kilder for evidenceSummary)
- endret: `src/components/trust-controls/InlineDocumentChecklist.tsx` (mindre endring: legg seksjonstittel "Dokumentasjon" så lagdelingen blir tydelig)
- endret: `src/pages/TrustCenterPolicies.tsx` (info-stripe som peker tilbake til Kilder)

## Hvorfor dette gir mening for brukeren

1. **Transparent score** — "Modenhet" får et synlig "hvorfor": kilder + dokumenter
2. **Brukerkontroll** — Lara foreslår, brukeren bestemmer (aksepter/forkast/legg til)
3. **Tydelig hierarki** — Kilder (web-funn) er svakere bevis enn opplastede Dokumenter, og UIet viser det
4. **Naturlig bro** — Én knapp "Konverter til dokument" tar brukeren fra Laras funn til formell dokumentasjon i Trust Center → Dokumentasjon