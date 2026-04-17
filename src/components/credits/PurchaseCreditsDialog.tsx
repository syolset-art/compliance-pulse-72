import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Replaced the old "Buy credits" dialog.
 * Credits are no longer sold separately — guides users to upgrade their plan instead.
 */
export function PurchaseCreditsDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Oppgrader din plan
          </DialogTitle>
          <DialogDescription>
            Mynder selger ikke lenger credits separat. AI-bruk og alle agenter er inkludert i Profesjonell-planen.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Profesjonell — 2 490 kr/mnd</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ubegrenset Lara AI</li>
            <li>• Slette-agent inkludert</li>
            <li>• Ubegrenset leverandører og systemer</li>
            <li>• 3 regelverk inkludert</li>
          </ul>
        </div>

        <Button
          className="w-full gap-2"
          onClick={() => {
            onOpenChange(false);
            navigate("/subscriptions");
          }}
        >
          Se planer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
