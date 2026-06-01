import { Button } from "@/components/ui/button";
import { CheckCircle2, Eye, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PublishStickyBarProps {
  readinessPercent: number;
  passedCount: number;
  totalCount: number;
  onPreview: () => void;
  onPublish: () => void;
  /** ISO string — last time profile content was edited */
  lastEditedAt?: string | null;
  /** ISO string — last time profile was published */
  lastPublishedAt?: string | null;
}

export function PublishStickyBar({
  readinessPercent,
  passedCount,
  totalCount,
  onPreview,
  onPublish,
  lastEditedAt,
  lastPublishedAt,
}: PublishStickyBarProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  if (readinessPercent < 80) return null;

  const neverPublished = !lastPublishedAt;
  const hasPendingChanges =
    !!lastEditedAt &&
    (!lastPublishedAt || new Date(lastEditedAt).getTime() > new Date(lastPublishedAt).getTime());

  let statusLabel: string;
  let statusTone: "neutral" | "pending" | "clean";
  let publishLabel: string;

  if (neverPublished) {
    statusLabel = isNb ? "Klar for første publisering" : "Ready for first publish";
    statusTone = "pending";
    publishLabel = isNb ? "Publiser Trust Profile" : "Publish Trust Profile";
  } else if (hasPendingChanges) {
    statusLabel = isNb ? "Endringer ikke publisert enda" : "Unpublished changes";
    statusTone = "pending";
    publishLabel = isNb ? "Publiser siste endringer" : "Publish latest changes";
  } else {
    statusLabel = isNb
      ? "Ingen endringer siden siste publisering"
      : "No changes since last publish";
    statusTone = "clean";
    publishLabel = isNb ? "Publisert" : "Published";
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 z-30">
      <div className="container max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {statusTone === "pending" ? (
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{statusLabel}</p>
            <p className="text-[12px] text-muted-foreground truncate">
              {passedCount}/{totalCount} {isNb ? "områder fylt ut" : "areas completed"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPreview} className="gap-1.5">
            <Eye className="h-4 w-4" />
            {isNb ? "Forhåndsvis" : "Preview"}
          </Button>
          <Button
            size="sm"
            onClick={onPublish}
            disabled={statusTone === "clean"}
            className="gap-1.5"
          >
            {publishLabel}
            {statusTone !== "clean" && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
