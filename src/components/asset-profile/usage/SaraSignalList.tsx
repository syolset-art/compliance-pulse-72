import { Card, CardContent } from "@/components/ui/card";
import { FileText, Hash, Flag, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SaraVendorSignal } from "@/lib/saraVendorMapping";

interface Props {
  isNb: boolean;
  signals: SaraVendorSignal[];
}

const iconFor = (category: SaraVendorSignal["category"]) => {
  if (category === "document") return FileText;
  if (category === "counter") return Hash;
  return Flag;
};

/** Kompakt liste over de ikke-sensitive signalene Sara rapporterte. */
export const SaraSignalList = ({ isNb, signals }: Props) => (
  <Card>
    <CardContent className="space-y-2 p-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium text-foreground">
          {isNb ? "Signalgrunnlag" : "Signal basis"}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={isNb ? "Om signalgrunnlaget" : "About the signal basis"}>
                <Info className="h-3 w-3 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-[12px]">
              {isNb
                ? "Dette er metadataene Sara sendte til Mynder. Dokumentene selv forlot aldri infrastrukturen deres."
                : "This is the metadata Sara sent to Mynder. The documents themselves never left your infrastructure."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="ml-auto text-[12px] text-muted-foreground">
          {signals.length} {isNb ? "signaler" : "signals"}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {signals.map((s) => {
          const Icon = iconFor(s.category);
          return (
            <li key={s.id} className="flex items-start gap-2 py-2">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-foreground">{isNb ? s.labelNb : s.labelEn}</p>
                <p className="text-[12px] text-muted-foreground">{isNb ? s.valueNb : s.valueEn}</p>
                {(s.documentId || s.hash) && (
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {[s.documentId, s.hash].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[12px] text-muted-foreground">{s.confidence}%</span>
            </li>
          );
        })}
      </ul>
    </CardContent>
  </Card>
);
