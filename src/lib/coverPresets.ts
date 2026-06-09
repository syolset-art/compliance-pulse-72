import auroraViolet from "@/assets/trust-covers/aurora-violet.jpg";
import circuitDeep from "@/assets/trust-covers/circuit-deep.jpg";
import nordicMist from "@/assets/trust-covers/nordic-mist.jpg";

export type CoverPreset = {
  id: string;
  name: { nb: string; en: string };
  url: string;
  /** Hint to caller for overlay strength baseline (0–1). */
  overlay: number;
  /** "dark" → text-on-dark looks great; "light" → softer overlay. */
  tone: "dark" | "light";
};

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: "aurora-violet",
    name: { nb: "Aurora", en: "Aurora" },
    url: auroraViolet,
    overlay: 0.45,
    tone: "dark",
  },
  {
    id: "circuit-deep",
    name: { nb: "Krets", en: "Circuit" },
    url: circuitDeep,
    overlay: 0.4,
    tone: "dark",
  },
  {
    id: "nordic-mist",
    name: { nb: "Nordisk", en: "Nordic" },
    url: nordicMist,
    overlay: 0.35,
    tone: "light",
  },
];

export function getCoverPreset(id?: string | null): CoverPreset | undefined {
  if (!id) return undefined;
  return COVER_PRESETS.find((p) => p.id === id);
}

/** Default fallback overlay when no preset hint is available. */
export const DEFAULT_COVER_OVERLAY = 0.5;
