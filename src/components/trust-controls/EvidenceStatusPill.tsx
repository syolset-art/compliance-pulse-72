import { useTranslation } from "react-i18next";
import {
  EVIDENCE_STATUS_CONFIG,
  normalizeEvidenceStatus,
  type EvidenceStatus,
} from "@/lib/evidenceStatus";
import { cn } from "@/lib/utils";

interface EvidenceStatusPillProps {
  status: EvidenceStatus | string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Pill for opptjent bevisstatus (uploaded/classified/confirmed/attested/verified).
 * Distinkt fra EvidenceStatusBadge (fresh/stale/expired/missing).
 * Bruker etikett + ikon (aldri farge alene) for WCAG AA.
 */
export function EvidenceStatusPill({ status, size = "md", className }: EvidenceStatusPillProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const normalized = normalizeEvidenceStatus(status);
  const cfg = EVIDENCE_STATUS_CONFIG[normalized] ?? EVIDENCE_STATUS_CONFIG.uploaded;
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        cfg.badgeClass,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
      title={isNb ? cfg.descriptionNb : cfg.descriptionEn}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {isNb ? cfg.labelNb : cfg.labelEn}
    </span>
  );
}
