import { Mail, Phone, Users, PenLine, type LucideIcon } from "lucide-react";
import type { ActivityType, Phase, ActivityLevel } from "./vendorActivityData";
import type { SuggestedActivity } from "./vendorGuidanceData";
import { LARA_EMAIL_SUGGESTIONS } from "./laraEmailSuggestions";

export type Criticality = "lav" | "medium" | "hoy" | "kritisk";
export type Theme = "dpa" | "infosec" | "sla" | "okonomi" | "hendelse" | "revisjon" | "generell";

export interface LaraActivitySuggestion {
  id: string;
  source: "email" | "guidance";
  type: ActivityType;
  phase: Phase;
  level: ActivityLevel;
  theme: Theme;
  criticality: Criticality;
  titleNb: string;
  titleEn: string;
  bodyNb: string;
  bodyEn: string;
  reasonNb: string;
  reasonEn: string;
  gapId?: string;
}

export const TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  email: Mail,
  phone: Phone,
  meeting: Users,
  manual: PenLine,
  document: PenLine,
  risk: PenLine,
  incident: PenLine,
  assignment: PenLine,
  review: PenLine,
  delivery: PenLine,
  maturity: PenLine,
  setting: PenLine,
  upload: PenLine,
  view: PenLine,
};

const themeFromString = (s: string): Theme => {
  const t = s.toLowerCase();
  if (t.includes("dpa") || t.includes("personvern") || t.includes("privacy")) return "dpa";
  if (t.includes("sla") || t.includes("leveranse") || t.includes("delivery")) return "sla";
  if (t.includes("revisjon") || t.includes("audit")) return "revisjon";
  if (t.includes("hendelse") || t.includes("incident")) return "hendelse";
  if (t.includes("informasjon") || t.includes("infosec") || t.includes("security")) return "infosec";
  if (t.includes("økonomi") || t.includes("finance")) return "okonomi";
  return "generell";
};

export function buildLaraSuggestions(prefill?: SuggestedActivity): LaraActivitySuggestion[] {
  const fromEmail: LaraActivitySuggestion[] = LARA_EMAIL_SUGGESTIONS.map((s) => ({
    id: s.id,
    source: "email",
    type: "email",
    phase: "ongoing",
    level: s.level,
    theme: s.theme,
    criticality: s.criticality,
    titleNb: s.titleNb,
    titleEn: s.titleEn,
    bodyNb: s.bodyNb,
    bodyEn: s.bodyEn,
    reasonNb: s.reasonNb,
    reasonEn: s.reasonEn,
  }));

  const fromGuidance: LaraActivitySuggestion[] = prefill
    ? [
        {
          id: `guidance-${prefill.id}`,
          source: "guidance",
          type: prefill.suggestedType,
          phase: prefill.suggestedPhase,
          level: prefill.level,
          theme: themeFromString(prefill.themeNb),
          criticality: prefill.criticality as Criticality,
          titleNb: prefill.titleNb,
          titleEn: prefill.titleEn,
          bodyNb: prefill.descriptionNb,
          bodyEn: prefill.descriptionEn,
          reasonNb: prefill.reasonNb,
          reasonEn: prefill.reasonEn,
          gapId: prefill.gapId,
        },
      ]
    : [];

  // Guidance first (most relevant), then Lara email suggestions
  return [...fromGuidance, ...fromEmail];
}

/** Heuristikk: utled type/tema/kritikalitet fra fritekst-tittel for "skriv egen". */
export function inferFromTitle(title: string): {
  type?: ActivityType;
  theme?: Theme;
  level?: ActivityLevel;
  criticality?: Criticality;
} {
  const t = title.toLowerCase().trim();
  if (!t) return {};
  const out: ReturnType<typeof inferFromTitle> = {};

  // type
  if (/\b(e-?post|epost|mail|sendt til|svar fra)\b/.test(t)) out.type = "email";
  else if (/\b(ringt|telefon|samtale|call)\b/.test(t)) out.type = "phone";
  else if (/\b(møte|meeting|workshop|gjennomgang med)\b/.test(t)) out.type = "meeting";

  // theme
  out.theme = themeFromString(t);

  // criticality
  if (/\b(kritisk|brudd|hendelse|nedetid|breach|incident)\b/.test(t)) out.criticality = "kritisk";
  else if (/\b(forfalt|påminnelse|avvik|klage|escalat)\b/.test(t)) out.criticality = "hoy";

  // level
  if (/\b(strategi|kontrakt|fornyelse|leverandørbytte)\b/.test(t)) out.level = "strategisk";
  else if (/\b(revisjon|audit|kvartals|risikovurdering)\b/.test(t)) out.level = "taktisk";
  else if (out.type) out.level = "operasjonelt";

  return out;
}
