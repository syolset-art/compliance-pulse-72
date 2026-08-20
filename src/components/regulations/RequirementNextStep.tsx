import { useTranslation } from "react-i18next";
import { Upload, Sparkles, UserPlus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nextStepFor, type WorkItem } from "@/lib/regulationsApprovalQueue";

interface Props {
  item: WorkItem;
  saraInstalled: boolean;
  onUpload: (item: WorkItem) => void;
  onAskSara: (item: WorkItem) => void;
  onCreateTask: (item: WorkItem) => void;
  onAssess: (item: WorkItem) => void;
}

const ICONS = {
  upload: Upload,
  ask_sara: Sparkles,
  create_task: UserPlus,
  assess: HelpCircle,
} as const;

/** Anbefalt neste steg for et krav uten dokumentasjon — ett tydelig valg. */
export function RequirementNextStep({ item, saraInstalled, onUpload, onAskSara, onCreateTask, onAssess }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const step = nextStepFor(item, saraInstalled);
  const Icon = ICONS[step.action];

  const run = () => {
    if (step.action === "upload") onUpload(item);
    else if (step.action === "ask_sara") onAskSara(item);
    else if (step.action === "create_task") onCreateTask(item);
    else onAssess(item);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="min-w-0 flex-1 text-xs text-muted-foreground">{isNb ? step.meaningNb : step.meaningEn}</p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={run}>
          <Icon className="h-3.5 w-3.5" />
          {isNb ? step.labelNb : step.labelEn}
        </Button>
        {step.action !== "assess" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => onAssess(item)}
          >
            {isNb ? "Ikke relevant" : "Not relevant"}
          </Button>
        )}
      </div>
    </div>
  );
}
