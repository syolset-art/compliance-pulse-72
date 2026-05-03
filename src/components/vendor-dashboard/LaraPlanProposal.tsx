import { useState } from "react";
import { Sparkles, Mail, Calendar, FileSearch, CheckCircle2, HelpCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LaraPlanClarifyDialog, type ClarifyAnswer } from "./LaraPlanClarifyDialog";

export type ProposalChannel = "email" | "meeting" | "audit" | "review";
export type ProposalPriority = "critical" | "high" | "medium";

export interface PlanProposal {
  id: string;
  titleNb: string;
  titleEn: string;
  rationaleNb: string;
  rationaleEn: string;
  channel: ProposalChannel;
  priority: ProposalPriority;
  affectedVendors: string[];
  needsClarification?: {
    questionNb: string;
    questionEn: string;
    placeholder?: string;
    /** When true, render a picker of platform users (with option to invite new). */
    requiresUser?: boolean;
  };
}

interface LaraPlanProposalProps {
  isNb: boolean;
  proposals: PlanProposal[];
  estimatedScoreLift: number;
  estimatedWeeks: number;
  onApprove: (selected: PlanProposal[], clarifications: Record<string, ClarifyAnswer>) => void;
}

const channelIcon: Record<ProposalChannel, typeof Mail> = {
  email: Mail,
  meeting: Calendar,
  audit: FileSearch,
  review: FileSearch,
};

const channelLabel = (c: ProposalChannel, isNb: boolean) => {
  const map: Record<ProposalChannel, { nb: string; en: string }> = {
    email: { nb: "E-post", en: "Email" },
    meeting: { nb: "Møte", en: "Meeting" },
    audit: { nb: "Revisjon", en: "Audit" },
    review: { nb: "Gjennomgang", en: "Review" },
  };
  return isNb ? map[c].nb : map[c].en;
};

const priorityChip = (p: ProposalPriority, isNb: boolean) => {
  const map: Record<ProposalPriority, { label: { nb: string; en: string }; cls: string }> = {
    critical: {
      label: { nb: "Kritisk", en: "Critical" },
      cls: "bg-destructive/15 text-destructive border-destructive/30",
    },
    high: {
      label: { nb: "Høy", en: "High" },
      cls: "bg-warning/15 text-warning border-warning/30",
    },
    medium: {
      label: { nb: "Medium", en: "Medium" },
      cls: "bg-muted text-muted-foreground border-border",
    },
  };
  return { label: isNb ? map[p].label.nb : map[p].label.en, cls: map[p].cls };
};

export function LaraPlanProposal({
  isNb,
  proposals,
  estimatedScoreLift,
  estimatedWeeks,
  onApprove,
}: LaraPlanProposalProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(proposals.map((p) => p.id))
  );
  const [clarifyOpen, setClarifyOpen] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedProposals = proposals.filter((p) => selected.has(p.id));
  const needsAnyClarify = selectedProposals.some((p) => p.needsClarification);

  const handleApproveAll = () => {
    if (needsAnyClarify) {
      setClarifyOpen(true);
    } else {
      onApprove(selectedProposals, {});
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isNb ? "Laras forslag til oppfølgingsplan" : "Lara's suggested follow-up plan"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNb
                ? `Basert på resultatene foreslår jeg ${proposals.length} tiltak. Estimert effekt: +${estimatedScoreLift}% portefølje-score over ${estimatedWeeks} uker.`
                : `Based on results I suggest ${proposals.length} actions. Estimated impact: +${estimatedScoreLift}% portfolio score over ${estimatedWeeks} weeks.`}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {proposals.map((p, idx) => {
            const Icon = channelIcon[p.channel];
            const prio = priorityChip(p.priority, isNb);
            const isSelected = selected.has(p.id);
            return (
              <label
                key={p.id}
                className={cn(
                  "flex items-start gap-2.5 px-2.5 py-2 rounded-md border cursor-pointer transition-colors",
                  isSelected
                    ? "border-primary/30 bg-background"
                    : "border-border bg-background/50 opacity-60"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggle(p.id)}
                  className="mt-0.5"
                />
                <span className="text-xs font-medium text-muted-foreground tabular-nums mt-0.5">
                  {idx + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {isNb ? p.titleNb : p.titleEn}
                    </span>
                    <Badge variant="outline" className={cn("text-[10px]", prio.cls)}>
                      {prio.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Icon className="h-2.5 w-2.5" />
                      {channelLabel(p.channel, isNb)}
                    </Badge>
                    {p.needsClarification && (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 bg-warning/10 text-warning border-warning/30"
                      >
                        <HelpCircle className="h-2.5 w-2.5" />
                        {isNb ? "Trenger info" : "Needs info"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isNb ? p.rationaleNb : p.rationaleEn}
                  </p>
                  {p.affectedVendors.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                      {isNb ? "Berører" : "Affects"}: {p.affectedVendors.slice(0, 3).join(", ")}
                      {p.affectedVendors.length > 3 && ` +${p.affectedVendors.length - 3}`}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={handleApproveAll} disabled={selected.size === 0} className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isNb ? `Godkjenn (${selected.size})` : `Approve (${selected.size})`}
          </Button>
          {needsAnyClarify && (
            <Button size="sm" variant="outline" onClick={() => setClarifyOpen(true)} className="gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" />
              {isNb ? "Svar på spørsmål først" : "Answer questions first"}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            {isNb ? "Juster" : "Adjust"}
          </Button>
        </div>
      </div>

      <LaraPlanClarifyDialog
        open={clarifyOpen}
        onOpenChange={setClarifyOpen}
        isNb={isNb}
        proposals={selectedProposals.filter((p) => p.needsClarification)}
        onSubmit={(answers) => {
          setClarifyOpen(false);
          onApprove(selectedProposals, answers);
        }}
      />
    </>
  );
}
