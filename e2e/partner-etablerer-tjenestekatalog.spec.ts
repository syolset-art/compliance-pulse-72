import { test, expect } from "@playwright/test";

/**
 * Playbook: Partner etablerer og forvalter tjenestekatalog (v0.2)
 * Kilde: https://app.notion.com/p/Partner-etablerer-og-forvalter-tjenestekatalog-3ab979e47191819dbf76c550904418c3
 * Spec-speil: playbooks/partner-etablerer-tjenestekatalog.md
 * Gap-rapport: playbooks/partner-etablerer-tjenestekatalog.gap.md
 *
 * Én test per akseptansekriterium (AC-01…AC-13). Alle er `.skip` inntil
 * tilhørende `data-testid`-ankere finnes i UI-et og AC-et er implementert.
 * Fjern `.skip` etter hvert som funksjonaliteten kommer på plass.
 */

const CATALOG_URL = "/msp-service-catalog";

test.describe("Partner etablerer og forvalter tjenestekatalog", () => {
  test.skip("AC-01 Partner kan importere, velge mal eller opprette fra null", async ({ page }) => {
    await page.goto(CATALOG_URL);
    const entry = page.getByTestId("service-add-entry");
    await entry.click();
    await expect(page.getByTestId("service-add-import")).toBeVisible();
    await expect(page.getByTestId("service-add-template")).toBeVisible();
    await expect(page.getByTestId("service-add-blank")).toBeVisible();
  });

  test.skip("AC-02 Normalisert tjenestekort kan ses og redigeres", async ({ page }) => {
    await page.goto(CATALOG_URL);
    const firstCard = page.getByTestId(/^service-card-/).first();
    await expect(firstCard).toBeVisible();
    // Kortet skal minst eksponere navn, opprinnelse, status, mapping-antall.
  });

  test.skip("AC-03 Aktive tjenester har minst én godkjent kravkobling", async ({ page }) => {
    await page.goto(CATALOG_URL);
    // Aktiveringsknappen skal være disabled til en godkjent mapping finnes.
  });

  test.skip("AC-04 AI-forslag kan godkjennes, redigeres og avvises enkeltvis", async ({ page }) => {
    await page.goto(CATALOG_URL);
    const suggestion = page.getByTestId(/^lara-suggestion-/).first();
    await expect(suggestion).toBeVisible();
    // Hver suggestion skal ha aksept/rediger/avvis + vedtak logges.
  });

  test.skip("AC-05 Mapping viser relasjonstype, begrunnelse, scope, kildeversjon og status", async ({ page }) => {
    await page.goto(CATALOG_URL);
    // Åpne en tjeneste, verifiser mapping-list metadata.
  });

  test.skip("AC-06 Katalogen kan bygges uten kundedata", async ({ page }) => {
    await page.goto(CATALOG_URL);
    await expect(page.getByTestId("service-catalog-root")).toBeVisible();
    // Ingen kundevelger, ingen kundegap i denne flyten.
  });

  test.skip("AC-07 Systemet viser ikke kundespesifikke gap i katalogflyten", async ({ page }) => {
    await page.goto(CATALOG_URL);
    // Ingen elementer som eksponerer per-kunde gap skal finnes.
  });

  test.skip("AC-08 Partner kan skille eksisterende, foreslåtte og Mynder-støttede tjenester", async ({ page }) => {
    await page.goto(CATALOG_URL);
    // Tjenestekort skal ha synlig opprinnelses-badge.
  });

  test.skip("AC-09 Ny tjenestemulighet viser nødvendige kapabiliteter før aktivering", async ({ page }) => {
    await page.goto(CATALOG_URL);
    // Forslag skal liste forutsetninger + blokkere aktivering ved manglende kapasitet.
  });

  test.skip("AC-10 Aktiv katalog gjenbrukes i skanner, gap-analyse og tilbud med versjons-lås", async ({ page }) => {
    // Krysser flere flyter; utvid når tjenesteskanner har egen spec.
  });

  test.skip("AC-11 Endringer er versjonerte, søkbare og reversible", async ({ page }) => {
    await page.goto(CATALOG_URL);
    // Endre en tjeneste, verifiser at tidligere versjon fortsatt kan hentes frem.
  });

  test.skip("AC-12 RBAC og tenant-isolasjon håndheves i katalog-UI", async ({ page }) => {
    // Logg inn som ikke-admin, verifiser at aktiver/deaktiver er skjult eller disabled.
  });

  test.skip("AC-13 Lagring, feiltilstander og audit trail er verifisert", async ({ page }) => {
    // Endring skal produsere audit-entry (persistert), og feilende lagring skal vises i UI.
  });
});
