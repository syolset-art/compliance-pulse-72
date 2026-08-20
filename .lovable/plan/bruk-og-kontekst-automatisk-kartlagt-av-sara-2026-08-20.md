# Bruk og kontekst: automatisk kartlagt av Sara

## Mål
Når kunden har installert Sara (lokal AI-agent i egen infrastruktur), skal fanen "Bruk og kontekst" vises i en alternativ, automatisk kartlagt variant. Sara sender kun metadata og signaler — aldri sensitivt innhold — nok til å gi totaloversikt for compliance og risikostyring.

## Når hvilken visning
- Sara ikke installert: dagens manuelle visning, uendret.
- Sara installert (`useSaraAgent`): automatisk visning som standard, med en veksler øverst: "Automatisk kartlagt (Sara)" / "Manuell".
- Alle Sara-utledede verdier er forslag brukeren kan overstyre — samme regel som for Lara.

## Innhold i den automatiske visningen

```text
┌─────────────────────────────────────────────┐
│ Kartlagt av Sara · lokalt · sist kjørt …    │  status-stripe
├──────────────────────┬──────────────────────┤
│ Kontekst (auto)      │ Hva brukes lev. til  │
│ kritikalitet         │ formål utledet av    │
│ prioritet            │ Sara + bruksmerker   │
│ GDPR-rolle           │ (redigerbart)        │
│ risikonivå           │                      │
├──────────────────────┴──────────────────────┤
│ Signalgrunnlag (hva Sara faktisk så)        │
├─────────────────────────────────────────────┤
│ Personverngrense — hva som ALDRI sendes     │
└─────────────────────────────────────────────┘
```

1. **Status-stripe**: kilde (Notion), agentversjon, sist kjørt, antall signaler, knapp "Se aktivitetslogg" (gjenbruker `SaraActivityLogDialog`).
2. **Kontekstkort (auto)**: kritikalitet, prioritet, GDPR-rolle og risikonivå med Sara-ikon og kort begrunnelse ("utledet av 4 signaler"). Hvert felt kan overstyres — da byttes merket til "Satt av bruker" og verdien låses mot senere auto-oppdatering.
3. **Bruk (auto)**: formålstekst og bruksmerker foreslått av Sara, redigerbart som i dag.
4. **Signalgrunnlag**: kompakt liste over ikke-sensitive signaler Sara rapporterte — dokument-ID + hash, dokumenttype/kategori, tellere (antall databehandleravtaler funnet, antall dokumenter som nevner leverandøren, siste dato), integrasjonsflagg (SSO, API, datalagring i EU/utenfor). Aldri dokumentinnhold, aldri personopplysninger, aldri fritekst fra kildene.
5. **Personverngrense**: rolig kort som lister hva Sara aldri sender (dokumentinnhold, personopplysninger, kundedata, hemmeligheter) og at alt prosesseres lokalt.

## Datagrunnlag
Ingen ny backend. Signalene utledes deterministisk i en ny hjelpefil fra det som allerede finnes (leverandørens metadata, datakategorier, underdatabehandlere, dokumenter) plus Sara-demofunnene i `src/lib/saraAgent.ts`, slik at demoen ser ekte ut uten å oppfinne et API.

## Teknisk
- Ny `src/lib/saraVendorMapping.ts`: typen `SaraVendorSignal` (id, kategori, etikett, verdi, dokumentId, hash, sett-dato, tillit) + `buildSaraVendorMapping(asset, dataCategories, processors)` som returnerer signaler og utledede forslag for kritikalitet, prioritet, GDPR-rolle, risiko og formål.
- Nye komponenter under `src/components/asset-profile/usage/`:
  - `SaraMappedContextView.tsx` — hele den automatiske visningen (status-stripe, auto-kontekstkort, signalgrunnlag, personverngrense).
  - `SaraSignalList.tsx` — kompakt signalliste med monospace dokument-ID/hash.
  - `SaraPrivacyBoundaryCard.tsx` — hva Sara aldri sender.
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: les `useSaraAgent()`, legg til visningsveksler, render `SaraMappedContextView` i auto-modus og eksisterende layout i manuell modus. Overstyring skriver til samme `saveMeta`/asset-felter som i dag, plus `context_set_by: "user"` per felt.
- Full NO/EN-tekst via samme `isNb`-mønster som resten av fanen. Kun eksisterende designtokens.
