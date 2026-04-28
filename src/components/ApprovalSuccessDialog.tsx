import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface TPRMImpactData {
  controlsBefore: number;
  controlsAfter: number;
  controlsTotal: number;
  tprmLevelBefore: string;
  tprmLevelAfter: string;
  riskLevel: string | null;
}

export interface ApprovedItemData {
  fileName: string;
  documentType: string;
  assetId: string;
  assetName: string;
  isIncident: boolean;
  tprmImpact?: TPRMImpactData;
}

interface ApprovalSuccessDialogProps {
  data: ApprovedItemData | null;
  onClose: () => void;
}

export const ApprovalSuccessDialog = ({ data, onClose }: ApprovalSuccessDialogProps) => {
  const navigate = useNavigate();

  if (!data) return null;

  const handleGoToProfile = () => {
    onClose();
    navigate(`/assets/${data.assetId}?tab=documents`);
  };

  return (
    <AlertDialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          {/* Lara animation */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
          </div>

          {/* Message */}
          <div className="space-y-2 max-w-xs">
            <h2 className="text-lg font-semibold text-foreground">
              Lara analyserer dokumentet
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dette kan ta litt tid. Du kan trygt lukke vinduet — leverandørprofilen oppdateres automatisk når Lara er ferdig.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Lukk vinduet
          </Button>
          <Button onClick={handleGoToProfile} className="flex-1">
            Gå til profilen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
