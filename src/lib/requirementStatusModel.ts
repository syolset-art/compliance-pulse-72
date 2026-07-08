/**
 * Requirement status UI model — orthogonal fremdrift + bevis-tillit.
 * Brukes i regelverk-listen, RequirementCard og VendorControlsTab.
 */
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleSlash,
  Clock,
  FileText,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

export type ProgressStatus =
  | "not_answered"
  | "in_progress"
  | "implemented"
  | "verified"
  | "not_applicable";

export type EvidenceState =
  | "required"
  | "self_reported"
  | "attested"
  | "verified"
  | "revalidation_due"
  | "out_of_scope";

export interface AttestationInfo {
  name: string;
  role: string;
  date: string; // presentert dato-string
}

export interface EvidenceDocument {
  name: string;
  kind: string; // e.g. "PDF", "DOCX", "URL", "Attestasjon"
}

export interface RequirementUiState {
  progress: ProgressStatus;
  evidence: EvidenceState;
  attestedBy?: AttestationInfo;
  evidenceCount?: { collected: number; required: number };
  revalidationDaysLeft?: number;
  documents?: EvidenceDocument[];
}


export interface StatusConfig {
  labelNb: string;
  labelEn: string;
  icon: LucideIcon;
  /** Klassenavn for badge (bg + text + border). Bruker semantiske tokens. */
  badgeClass: string;
  /** Klassenavn for ledende ikon (kun tekstfarge). */
  iconClass: string;
}

export const PROGRESS_CONFIG: Record<ProgressStatus, StatusConfig> = {
  not_answered: {
    labelNb: "Ikke besvart",
    labelEn: "Not answered",
    icon: Circle,
    badgeClass: "bg-muted/60 text-muted-foreground border border-border",
    iconClass: "text-muted-foreground",
  },
  in_progress: {
    labelNb: "Pågår",
    labelEn: "In progress",
    icon: CircleDashed,
    badgeClass: "bg-warning/15 text-warning border border-warning/30",
    iconClass: "text-warning",
  },
  implemented: {
    labelNb: "Implementert",
    labelEn: "Implemented",
    icon: CheckCircle2,
    badgeClass: "bg-primary/10 text-primary border border-primary/30",
    iconClass: "text-primary",
  },
  verified: {
    labelNb: "Verifisert",
    labelEn: "Verified",
    icon: ShieldCheck,
    badgeClass: "bg-success/15 text-success border border-success/30",
    iconClass: "text-success",
  },
  not_applicable: {
    labelNb: "Ikke relevant",
    labelEn: "Not applicable",
    icon: CircleSlash,
    badgeClass: "bg-muted/40 text-muted-foreground border border-border",
    iconClass: "text-muted-foreground",
  },
};

export const EVIDENCE_CONFIG: Record<EvidenceState, StatusConfig> = {
  required: {
    labelNb: "Bevis påkrevd",
    labelEn: "Evidence required",
    icon: FileText,
    badgeClass: "bg-warning/10 text-warning border border-warning/25",
    iconClass: "text-warning",
  },
  self_reported: {
    labelNb: "Egenrapportert",
    labelEn: "Self-reported",
    icon: FileText,
    badgeClass: "bg-muted/60 text-muted-foreground border border-border",
    iconClass: "text-muted-foreground",
  },
  attested: {
    labelNb: "Attestert",
    labelEn: "Attested",
    icon: UserCheck,
    badgeClass: "bg-success/15 text-success border border-success/30",
    iconClass: "text-success",
  },
  verified: {
    labelNb: "Verifisert",
    labelEn: "Verified",
    icon: ShieldCheck,
    badgeClass: "bg-success/15 text-success border border-success/30",
    iconClass: "text-success",
  },
  revalidation_due: {
    labelNb: "Re-attesteres snart",
    labelEn: "Re-attestation due",
    icon: Clock,
    badgeClass: "bg-warning/15 text-warning border border-warning/30",
    iconClass: "text-warning",
  },
  out_of_scope: {
    labelNb: "Utenfor scope",
    labelEn: "Out of scope",
    icon: CircleSlash,
    badgeClass: "bg-muted/40 text-muted-foreground border border-border",
    iconClass: "text-muted-foreground",
  },
};

export const getProgressConfig = (p: ProgressStatus) => PROGRESS_CONFIG[p];
export const getEvidenceConfig = (e: EvidenceState) => EVIDENCE_CONFIG[e];

/** Format bevis-badge label m/ evt. dager til re-attestering. */
export function formatEvidenceLabel(
  state: RequirementUiState,
  isNb: boolean,
): string {
  const cfg = EVIDENCE_CONFIG[state.evidence];
  if (state.evidence === "revalidation_due" && state.revalidationDaysLeft != null) {
    return isNb
      ? `Re-attesteres om ${state.revalidationDaysLeft} d`
      : `Re-attest in ${state.revalidationDaysLeft}d`;
  }
  return isNb ? cfg.labelNb : cfg.labelEn;
}

/** Deterministisk demo-state fra en id-streng. */
export function demoUiStateFor(id: string, seed = 0): RequirementUiState {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const bucket = h % 12;

  switch (bucket) {
    case 0:
    case 1:
      return {
        progress: "verified",
        evidence: "verified",
        attestedBy: {
          name: "Vilde Gjellestad",
          role: "Compliance",
          date: "8. juli 2026",
        },
        evidenceCount: { collected: 18, required: 18 },
      };
    case 2:
      return {
        progress: "verified",
        evidence: "revalidation_due",
        revalidationDaysLeft: 14,
        attestedBy: {
          name: "Ola Nordmann",
          role: "CISO",
          date: "12. jan 2026",
        },
        evidenceCount: { collected: 6, required: 6 },
      };
    case 3:
    case 4:
      return {
        progress: "implemented",
        evidence: "attested",
        attestedBy: {
          name: "Kari Hansen",
          role: "DPO",
          date: "3. juni 2026",
        },
        evidenceCount: { collected: 4, required: 5 },
      };
    case 5:
      return {
        progress: "implemented",
        evidence: "self_reported",
        evidenceCount: { collected: 2, required: 4 },
      };
    case 6:
    case 7:
      return {
        progress: "in_progress",
        evidence: "required",
        evidenceCount: { collected: 1, required: 4 },
      };
    case 8:
    case 9:
      return {
        progress: "not_answered",
        evidence: "required",
      };
    case 10:
      return {
        progress: "not_applicable",
        evidence: "out_of_scope",
      };
    default:
      return {
        progress: "in_progress",
        evidence: "self_reported",
        evidenceCount: { collected: 3, required: 6 },
      };
  }
}

/** Map en legacy "met/partial/not_met"-status til ny UI-modell. */
export function uiStateFromLegacyStatus(
  status: "met" | "partial" | "not_met",
  id: string,
): RequirementUiState {
  if (status === "met") return demoUiStateFor(id, 1); // verified/attested varianter
  if (status === "partial") return demoUiStateFor(id, 5); // in_progress varianter
  return { progress: "not_answered", evidence: "required" };
}
