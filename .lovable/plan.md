## Gap-analyse: Playbook v0.4 «Partner etablerer og forvalter tjenestekatalog» vs. dagens flyt i Lovable (`/msp-services`)

Kilder: Notion-playbook lest 28.07.2026 + kodebase (`src/pages/MSPServiceCatalog.tsx`, `src/components/msp/*`, `src/lib/serviceLibrary.ts`, `src/lib/laraScopeDiff.ts`, `src/lib/customerOffers.ts`).

Status-koder: ✅ dekket · ⚠️ delvis · ❌ mangler

### Prinsipper og arkitektur

| Playbook-krav | Status | Kommentar |
|---|---|---|
| Felles Mynder-bibliotek + private partnerkataloger | ✅ | «Alle»-fanen viser kuratert bibliotek (`SERVICE_LIBRARY`); «Mine» er partnerens private extras. |
| Adoptere Mynder-mal uten å endre original | ✅ | «Legg til»-flyt kopierer template inn i partnerens katalog. |
| Opprett tjeneste fra null | ✅ | `CustomServiceDialog`. |
| Partnerdata forblir privat, ikke sideveis deling | ✅ | Ingen delingsmekanisme finnes. |
| LLM begrenset til aktive/versjonerte KCP-kilder med validerbare krav-ID | ❌ | `controlIds` er hardkodede strenger uten versjon/kilde/gyldighet. |
| Kravkobling = eget versjonert, sporbart objekt | ❌ | Kobling ligger inline i tjenestemal, ingen egen tabell/versjon. |
| Endring i global mal endrer ikke aktiv partnerkatalog automatisk (versjonert forslag) | ⚠️ | Kun scope-diff via `laraScopeDiff.ts`; ingen versjonering av mal→partnervariant. |

### Steg 1 – Velg inngang

| | Status | Kommentar |
|---|---|---|
| Importer eksisterende katalog (fil/innliming) | ❌ | Ingen import-flyt i UI. |
| Aktiver Mynder-mal fra kuratert startkatalog | ✅ | «Alle»-fanen + `MSPLaraServiceWizard` foreslår. |
| Opprett fra null | ✅ | `CustomServiceDialog`. |
| Import oppretter *utkast*, ikke publiserer automatisk | ❌ | Ingen utkast-status finnes; tjenester går rett til «active». |

### Steg 2 – Normaliser tjenesten (Lara)

| | Status | Kommentar |
|---|---|---|
| Lara strukturerer til tjenestekort, markerer manglende info | ⚠️ | Wizard samler kontekst, men ingen strukturell «mangler»-markering på selve tjenesten. |
| Klassifisering: eksisterende / ny foreslått / Mynder-støttet / tredjepart | ❌ | Kun skille Mynder vs partner-extras; ingen tredjepartsklasse eller «foreslått»-flagg som strukturert felt. |
| Leveranseform: engangs / løpende / rådgivning / produkt-abonnement | ⚠️ | Tjenester har `activities` og `role`, men leveranseform er ikke et strukturert felt. |

### Steg 3 – Beskriv resultat og bevis

| | Status | Kommentar |
|---|---|---|
| Beskrive tjenesten gjennom hva kunden mottar | ⚠️ | `description` + `activities` finnes, men ingen egen «leveranse/bevis»-modell. |
| Bevistyper (rapport, konfig, testprotokoll, attestering, hendelseslogg, policy, register, øvelse, statusrapport) | ❌ | Ingen bevis-taksonomi på tjenestenivå. |

### Steg 4 – Foreslå kravkoblinger

| | Status | Kommentar |
|---|---|---|
| Retning Tjeneste → leveranse/bevis → kontroll → krav/artikkel | ⚠️ | Retning finnes implisitt via `controlIds`, men bevis-leddet mangler. |
| Rolle: Direkte tiltak / Muliggjørende / Dokumenterende / Vurderende | ✅ | `ROLE_META`, `getMappingRoles`, `formatRoleVerbs`. Vises som badges i katalog og tilbud. |
| Kobling har kilde, regelverksversjon, relasjonstype, begrunnelse, scope, Confidence, godkjenningsstatus | ❌ | Kun rolle finnes; øvrige metadata mangler. |
| Standardformulering «støtter dette kravet», ikke «dekker» | ⚠️ | UI bruker delvis «dekker»/«coverage»; ikke normert. |
| KCP-forankring i AI-forslag | ❌ | Ingen validering mot verifisert kravkilde. |

### Steg 5 – Menneskelig kontroll

| | Status | Kommentar |
|---|---|---|
| Godkjenne / redigere / avvise AI-forslag enkeltvis | ❌ | Wizard foreslår tjenester samlet; ingen per-kobling godkjenning. |
| Tokontroll (produsent ≠ godkjenner, med logging ved unntak) | ❌ | Ingen godkjenningsroller eller sperre. |
| Stopp ved uenighet mellom aktive regulatoriske kilder | ❌ | Ikke modellert. |

