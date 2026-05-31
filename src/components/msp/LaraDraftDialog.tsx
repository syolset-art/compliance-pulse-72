import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, CheckCircle2, Pencil, X } from "lucide-react";

export interface LaraDraftContent {
  title: string;
  fileName: string;
  summary: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: LaraDraftContent | null;
  contextLabel?: string;
  onUseAsEvidence: () => void;
  onReject?: () => void;
}

export const LaraDraftDialog = ({
  open,
  onOpenChange,
  draft,
  contextLabel,
  onUseAsEvidence,
  onReject,
}: Props) => {
  if (!draft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Utkast fra Lara
          </DialogTitle>
          <DialogDescription>
            Lara har generert et utkast du kan bruke direkte som bevis, redigere eller avvise.
            {contextLabel && (
              <span className="block mt-1 text-foreground/80">{contextLabel}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-3.5 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{draft.title}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{draft.fileName}</p>
            </div>
            <Badge variant="outline" className="text-xs gap-1 shrink-0">
              <Sparkles className="h-3 w-3" />
              Generert
            </Badge>
          </div>
          <div className="p-4 space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Innhold</p>
            <ul className="space-y-1.5">
              {draft.summary.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="pt-2 text-xs text-muted-foreground italic border-t border-border/60">
              Lara · {new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onReject?.();
              onOpenChange(false);
            }}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Avvis
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <Pencil className="h-3.5 w-3.5" />
            Rediger
          </Button>
          <Button
            onClick={() => {
              onUseAsEvidence();
              onOpenChange(false);
            }}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            Bruk som bevis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
