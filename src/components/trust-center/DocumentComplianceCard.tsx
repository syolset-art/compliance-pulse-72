import { useMemo } from "react";
import { CheckCircle2, Clock, AlertTriangle, Info, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeDocumentCompliance, type ComplianceState } from "@/lib/documentCompliance";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<ComplianceState, {
  bg: string; text: string; border: string; Icon: typeof CheckCircle2;
  labelNb: string; labelEn: string;
}> = {
  compliant:   { bg: "bg-success/10",     text: "text-success",     border: "border-success/30",     Icon: CheckCircle2,  labelNb: "I tråd",          labelEn: "In compliance" },
  review_soon: { bg: "bg-warning/10",     text: "text-warning",     border: "border-warning/30",     Icon: Clock,         labelNb: "Bør oppdateres",  labelEn: "Should be updated" },
  out_of_date: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30", Icon: AlertTriangle, labelNb: "Må oppdateres",   labelEn: "Must be updated" },
};

interface Props {
  doc: {
    document_type: string;
    valid_from?: string | null;
    valid_to?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    reviewed_at?: string | null;
    reviewed_by_name?: string | null;
    status?: string | null;
  };
  isNb: boolean;
  onUploadNewVersion: () => void;
  onMarkReviewed: () => void;
  markingReviewed?: boolean;
}

export function DocumentComplianceCard({ doc, isNb, onUploadNewVersion, onMarkReviewed, markingReviewed }: Props) {
  const result = useMemo(() => computeDocumentCompliance(doc), [doc]);
  if (!result.show) return null;

  const style = STATE_STYLES[result.state];
  const Icon = style.Icon;
  const label = isNb ? style.labelNb : style.labelEn;
  const reason = isNb ? result.reasonNb : result.reasonEn;

  const reviewedLine = doc.reviewed_at
    ? (isNb
        ? `Sist gjennomgått${doc.reviewed_by_name ? ` av ${doc.reviewed_by_name}` : ""} ${new Date(doc.reviewed_at).toLocaleDateString("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric" })}`
        : `Last reviewed${doc.reviewed_by_name ? ` by ${doc.reviewed_by_name}` : ""} ${new Date(doc.reviewed_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`)
    : null;

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("rounded-lg border p-3 space-y-2", style.bg, style.border)}
    >
      <div className="flex items-start gap-2.5">
        <Icon aria-hidden="true" className={cn("h-4 w-4 mt-0.5 shrink-0", style.text)} />
        <div className="min-w-0 flex-1">
          <div className={cn("text-sm font-medium", style.text)}>{label}</div>
          <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{reason}</p>
          {reviewedLine && (
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info aria-hidden="true" className="h-3 w-3" />
              {reviewedLine}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 italic">
            {isNb ? "Rådgivende – påvirker ikke Trust Score." : "Advisory – does not affect Trust Score."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={onUploadNewVersion}>
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          {isNb ? "Last opp ny versjon" : "Upload new version"}
        </Button>
        {result.canMarkReviewed && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1"
            onClick={onMarkReviewed}
            disabled={markingReviewed}
          >
            <RefreshCw aria-hidden="true" className={cn("h-3.5 w-3.5", markingReviewed && "animate-spin")} />
            {isNb ? "Marker som gjennomgått" : "Mark as reviewed"}
          </Button>
        )}
      </div>
    </div>
  );
}
