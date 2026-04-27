import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Lock, AlertTriangle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { frameworks, categories, type Framework } from "@/lib/frameworkDefinitions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditActiveFrameworksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFrameworkIds: Set<string>;
  onToggle: (frameworkId: string, currentlyActive: boolean) => void;
  updatingId: string | null;
}

export const EditActiveFrameworksDialog = ({
  open,
  onOpenChange,
  activeFrameworkIds,
  onToggle,
  updatingId,
}: EditActiveFrameworksDialogProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Rediger aktive regelverk og standarder</SheetTitle>
          <SheetDescription>
            Aktiver eller deaktiver regelverk og standarder for din virksomhet
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {categories.map((category) => {
            const categoryFrameworks = frameworks.filter((f) => f.category === category.id);
            const CategoryIcon = category.icon;

            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${category.bgColor}`}>
                    <CategoryIcon className={`h-4 w-4 ${category.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">{category.name}</h3>
                </div>
                <div className="space-y-2">
                  {categoryFrameworks.map((fw) => {
                    const isActive = activeFrameworkIds.has(fw.id);
                    const isMandatory = fw.isMandatory;
                    const isMandatoryButOff = isMandatory && !isActive;

                    return (
                      <div
                        key={fw.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                          isMandatoryButOff
                            ? "bg-destructive/5 border-destructive/30"
                            : isActive
                              ? "bg-primary/5 border-primary/20"
                              : "bg-muted/30 border-border"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-sm ${isMandatoryButOff ? "text-destructive" : ""}`}>
                              {fw.name}
                            </span>
                            {isMandatory && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    className="text-[13px] px-2 py-0.5 gap-1 bg-status-followup text-white hover:bg-status-followup/90 uppercase tracking-wider rounded-pill border-transparent font-semibold"
                                  >
                                    <Lock className="h-2.5 w-2.5" />
                                    Påkrevd ved lov
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    {isMandatoryButOff
                                      ? "⚠️ Dette regelverket er lovpålagt men er deaktivert. Du bør aktivere det."
                                      : "Lovpålagt for alle norske virksomheter"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{fw.description}</p>
                          {isMandatoryButOff && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                              <span className="text-[13px] text-destructive font-medium">
                                Lovpålagt regelverk er deaktivert — anbefales å aktivere
                              </span>
                            </div>
                          )}
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => onToggle(fw.id, isActive)}
                          disabled={updatingId === fw.id}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    );
                  })}
                </div>
                <Separator className="mt-4" />
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
