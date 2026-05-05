import { Button } from "@/components/ui/button";
import { CheckCircle2, Eye, ArrowRight } from "lucide-react";

interface PublishStickyBarProps {
  readinessPercent: number;
  passedCount: number;
  totalCount: number;
  onPreview: () => void;
  onPublish: () => void;
}

export function PublishStickyBar({ readinessPercent, passedCount, totalCount, onPreview, onPublish }: PublishStickyBarProps) {
  if (readinessPercent < 80) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 z-30">
      <div className="container max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">Klar for publisering</p>
            <p className="text-xs text-muted-foreground">{passedCount}/{totalCount} områder fylt ut</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPreview} className="gap-1.5">
            <Eye className="h-4 w-4" />
            Forhåndsvis
          </Button>
          <Button size="sm" onClick={onPublish} className="gap-1.5">
            Publiser Trust Profile
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
