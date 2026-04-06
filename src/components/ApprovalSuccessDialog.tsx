import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Sparkles, ExternalLink, TrendingUp, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DOC_TYPE_LABELS: Record<string, string> = {
  penetration_test: "Penetrasjonstest",
  dpa: "DPA / Databehandleravtale",
  iso27001: "ISO 27001-sertifikat",
  soc2: "SOC 2-rapport",
  dpia: "DPIA",
  nda: "NDA",
  incident: "Sikkerhetshendelse",
  other: "Dokument",
};

const SCORE_IMPACT: Record<string, number> = {
  iso27001: 8,
  soc2: 7,
  dpa: 5,
  penetration_test: 6,
  dpia: 4,
  nda: 2,
  incident: 3,
  other: 2,
};

export interface ApprovedItemData {
  fileName: string;
  documentType: string;
  assetId: string;
  assetName: string;
  isIncident: boolean;
}

interface ApprovalSuccessDialogProps {
  data: ApprovedItemData | null;
  onClose: () => void;
}

export const ApprovalSuccessDialog = ({ data, onClose }: ApprovalSuccessDialogProps) => {
  const navigate = useNavigate();

  if (!data) return null;

  const scoreImpact = SCORE_IMPACT[data.documentType] || 2;
  const docLabel = DOC_TYPE_LABELS[data.documentType] || data.documentType;
  const targetTab = data.isIncident ? "incidents" : "documents";

  const handleGoToProfile = () => {
    onClose();
    navigate(`/assets/${data.assetId}?tab=${targetTab}`);
  };

  return (
    <AlertDialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {/* Success icon */}
          <div className="relative">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${data.isIncident ? "bg-orange-100" : "bg-emerald-100"}`}>
              {data.isIncident ? (
                <ShieldAlert className="w-9 h-9 text-orange-600" />
              ) : (
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              )}
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-500" />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              {data.isIncident ? "Avvik opprettet" : "Dokument godkjent"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {data.isIncident
                ? "Hendelsen er registrert som et avvik i systemet."
                : "Dokumentet er lagt til i leverandørens profil."}
            </p>
          </div>

          {/* Details card */}
          <div className="w-full bg-muted/50 rounded-lg p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Type</span>
              <Badge variant="secondary" className="text-xs">{docLabel}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {data.isIncident ? "System" : "Leverandør"}
              </span>
              <span className="text-sm font-medium text-foreground">{data.assetName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Fil</span>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{data.fileName}</span>
            </div>
          </div>

          {/* Score impact */}
          <div className="w-full flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
            <TrendingUp className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-emerald-800">
                +{scoreImpact} poeng estimert
              </p>
              <p className="text-xs text-emerald-600">
                {data.isIncident
                  ? "Compliance-score oppdateres basert på avvikshåndtering."
                  : "Compliance-score forbedres med gyldig dokumentasjon."}
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Lukk
          </Button>
          <Button onClick={handleGoToProfile} className="flex-1">
            Se i profilen
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
