import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContextPillItem {
  key: string;
  icon: ReactNode;
  label: string;
  value: string;
  toneClass: string;
  panel: ReactNode;
}

interface Props {
  items: ContextPillItem[];
  openKey: string | null;
  onToggle: (key: string) => void;
  /** Render without the surrounding Card (for embedding inside another card) */
  bare?: boolean;
}

export const ContextPillRow = ({ items, openKey, onToggle, bare }: Props) => {
  const active = items.find((i) => i.key === openKey);

  const body = (
    <>
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((item, index) => {
            const isOpen = item.key === openKey;
            const spanFull = items.length % 2 === 1 && index === items.length - 1;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onToggle(item.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                  spanFull && "col-span-2",
                  isOpen ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] text-muted-foreground">{item.label}</span>
                  <span className={cn("block truncate text-[13px] font-semibold", item.toneClass)}>
                    {item.value}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
            );
          })}
        </div>

      {active && (
        <div className="mt-2 space-y-2.5 rounded-lg border border-border bg-muted/30 p-3">
          {active.panel}
        </div>
      )}
    </>
  );

  if (bare) return body;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-2">{body}</CardContent>
    </Card>
  );
};
