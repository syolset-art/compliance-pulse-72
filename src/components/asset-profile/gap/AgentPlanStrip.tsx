import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Props {
  total: number;
  byKind: { documents: number; policies: number; followUps: number; other: number };
  onReviewOne: () => void;
  onBulkConfirmDocuments: () => void;
}

export function AgentPlanStrip({
  total,
  byKind,
  onReviewOne,
  onBulkConfirmDocuments,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  if (total === 0) return null;

  const parts: string[] = [];
  if (byKind.documents)
    parts.push(
      `${byKind.documents} ${isNb ? "dokumentforespørsler" : "document requests"}`
    );
  if (byKind.policies)
    parts.push(
      `${byKind.policies} ${isNb ? "policy-utkast" : "policy drafts"}`
    );
  if (byKind.followUps)
    parts.push(
      `${byKind.followUps} ${isNb ? "oppfølginger" : "follow-ups"}`
    );
  if (byKind.other)
    parts.push(`${byKind.other} ${isNb ? "andre" : "other"}`);

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Sparkles className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="text-xs text-foreground">
          <span className="font-medium">
            {isNb
              ? `Lara har ${total} forslag klare`
              : `Lara has ${total} suggestions ready`}
          </span>
          {parts.length > 0 && (
            <span className="text-muted-foreground"> · {parts.join(", ")}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1.5 sm:shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5"
          onClick={onReviewOne}
        >
          <ArrowRight className="h-3 w-3" />
          {isNb ? "Gjennomgå én etter én" : "Review one by one"}
        </Button>
        {byKind.documents > 0 && (
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onBulkConfirmDocuments();
              toast.success(
                isNb
                  ? `${byKind.documents} dokumentforespørsler sendt`
                  : `${byKind.documents} document requests sent`
              );
            }}
          >
            {isNb
              ? "Bekreft alle dokumentforespørsler"
              : "Confirm all document requests"}
          </Button>
        )}
      </div>
    </div>
  );
}
