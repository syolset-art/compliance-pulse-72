/**
 * Felles register over produktene som kan aktiveres.
 * Brukes av aktiveringsflyten slik at navn, pris og «neste steg»
 * er identiske uansett hvor produktet aktiveres fra.
 */

export interface ModuleNextStep {
  label: string;
  description?: string;
  /** Rute brukeren sendes til. */
  route: string;
}

export interface ModuleActivationTarget {
  /** Modulnøkkel i moduleActivationState. */
  key: string;
  title: string;
  /** Hovedrute inn i modulen. */
  route: string;
  /** Fast månedspris (eks. mva). Nivåbaserte moduler sender pris eksplisitt. */
  monthlyPriceKr?: number;
  nextSteps: ModuleNextStep[];
}

export const MODULE_ACTIVATION_TARGETS: Record<string, ModuleActivationTarget> = {
  core: {
    key: "core",
    title: "Mynder Core",
    route: "/systems",
    nextSteps: [
      { label: "Åpne Mynder Core", description: "Se oppgaver, avvik og samsvar.", route: "/systems" },
      { label: "Legg til systemer", description: "Kartlegg systemene dere bruker.", route: "/systems" },
    ],
  },
  vendors: {
    key: "vendors",
    title: "Leverandørmodul",
    route: "/vendors",
    nextSteps: [
      { label: "Åpne Leverandørmodulen", description: "Se leverandørregisteret.", route: "/vendors" },
      { label: "Legg til første leverandør", description: "Start med de mest kritiske.", route: "/vendors" },
    ],
  },
  assets: {
    key: "assets",
    title: "Eiendeler",
    route: "/assets",
    monthlyPriceKr: 690,
    nextSteps: [
      { label: "Åpne Eiendeler", description: "Se registeret over systemer og eiendeler.", route: "/assets" },
      { label: "Legg til første eiendel", description: "Registrer en eiendel eller importer fra Excel.", route: "/assets?add=1" },
    ],
  },
  frameworks: {
    key: "frameworks",
    title: "Regelverk",
    route: "/compliance",
    nextSteps: [
      { label: "Åpne Regelverk", description: "Se kontrollområder og krav.", route: "/compliance" },
      { label: "Velg regelverk", description: "Aktiver regelverkene som gjelder dere.", route: "/compliance" },
    ],
  },
  // V2 — IKKE IMPLEMENTER NÅ: Trust Center er planlagt som eget produkt i v2.
  // Behold targeten for fremtidig referanse, men ikke aktiver den i prototype.
  trust: {
    key: "trust",
    title: "Trust Center",
    route: "/trust-center/profile",
    nextSteps: [
      { label: "Åpne Trust Center", description: "Fyll ut og del tillitsprofilen.", route: "/trust-center/profile" },
      { label: "Del profilen", description: "Lag en delbar lenke til kunder.", route: "/trust-center/profile" },
    ],
  },

  partner: {
    key: "partner",
    title: "Partnerarbeidsflate",
    route: "/msp-dashboard",
    nextSteps: [
      { label: "Åpne partnerarbeidsflaten", description: "Se kundene deres.", route: "/msp-dashboard" },
    ],
  },
};

export function getActivationTarget(key: string, fallbackTitle?: string): ModuleActivationTarget {
  return (
    MODULE_ACTIVATION_TARGETS[key] ?? {
      key,
      title: fallbackTitle ?? key,
      route: "/",
      nextSteps: [],
    }
  );
}
