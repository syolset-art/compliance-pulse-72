import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import {
  EVIDENCE_STATUS_CONFIG,
  EVIDENCE_STATUS_ORDER,
  normalizeEvidenceStatus,
  type EvidenceStatus,
} from "@/lib/evidenceStatus";
import { cn } from "@/lib/utils";

interface Props {
  status: EvidenceStatus | string | null | undefined;
  className?: string;
}

/**
 * Horisontal status-stige for dokumentkort og ferdig-skjerm.
 * Viser hvilke steg som er nådd og hva som gjenstår.
 */
export function EvidenceProgress({ status, className }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const current = normalizeEvidenceStatus(status);
  const currentIdx = EVIDENCE_STATUS_ORDER.indexOf(current);

  return (
    <ol
      className={cn("flex items-center gap-1 flex-wrap", className)}
      aria-label={isNb ? "Bevisstatus" : "Evidence status"}
    >
      {EVIDENCE_STATUS_ORDER.map((step, idx) => {
        const cfg = EVIDENCE_STATUS_CONFIG[step];
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const pending = idx > currentIdx;
        const Icon = cfg.icon;
        return (
          <li key={step} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                done && "bg-success/10 text-success border-success/30",
                active && "bg-primary/10 text-primary border-primary/40 ring-2 ring-primary/20",
                pending && "bg-muted text-muted-foreground border-border/60",
              )}
              aria-current={active ? "step" : undefined}
              title={isNb ? cfg.descriptionNb : cfg.descriptionEn}
            >
              {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              {isNb ? cfg.labelNb : cfg.labelEn}
            </span>
            {idx < EVIDENCE_STATUS_ORDER.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-3",
                  idx < currentIdx ? "bg-success/40" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
