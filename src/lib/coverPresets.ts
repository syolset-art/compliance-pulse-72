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

export type CoverColor = {
  id: string;
  name: { nb: string; en: string };
  /** CSS background — solid color or gradient. */
  background: string;
  /** Overlay strength to apply on top for text legibility. */
  overlay: number;
};

export const COVER_COLORS: CoverColor[] = [
  { id: "midnight",  name: { nb: "Midnatt",   en: "Midnight"  }, background: "linear-gradient(135deg, #0e1320 0%, #1a2238 100%)", overlay: 0.25 },
  { id: "purple",    name: { nb: "Lilla",     en: "Purple"    }, background: "linear-gradient(135deg, #2d2640 0%, #4a3f66 100%)", overlay: 0.25 },
  { id: "ocean",     name: { nb: "Hav",       en: "Ocean"     }, background: "linear-gradient(135deg, #0b3d5c 0%, #1e6091 100%)", overlay: 0.25 },
  { id: "forest",    name: { nb: "Skog",      en: "Forest"    }, background: "linear-gradient(135deg, #1b3a2f 0%, #2f6b4f 100%)", overlay: 0.25 },
  { id: "sunset",    name: { nb: "Solnedgang",en: "Sunset"    }, background: "linear-gradient(135deg, #6b2737 0%, #c4554d 100%)", overlay: 0.25 },
  { id: "sand",      name: { nb: "Sand",      en: "Sand"      }, background: "linear-gradient(135deg, #d9c9a3 0%, #b89f6f 100%)", overlay: 0.15 },
  { id: "slate",     name: { nb: "Skifer",    en: "Slate"     }, background: "linear-gradient(135deg, #2a3140 0%, #4a5468 100%)", overlay: 0.25 },
  { id: "graphite",  name: { nb: "Grafitt",   en: "Graphite"  }, background: "linear-gradient(135deg, #1a1a1a 0%, #333333 100%)", overlay: 0.25 },
];

export function getCoverColor(id?: string | null): CoverColor | undefined {
  if (!id) return undefined;
  return COVER_COLORS.find((c) => c.id === id);
}
