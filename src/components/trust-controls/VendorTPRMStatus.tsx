import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileCheck, Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface VendorTPRMStatusProps {
  assetId: string;
}

type TPRMLevel = "approved" | "under_review" | "action_required" | "not_assessed";

interface DocumentStatus {
  type: string;
  label: string;
  exists: boolean;
  count: number;
}

export const VendorTPRMStatus = ({ assetId }: VendorTPRMStatusProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

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

  // Derive document statuses
  const docStatuses: DocumentStatus[] = [
    {
      type: "dpa",
      label: isNb ? "Databehandleravtale (DPA)" : "Data Processing Agreement",
      exists: documents.some((d) => d.document_type === "dpa"),
      count: documents.filter((d) => d.document_type === "dpa").length,
    },
    {
      type: "sla",
      label: isNb ? "Tjenestenivåavtale (SLA)" : "Service Level Agreement",
      exists: documents.some((d) => d.document_type === "sla"),
      count: documents.filter((d) => d.document_type === "sla").length,
    },
    {
      type: "risk_assessment",
      label: isNb ? "Risikovurdering" : "Risk Assessment",
      exists: documents.some((d) => d.document_type === "risk_assessment"),
      count: documents.filter((d) => d.document_type === "risk_assessment").length,
    },
  ];

  // Derive overall TPRM status
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
  const responsible = asset?.asset_owner || asset?.asset_manager;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return isNb ? "Ikke satt" : "Not set";
    try {
      return format(new Date(dateStr), "d. MMM yyyy", { locale: isNb ? nb : undefined });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {isNb ? "TPRM-status" : "TPRM Status"}
          </span>
          <Badge variant={tprmConfig[tprmLevel].variant} className="text-[10px]">
            {tprmConfig[tprmLevel].label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Document statuses */}
        <div className="space-y-1.5">
          {docStatuses.map((doc) => (
            <div key={doc.type} className="flex items-center justify-between text-sm p-1.5 rounded bg-muted/30">
              <span className="flex items-center gap-2">
                {doc.exists ? (
                  <FileCheck className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={doc.exists ? "text-foreground" : "text-muted-foreground"}>{doc.label}</span>
              </span>
              <Badge variant={doc.exists ? "default" : "outline"} className="text-[10px]">
                {doc.exists ? (isNb ? "På plass" : "In place") : (isNb ? "Mangler" : "Missing")}
              </Badge>
            </div>
          ))}
        </div>

        {/* Key dates & responsible */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-start gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">{isNb ? "Neste gjennomgang" : "Next review"}</p>
              <p className="font-medium">{formatDate(nextReview)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <User className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">{isNb ? "Ansvarlig" : "Responsible"}</p>
              <p className="font-medium">{responsible || (isNb ? "Ikke tildelt" : "Not assigned")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
