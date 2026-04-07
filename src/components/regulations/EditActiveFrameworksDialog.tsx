import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock } from "lucide-react";
import { frameworks, categories, getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
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
          <SheetTitle>Rediger aktive regelverk</SheetTitle>
          <SheetDescription>
            Aktiver eller deaktiver regelverk for din virksomhet
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

                    return (
                      <div
                        key={fw.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                          isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{fw.name}</span>
                            {isMandatory && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                    <Lock className="h-2.5 w-2.5" />
                                    Obligatorisk
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Lovpålagt for alle norske virksomheter</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{fw.description}</p>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => onToggle(fw.id, isActive)}
                          disabled={updatingId === fw.id}
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
