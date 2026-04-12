import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, FileCheck, Calendar, User, AlertCircle, HelpCircle, Mail } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { RequestUpdateDialog } from "@/components/asset-profile/RequestUpdateDialog";

interface VendorTPRMStatusProps {
  assetId: string;
  assetName?: string;
  vendorName?: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
}

type TPRMLevel = "approved" | "under_review" | "action_required" | "not_assessed";

interface DocumentStatus {
  type: string;
  label: string;
  exists: boolean;
  count: number;
  requestLabel: string;
}

export const VendorTPRMStatus = ({ assetId, assetName = "", vendorName, contactPerson, contactEmail }: VendorTPRMStatusProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestType, setRequestType] = useState<string | undefined>();

  const { data: asset } = useQuery({
    queryKey: ["asset-tprm", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["vendor-documents-tprm", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id, document_type, status")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const docStatuses: DocumentStatus[] = [
    {
      type: "dpa",
      label: isNb ? "Databehandleravtale (DPA)" : "Data Processing Agreement",
      exists: documents.some((d) => d.document_type === "dpa"),
      count: documents.filter((d) => d.document_type === "dpa").length,
      requestLabel: isNb ? "Be om DPA" : "Request DPA",
    },
    {
      type: "sla",
      label: isNb ? "Tjenestenivåavtale (SLA)" : "Service Level Agreement",
      exists: documents.some((d) => d.document_type === "sla"),
      count: documents.filter((d) => d.document_type === "sla").length,
      requestLabel: isNb ? "Be om SLA" : "Request SLA",
    },
    {
      type: "risk_assessment",
      label: isNb ? "Risikovurdering" : "Risk Assessment",
      exists: documents.some((d) => d.document_type === "risk_assessment"),
      count: documents.filter((d) => d.document_type === "risk_assessment").length,
      requestLabel: isNb ? "Be om risikovurdering" : "Request assessment",
    },
  ];

  const hasDPA = docStatuses[0].exists;
  const hasRisk = docStatuses[2].exists;
  const riskLevel = asset?.risk_level;

  let tprmLevel: TPRMLevel = "not_assessed";
  if (hasDPA && hasRisk && riskLevel && riskLevel !== "high") {
    tprmLevel = "approved";
  } else if (hasDPA || hasRisk) {
    tprmLevel = "under_review";
  } else if (riskLevel === "high") {
    tprmLevel = "action_required";
  }

  const tprmConfig: Record<TPRMLevel, { label: string; variant: "default" | "warning" | "destructive" | "secondary" }> = {
    approved: { label: isNb ? "Godkjent" : "Approved", variant: "default" },
    under_review: { label: isNb ? "Under vurdering" : "Under review", variant: "warning" },
    action_required: { label: isNb ? "Krever handling" : "Action required", variant: "destructive" },
    not_assessed: { label: isNb ? "Ikke vurdert" : "Not assessed", variant: "secondary" },
  };

  const nextReview = asset?.next_review_date;
  const responsible = asset?.asset_manager || null;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return isNb ? "Ikke satt" : "Not set";
    try {
      return format(new Date(dateStr), "d. MMM yyyy", { locale: isNb ? nb : undefined });
    } catch {
      return dateStr;
    }
  };

  const handleRequest = (docType: string) => {
    setRequestType(docType);
    setRequestOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {isNb ? "Oppfølgingsstatus (TPRM)" : "Follow-up Status (TPRM)"}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed p-3 space-y-1.5">
                    <p className="font-semibold text-foreground">
                      {isNb ? "TPRM – Third-Party Risk Management" : "TPRM – Third-Party Risk Management"}
                    </p>
                    <p>
                      {isNb
                        ? "TPRM handler om å ha kontroll på leverandørene dine. Det betyr at du sjekker at de behandler data trygt, at nødvendige avtaler er på plass, og at du jevnlig følger opp at alt er i orden."
                        : "TPRM is about keeping control of your vendors. It means checking that they handle data safely, that necessary agreements are in place, and that you regularly follow up to ensure everything is in order."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <Badge variant={tprmConfig[tprmLevel].variant} className="text-[10px]">
              {tprmConfig[tprmLevel].label}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {isNb
              ? "Er det trygt å bruke denne leverandøren – og hva må vi gjøre nå?"
              : "Is it safe to use this vendor – and what do we need to do now?"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Document statuses with actionable buttons */}
          <div className="space-y-1.5">
            {docStatuses.map((doc) => (
              <div
                key={doc.type}
                className={`flex items-center justify-between text-sm p-2 rounded ${
                  doc.exists
                    ? "bg-muted/30"
                    : "bg-destructive/5 border-l-2 border-destructive/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  {doc.exists ? (
                    <FileCheck className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive/70" />
                  )}
                  <span className={doc.exists ? "text-foreground" : "text-muted-foreground"}>
                    {doc.label}
                  </span>
                </span>
                {doc.exists ? (
                  <Badge variant="default" className="text-[10px]">
                    {isNb ? "På plass" : "In place"}
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 gap-1.5"
                    onClick={() => handleRequest(doc.type)}
                  >
                    <Mail className="h-3 w-3" />
                    {doc.requestLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Key dates & responsible */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-start gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">{isNb ? "Neste gjennomgang" : "Next review"}</p>
                {nextReview ? (
                  <p className="font-medium">{formatDate(nextReview)}</p>
                ) : (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("switch-to-tab", { detail: { tab: "vendor-audit" } }))}
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    {isNb ? "Sett opp i Revisjon →" : "Set up in Audit →"}
                  </button>
                )}
              </div>
            </div>
            {responsible && (
              <div className="flex items-start gap-2 text-xs">
                <User className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">{isNb ? "Leverandøransvarlig" : "Vendor Manager"}</p>
                  <p className="font-medium">{responsible}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <RequestUpdateDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        assetId={assetId}
        assetName={assetName}
        vendorName={vendorName}
        preselectedType={requestType}
        contactPerson={contactPerson}
        contactEmail={contactEmail}
      />
    </>
  );
};
