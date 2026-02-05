import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { getRiskLevelLabel, getRiskLevelColor } from "@/components/process/RiskMatrixVisual";

interface RiskReductionSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousLevel: string;
  newLevel: string;
  mitigation: string | null;
  frameworks: string[];
}

export const RiskReductionSuccessDialog = ({
  open,
  onOpenChange,
  previousLevel,
  newLevel,
  mitigation,
  frameworks,
}: RiskReductionSuccessDialogProps) => {
  useEffect(() => {
    if (open) {
      // Trigger confetti effect
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ["#22c55e", "#16a34a", "#15803d"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ["#22c55e", "#16a34a", "#15803d"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Success icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-500" />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Godt jobbet!</h2>
            <p className="text-muted-foreground">
              Risikoen er redusert
            </p>
          </div>

          {/* Risk transition */}
          <div className="flex items-center justify-center gap-3 py-4">
            <Badge className={`${getRiskLevelColor(previousLevel)} text-sm px-3 py-1.5`}>
              {getRiskLevelLabel(previousLevel)}
            </Badge>
            <ArrowRight className="h-5 w-5 text-green-600" />
            <Badge className={`${getRiskLevelColor(newLevel)} text-sm px-3 py-1.5`}>
              {getRiskLevelLabel(newLevel)}
            </Badge>
          </div>

          {/* Mitigation info */}
          {mitigation && (
            <div className="w-full bg-muted/50 rounded-lg p-4 text-left">
              <p className="text-sm text-muted-foreground mb-1">Tiltak implementert:</p>
              <p className="text-sm font-medium">{mitigation}</p>
            </div>
          )}

          {/* Frameworks */}
          {frameworks.length > 0 && (
            <div className="w-full">
              <p className="text-sm text-muted-foreground mb-2">
                Dette forbedrer samsvar med:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {frameworks.map((fw) => (
                  <Badge key={fw} variant="outline" className="bg-green-50 border-green-200 text-green-700">
                    {fw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <Button onClick={() => onOpenChange(false)} className="mt-4 w-full">
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
