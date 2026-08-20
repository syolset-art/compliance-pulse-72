import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, Check, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { USAGE_TAGS } from "@/lib/vendorContextSuggestion";
import { LaraIcon } from "@/components/agents/LaraIcon";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { cn } from "@/lib/utils";

interface Props {
  isNb: boolean;
  purpose: string;
  tags: string[];
  suggestedText: string;
  suggestedTags?: string[];
  suggesting?: boolean;
  saraInstalled?: boolean;
  onSavePurpose: (value: string) => void;
  onToggleTag: (value: string) => void;
  onSuggest: () => void;
}

const tagLabel = (value: string, isNb: boolean) => {
  const t = USAGE_TAGS.find((x) => x.value === value);
  return t ? (isNb ? t.labelNb : t.labelEn) : value;
};

export const VendorPurposeCard = ({
  isNb, purpose, tags, suggestedText, suggestedTags = [], suggesting, saraInstalled,
  onSavePurpose, onToggleTag, onSuggest,
}: Props) => {
  const [draft, setDraft] = useState(purpose);
  const [editing, setEditing] = useState(false);

  useEffect(() => { setDraft(purpose); }, [purpose]);

  const hasValues = Boolean(purpose.trim()) || tags.length > 0;
  const proposalTags = tags.length > 0 ? tags : suggestedTags;
  const proposalText = purpose.trim() || suggestedText;

  const approve = () => {
    if (!purpose.trim() && suggestedText) onSavePurpose(suggestedText);
    if (tags.length === 0) suggestedTags.forEach((t) => onToggleTag(t));
  };

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[13px] font-medium text-foreground">
        {isNb ? "Hva brukes leverandøren til?" : "What is this vendor used for?"}
      </span>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={saraInstalled ? undefined : onSuggest}
              disabled={suggesting}
              className="ml-auto inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={saraInstalled ? "Sara" : "Lara"}
            >
              {suggesting
                ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                : saraInstalled ? <SaraIcon size={18} /> : <LaraIcon size={18} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[240px] text-[12px]">
            {saraInstalled
              ? (isNb
                  ? "Kartlagt lokalt av Sara og allerede bekreftet av deg."
                  : "Mapped locally by Sara and already confirmed by you.")
              : (isNb
                  ? "Lara har foreslått dette – godkjenn eller rediger."
                  : "Lara suggested this – approve or edit.")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  // ---- Editing state: full palette + free text
  if (editing) {
    return (
      <Card>
        <CardContent className="space-y-2.5 p-3">
          {header}
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
                      : "border-border text-muted-foreground hover:bg-accent",
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

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[12px]"
              onClick={() => { if (draft !== purpose) onSavePurpose(draft); setEditing(false); }}
            >
              {isNb ? "Ferdig" : "Done"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Confirmed (Sara installed, or user already approved)
  const confirmed = saraInstalled || hasValues;

  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        {header}

        {proposalTags.length > 0 && (
          <p className="text-[12px] text-muted-foreground">
            {proposalTags.map((t) => tagLabel(t, isNb)).join(" · ")}
          </p>
        )}

        {proposalText ? (
          <p className="text-[13px] leading-snug text-foreground">{proposalText}</p>
        ) : (
          <p className="text-[13px] italic text-muted-foreground">
            {isNb ? "Ingen beskrivelse ennå." : "No description yet."}
          </p>
        )}

        <div className="flex items-center gap-3 pt-0.5">
          {confirmed ? (
            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
              <Check className="h-3 w-3 text-primary" />
              {saraInstalled
                ? (isNb ? "Bekreftet via Sara" : "Confirmed via Sara")
                : (isNb ? "Bekreftet" : "Confirmed")}
            </span>
          ) : (
            <Button
              size="sm"
              className="h-6 gap-1 px-2.5 text-[12px]"
              disabled={!proposalText && proposalTags.length === 0}
              onClick={approve}
            >
              <Check className="h-3 w-3" />
              {isNb ? "Godkjenn" : "Approve"}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            {isNb ? "Rediger" : "Edit"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
