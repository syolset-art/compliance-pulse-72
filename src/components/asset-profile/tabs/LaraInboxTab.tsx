import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Mail, Sparkles, FileText, Eye, Download, Shield, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";
import { ApprovalSuccessDialog, type ApprovedItemData } from "@/components/ApprovalSuccessDialog";
import { calculateTPRMImpact } from "@/lib/tprmUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Props {
  assetId: string;
  assetName: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  penetration_test: "Penetrasjonstest",
  dpa: "DPA / Databehandleravtale",
  iso27001: "ISO 27001-sertifikat",
  soc2: "SOC 2-rapport",
  dpia: "DPIA",
  nda: "NDA",
  other: "Dokument",
};

export function LaraInboxTab({ assetId, assetName }: Props) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const locale = i18n.language === "nb" ? "nb-NO" : "en-US";
  const [approvedItem, setApprovedItem] = useState<ApprovedItemData | null>(null);

  const { data: inboxItems = [], isLoading } = useQuery({
    queryKey: ["lara-inbox", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lara_inbox")
        .select("*")
        .eq("matched_asset_id", assetId)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch asset info and existing vendor docs for TPRM impact calculation
  const { data: assetInfo } = useQuery({
    queryKey: ["asset-tprm-lara", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("criticality, risk_level, next_review_date")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: vendorDocs = [] } = useQuery({
    queryKey: ["vendor-documents-tprm-lara", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("document_type")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (item: any) => {
      // Move to vendor_documents
      await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        file_name: item.file_name,
        file_path: item.file_path || "",
        document_type: item.matched_document_type || "other",
        source: "email_inbox",
        status: "current",
        received_at: item.received_at,
        notes: `Mottatt fra ${item.sender_name || item.sender_email}`,
      } as any);
      // Update inbox status
      await supabase.from("lara_inbox").update({ status: "manually_assigned", processed_at: new Date().toISOString() } as any).eq("id", item.id);
    },
    onSuccess: (_data, item) => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-tprm-lara", assetId] });

      // Calculate TPRM impact
      const existingDocTypes = vendorDocs.map((d: any) => d.document_type).filter(Boolean);
      const hasAudit = !!assetInfo?.next_review_date;
      const docType = item.matched_document_type || "other";
      const tprmImpact = calculateTPRMImpact(
        existingDocTypes,
        hasAudit,
        docType,
        assetInfo?.criticality,
        assetInfo?.risk_level,
      );

      setApprovedItem({
        fileName: item.file_name || item.subject || "",
        documentType: docType,
        assetId,
        assetName,
        isIncident: false,
        tprmImpact,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await supabase.from("lara_inbox").update({ status: "rejected", processed_at: new Date().toISOString() } as any).eq("id", itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox", assetId] });
      toast.success("Forslag avvist");
    },
  });

  const pendingItems = inboxItems.filter((i: any) => i.status === "new" || i.status === "auto_matched");
  const processedItems = inboxItems.filter((i: any) => i.status === "manually_assigned" || i.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Pending items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <img src={laraButterfly} alt="Lara" className="h-5 w-5" />
            Lara Innboks
            {pendingItems.length > 0 && (
              <Badge className="bg-primary/15 text-primary border-primary/30 text-[13px]">{pendingItems.length} nye</Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Dokumenter mottatt på e-post som Lara har analysert og foreslått matching for.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ingen ventende dokumenter i innboksen</p>
            </div>
          ) : (
            pendingItems.map((item: any) => (
              <div key={item.id} className="p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.file_name || item.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Fra: {item.sender_name || item.sender_email} · {new Date(item.received_at).toLocaleDateString(locale)}
                      </p>
                      {item.subject && <p className="text-xs text-muted-foreground mt-0.5">Emne: {item.subject}</p>}

                      {/* Lara suggestion */}
                      <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                        <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <p className="text-xs">
                          <span className="font-medium">Lara foreslår:</span> Koble til <span className="font-semibold">{assetName}</span> som{" "}
                          <Badge variant="secondary" className="text-[13px] mx-0.5">{DOC_TYPE_LABELS[item.matched_document_type] || item.matched_document_type}</Badge>
                        </p>
                        {item.confidence_score && (
                          <Badge className="bg-status-closed/15 text-status-closed border-status-closed/30 text-[13px] ml-auto flex-shrink-0">
                            {Math.round(item.confidence_score * 100)}% sikker
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button size="sm" className="h-8 text-xs" onClick={() => approveMutation.mutate(item)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Godkjenn
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => rejectMutation.mutate(item.id)}>
                      <X className="h-3.5 w-3.5 mr-1" />
                      Avvis
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Processed items */}
      {processedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Behandlede ({processedItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {processedItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border opacity-60">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.file_name || item.subject}</p>
                  <p className="text-[13px] text-muted-foreground">{item.sender_name || item.sender_email}</p>
                </div>
                <Badge variant={item.status === "manually_assigned" ? "default" : "secondary"} className="text-[13px] ml-auto">
                  {item.status === "manually_assigned" ? "Godkjent" : "Avvist"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <ApprovalSuccessDialog data={approvedItem} onClose={() => setApprovedItem(null)} />
    </div>
  );
}
