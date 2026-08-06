# Én felles aktiveringsflyt for alle produkter

## Slik er det i dag
- Mynder Core og Leverandørmodul: nivådialog → bekreftelsesdialog med vilkår → kvittering med neste steg.
- Assets, Regelverk, Trust Center og øvrige moduler: én vilkårsdialog → toast. Ingen kvittering, ingen lenke inn i modulen.
- Modulen heter «Assets» i abonnementskortet, i modulinfo og i tjenestekatalogen.

Resultatet er at flyten oppleves ulik fra produkt til produkt, og at brukeren etter aktivering ikke får en tydelig vei videre.

## Slik skal det bli
Samme tre trinn for alle produkter:

```text
[Aktiver]  ->  Vilkårsdialog (pris + vilkår)  ->  Kvittering med lenke inn i modulen
                 én dialog, ingen flere         "Åpne Eiendeler" / "Legg til eiendel"
```

1. **Aktiver**: knappen på produktkortet åpner én dialog.
2. **Vilkår**: dialogen viser produktnavn, månedspris eks. mva, teksten «Tjenesten aktiveres umiddelbart, og faktureres på neste faktura», og avkrysning for vilkår. Er vilkårene allerede godtatt, er boksen forhåndsavkrysset — brukeren bekrefter fortsatt aktivt.
3. **Kvittering**: når vilkårene er bekreftet er det ingen flere dialoger. Kvitteringspanelet viser produkt, nivå, pris, virkningsdato og vilkårsversjon, og gir konkrete neste steg — for Eiendeler «Åpne Eiendeler» og «Legg til første eiendel», som navigerer rett inn i modulen.

For Mynder Core og Leverandørmodul beholdes nivåvalget som første steg (nivået må velges før pris kan bekreftes), men vilkår og kvittering blir identiske med de øvrige produktene.

## Navn: Assets → Eiendeler
«Assets» erstattes av «Eiendeler» i alle norske flater der modulen omtales: produktkortet i Abonnement, modulinfo («Les mer»), MSP-produktfanen, tjenestekatalogen og tilbudsforslagene.

## Teknisk

- **Ny felles hook `useModuleActivation`** (`src/hooks/useModuleActivation.ts`): eier `pendingActivation`-tilstand, kaller `activateModule` + `acceptTerms`, og bygger `ModuleChangeReceipt`. Alle sider bruker denne i stedet for egne handlere.
- **Ny modulregistering `src/lib/moduleActivationTargets.ts`**: per modulnøkkel navn, pris, rute og neste steg (label + rute), slik at kvitteringens lenker er datadrevet og like overalt.
- **`TermsGateDialog`** utvides med valgfri pris-/faktureringslinje slik at den kan brukes som eneste dialog.
- **`src/pages/Subscriptions.tsx`**: `requestActivate`/`reactivateModule` erstattes av hooken; toast byttes ut med kvitteringspanelet. Core-/vendor-flytene gjenbruker samme kvitteringsbygger.
- **`src/components/msp/CustomerServicesAndProductsTab.tsx`**: bruker samme hook slik at partnerflyten er identisk.
- **Navnebytte**: `src/lib/moduleInfo.ts`, `src/lib/offerSuggestions.ts`, `src/pages/Subscriptions.tsx`, `src/components/msp/CustomerModulesTab.tsx`, `src/components/msp/MSPServiceCatalogTab.tsx`, `src/components/msp/guidance/RegulationsStatusCard.tsx`.

Ingen databaseendringer. Vilkårsaksept lagres som i dag via `useTerms` med kontekst `module_activation`.
