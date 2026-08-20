import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, Sparkles } from "lucide-react";
import { USAGE_TAGS } from "@/lib/vendorContextSuggestion";
import { cn } from "@/lib/utils";

interface Props {
  isNb: boolean;
  purpose: string;
  tags: string[];
  suggestedText: string;
  suggesting?: boolean;
  onSavePurpose: (value: string) => void;
  onToggleTag: (value: string) => void;
  onSuggest: () => void;
}

export const VendorPurposeCard = ({
  isNb, purpose, tags, suggestedText, suggesting, onSavePurpose, onToggleTag, onSuggest,
}: Props) => {
  const [draft, setDraft] = useState(purpose);

  useEffect(() => { setDraft(purpose); }, [purpose]);

  return (
    <Card>
      <CardContent className="space-y-2.5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[13px] font-medium text-foreground">
            {isNb ? "Hva brukes leverandøren til?" : "What is this vendor used for?"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-6 gap-1 px-2 text-[12px] text-primary"
            disabled={suggesting}
            onClick={onSuggest}
          >
            <Sparkles className="h-3 w-3" />
            {isNb ? "Foreslå med Lara" : "Suggest with Lara"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {USAGE_TAGS.map((t) => {
            const active = tags.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onToggleTag(t.value)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[12px] transition-colors",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {isNb ? t.labelNb : t.labelEn}
              </button>
            );
          })}
        </div>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { if (draft !== purpose) onSavePurpose(draft); }}
          rows={2}
          className="min-h-[52px] text-[13px] transition-[min-height] focus:min-h-[96px]"
          placeholder={isNb
            ? "Beskriv kort hva leverandøren utfører på vegne av virksomheten …"
            : "Briefly describe what the vendor performs on behalf of the business …"}
        />

        {!draft.trim() && suggestedText && (
          <div className="flex items-start gap-1.5 rounded-md bg-muted/40 p-2 text-[12px] leading-snug text-muted-foreground">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">{suggestedText}</span>
            <button
              type="button"
              onClick={() => { setDraft(suggestedText); onSavePurpose(suggestedText); }}
              className="shrink-0 font-medium text-primary hover:underline"
            >
              {isNb ? "Bruk" : "Use"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
