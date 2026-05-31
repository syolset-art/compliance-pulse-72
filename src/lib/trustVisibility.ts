import { Lock, Globe2, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TrustVisibility = "ecosystem" | "public";

export const DEFAULT_VISIBILITY: TrustVisibility = "ecosystem";

type Meta = {
  level: TrustVisibility;
  icon: LucideIcon;
  labelNb: string;
  labelEn: string;
  shortNb: string;
  shortEn: string;
  descNb: string;
  descEn: string;
};

export const VISIBILITY_META: Record<TrustVisibility, Meta> = {
  ecosystem: {
    level: "ecosystem",
    icon: Sparkles,
    labelNb: "Mynder-økosystem",
    labelEn: "Mynder ecosystem",
    shortNb: "Økosystem",
    shortEn: "Ecosystem",
    descNb: "Alle innloggede Mynder-brukere kan se profilen uten å be om tilgang — kunder, partnere og leverandører i nettverket.",
    descEn: "All signed-in Mynder users can view the profile without requesting access — customers, partners and vendors in the network.",
  },
  public: {
    level: "public",
    icon: Globe2,
    labelNb: "Offentlig",
    labelEn: "Public",
    shortNb: "Offentlig",
    shortEn: "Public",
    descNb: "Indeksert URL, åpen for alle på internett. Bekreft at innholdet er klarert for offentlig deling.",
    descEn: "Indexed URL, open to everyone on the internet. Confirm content is approved for public sharing.",
  },
};

export const ALL_VISIBILITY_LEVELS: TrustVisibility[] = ["ecosystem", "public"];

export function getVisibilityFromAsset(asset: { publish_mode?: string | null } | null | undefined): TrustVisibility {
  const v = asset?.publish_mode;
  if (v === "ecosystem" || v === "public") return v;
  // legacy "private" values map to ecosystem
  return DEFAULT_VISIBILITY;
}

export function isPubliclyAccessible(asset: { publish_mode?: string | null } | null | undefined): boolean {
  return getVisibilityFromAsset(asset) === "public";
}
