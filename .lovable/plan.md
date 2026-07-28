## Mål
Partneren skal kunne **avvikle** en tjeneste — ikke bare slette den. Avvikling er en mykere handling: historikken bevares, tjenesten forsvinner fra kundens portal og fra nye tilbud/kampanjer, men eksisterende leveranser og revisjonsspor beholdes. Slett skal fortsatt finnes for tjenester som aldri har vært i bruk.

## Brukerflyt

1. På hver tjeneste i "Mine tjenester" (både rad-visning i `MSPServiceCatalogTab` og `ServiceCard` i suggestion-flyten) legges det til en handling **"Avvikle"** ved siden av rediger/slett.
2. Klikk åpner en enkel bekreftelses­dialog (`RetireServiceDialog`):
   - Viser tjenestenavn + evt. antall aktive leveranser/kampanjer som berøres (hvis vi har tallet tilgjengelig, ellers utelates linjen).
   - Valgfritt felt **"Årsak"** (fritekst, brukes i audit-loggen).
   - Valgfritt felt **"Erstattes av"** (velg annen tjeneste fra katalogen) — hjelper Lara å foreslå oppgradering til eksisterende kunder senere.
   - Primærknapp **"Avvikle tjeneste"**, sekundær "Avbryt".
3. Etter bekreftelse:
   - Tjenesten får `status: "retired"`, `retiredAt`, `retiredReason?`, `replacedById?`.
   - `publishedToCustomers` settes automatisk til `false`.
   - Toast **"Tjenesten er avviklet — Angre"** (undo gjenoppretter forrige status).
4. Avviklede tjenester:
   - Skjules fra standardlisten "Mine tjenester" og fra kundeportalen.
   - Filtreres bort fra Gap-analyse-forslag og kampanje­wizard.
   - Vises i en sammenslått **"Avviklet (n)"**-seksjon nederst i katalogen — kompakt liste med navn, dato, årsak og en **"Gjenopprett"**-knapp.
5. **Slett** beholdes som separat handling og anbefales bare hvis tjenesten aldri har vært brukt; ellers fremhever dialogen at avvikling er tryggere.

## Teknisk

**Datamodell** (`src/lib/serviceCatalog.ts` og lokal `ExtraService` i `MSPServiceCatalogTab.tsx`):
```ts
status?: "active" | "retired";   // default "active"
retiredAt?: string;              // ISO
retiredReason?: string;
replacedById?: string;
```

**Nye/endrede filer:**
- `src/lib/serviceCatalog.ts` — utvid `PartnerService` med feltene over.
- `src/components/msp/MSPServiceCatalogTab.tsx` — utvid `ExtraService`, legg til `retireExtra`/`restoreExtra`, filtrer aktive vs avviklede, ny "Avviklet"-seksjon, ny handlingsknapp i raden.
- `src/components/msp/RetireServiceDialog.tsx` (ny) — bekreftelses­dialog med årsak + "erstattes av".
- `src/components/msp/ServiceCard.tsx` — legg til `onRetire?` action i action-raden (ikon: `Archive` fra lucide), synlig når tjenesten er aktiv.
- `src/components/msp/ServiceTableRow.tsx` — legg til "Avvikle tjeneste"-knapp ved siden av "Slett tjeneste"; hvis `status === "retired"` vises "Gjenopprett" i stedet.
- Filtrering: `GapAnalysisWizardDialog`, `CampaignWizardDialog` og eventuelle kundeportal-visninger skal ignorere tjenester med `status === "retired"` (én-linjes filter der listen bygges).

**Playbook-alignment:** Legges inn som ny AC-14 i `playbooks/partner-etablerer-tjenestekatalog.md` ("Avvikling og gjenoppretting") + status "Missing → Covered" i `.gap.md`, og en `test.skip` i `e2e/partner-etablerer-tjenestekatalog.spec.ts`.

## Avgrensning

Ingen backend-endringer nå — feltene lagres i eksisterende lokal state slik resten av katalogen. Persistens i Lovable Cloud kan legges til når tjenestekatalogen migreres til DB (samme runde som versjonering, AC-11).
