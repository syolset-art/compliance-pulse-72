// Felles kilde for partnerens rådgivningstimer ved regelverksaktivering.
// Verdien deles med oppstartskost-innstillingen i produktlisten
// (lagringsnøkkel msp.productSetupHours, produkt-id "frameworks").

import { FRAMEWORK_ACTIVATION_HOURS } from "./offerCoverage";

const LS_SETUP_HOURS = "msp.productSetupHours";

export function readProductSetupHours(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_SETUP_HOURS);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** Timer partneren har valgt å inkludere når et regelverk aktiveres. 0 = av. */
export function getFrameworkActivationHours(): number {
  const h = readProductSetupHours()["frameworks"] ?? 0;
  return Number.isFinite(h) && h > 0 ? h : 0;
}

/** Standardtimer når partneren slår på rådgivning ved aktivering. */
export function defaultFrameworkActivationHours(): number {
  return FRAMEWORK_ACTIVATION_HOURS;
}