### Steg 6 – Foreslå nye tjenestemuligheter

| | Status | Kommentar |
|---|---|---|
| Forslag basert på profil, kompetanse, eksisterende tjenester og markeder | ✅ | `MSPLaraServiceWizard` (profil-modus) + `buildRecommendations`. |
| Forslag merket med grunnlag/forutsetninger | ⚠️ | Anbefalte tjenester har stjerne; grunnlag vises ikke eksplisitt per forslag. |
| «Kan levere» aldri utledet fra kommersiell relevans alene | ⚠️ | Ingen eksplisitt regel; wizard-logikk kobler tjenester til svar, men uten kapabilitetsverifisering. |

### Steg 7 – Aktiver katalogen

| | Status | Kommentar |
|---|---|---|
| Bare tjenester med komplett kort + minst én godkjent kravkobling kan aktiveres | ❌ | Ingen aktiveringsgate; tjenester blir aktive umiddelbart. |
| Aktivering sender ikke tilbud / gjør ikke automatisk synlig for alle kunder | ✅ | Katalog og tilbud er separert (`useSavedOffers`, `MSPCreateOfferDialog`). |

### Steg 8 – Forvalt og revider

| | Status | Kommentar |
|---|---|---|
| Ny versjon ved endring av tjeneste, krav eller kapabilitet | ❌ | Ingen versjonshistorikk. |
| Berørte mappings settes til «må vurderes» | ❌ | Ikke implementert. |
| Eksisterende tilbud beholder koblingen til brukt versjon | ⚠️ | Tilbud fryser navn/pris via `SavedOffer`, men ikke kravkoblingsversjon. |
| Låst mot sletting når tilbud finnes | ✅ | `LockInfo` + disabled meny. |

### Tjenestekort-informasjonsmodell

| Felt fra playbook | Status | Kilde |
|---|---|---|
| Navn og kort beskrivelse | ✅ | `ServiceTemplate.name/description` |
| Målgruppe / segment | ❌ | Ikke felt |
| Leveranseform | ❌ | — |
| Scope, forutsetninger, avgrensninger | ❌ | — |
| Aktiviteter | ✅ | `activities` |
| Leveranse og bevis | ❌ | — |
| Kompetanse/sertifiseringer | ❌ | — |
| Kravkoblinger (versjonert, m. rolle, kilde, Confidence, godkjenning) | ⚠️ | Kun `controlIds` + `role` |
| Eier / ansvarlig hos partner | ❌ | — |
| Status: utkast / aktiv / avviklet | ⚠️ | Kun `active` / `retired` — mangler `draft` |
| Versjon / historikk / godkjenner | ❌ | — |

### Roller og fullmakter

| | Status | Kommentar |
|---|---|---|
| Partneradmin, Kundeansvarlig, Faglig ansvarlig som separate roller | ❌ | App-role-enum har ingen partner-spesifikke roller for godkjenning. |
| Aktivitetslogg synlig i Partner Workspace | ❌ | Ingen UI mot `partner_action_log`. |

### Konklusjon

Prototypen dekker godt: **struktur (privat/felles katalog), rolleklassifisering på kravkoblinger, Lara-forslag med scope-diff, tilbud-låsing, provisjonsmodell for Mynder-produkter**.

Kjerne-gap før playbooken kan sies å være «implementert»:
1. **Draft-status og aktiveringsgate** (Steg 7 + utkast) — enklest, størst effekt.
2. **Import (paste/fil) som Steg 1-inngang** — mangler helt.
3. **Per-kobling godkjenning + tokontroll** (Steg 5) — krever nytt UI, ny tabell for `service_requirement_mapping` med `approval_status`, `approver`, `confidence`.
4. **Versjonering av tjeneste og kravkobling** (Steg 8) — større datamodell-endring, låser tilbud til versjon.
5. **KCP-forankret kravkilde** (verifisert GDPR-kravsett med krav-ID/versjon) — forutsetning for Steg 4 og 5.
6. **Bevis-taksonomi** på tjeneste (Steg 3) — nødvendig for at kravkobling skal peke via bevis.
7. **Aktivitetslogg-visning** for partner (referanse: eksisterende `partner_action_log`).

### Anbefalt neste steg (bekreftet i svar)

Bygg MVP-pakken: **Draft-status + aktiveringsgate + Steg 1-import (paste/fil) + Steg 5 per-kobling godkjenning**. Dette gir en helhetlig, byggbar flyt for pilot uten å innføre versjonering eller ny kravkilde. Neste plan (implementasjon) leveres separat når du sier fra.
