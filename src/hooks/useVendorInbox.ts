import { useRef, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateTPRMImpact } from "@/lib/tprmUtils";
import { ApprovalSuccessDialog, type ApprovedItemData } from "@/components/ApprovalSuccessDialog";

const DOC_TYPE_LABELS: Record<string, string> = {
  penetration_test: "Penetrasjonstest",
  dpa: "DPA / Databehandleravtale",
  iso27001: "ISO 27001-sertifikat",
  soc2: "SOC 2-rapport",
  dpia: "DPIA",
  nda: "NDA",
  other: "Dokument",
};

function buildAnalysisSummary(docType: string) {
  const presets: Record<string, any> = {
    iso27001: {
      valid_until: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    },
    soc2: {
      valid_until: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    },
    dpa: {},
    dpia: {},
    penetration_test: {},
    nda: {},
  };
  return presets[docType] || {};
}

interface UseVendorInboxOptions {
  assetId: string;
  assetName: string;
}

export function useVendorInbox({ assetId, assetName }: UseVendorInboxOptions) {
  const queryClient = useQueryClient();
  const [approvedItem, setApprovedItem] = useState<ApprovedItemData | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const { data: inboxItems = [] } = useQuery({
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
    refetchInterval: 15000,
  });

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

  useEffect(() => {
    if (!inboxItems.length) return;
    const now = Date.now();
    const items = inboxItems as any[];

    const toAnalyzing = items.filter((i) =>
      i.analysis_status === "pending" &&
      now - new Date(i.received_at).getTime() > 30_000,
    );
    const toAnalyzed = items.filter((i) =>
      i.analysis_status === "analyzing" &&
      now - new Date(i.received_at).getTime() > 75_000,
    );

    const run = async () => {
      if (toAnalyzing.length) {
        await supabase.from("lara_inbox")
          .update({ analysis_status: "analyzing" } as any)
          .in("id", toAnalyzing.map((i) => i.id));
      }
      if (toAnalyzed.length) {
        for (const item of toAnalyzed) {
          const docType = item.matched_document_type || "other";
          const summary = buildAnalysisSummary(docType);
          await supabase.from("lara_inbox")
            .update({
              analysis_status: "analyzed",
              analyzed_at: new Date().toISOString(),
              analysis_summary: summary,
            } as any)
            .eq("id", item.id);
          if (!notifiedRef.current.has(item.id)) {
            notifiedRef.current.add(item.id);
            toast.success(`Lara har analysert ${item.file_name || item.subject}`, {
              description: "Klar for din godkjenning – beriker trust score når godkjent.",
            });
          }
        }
      }
      if (toAnalyzing.length || toAnalyzed.length) {
        queryClient.invalidateQueries({ queryKey: ["lara-inbox", assetId] });
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxItems]);

  const approveMutation = useMutation({
    mutationFn: async (item: any) => {
      const docType = item.matched_document_type || "other";
      const summary = item.analysis_summary || {};
      const { data: inserted } = await supabase
        .from("vendor_documents")
        .insert({
          asset_id: assetId,
          file_name: item.file_name,
          file_path: item.file_path || "",
          document_type: docType,
          source: "email_inbox",
          status: "current",
          received_at: item.received_at,
          valid_to: summary.valid_until ? new Date(summary.valid_until).toISOString().slice(0, 10) : null,
          notes: `Mottatt fra ${item.sender_name || item.sender_email}`,
        } as any)
        .select("id")
        .single();

      const { supersedePreviousDocuments } = await import("@/lib/documentStatus");
      const replacedIds = await supersedePreviousDocuments(supabase, {
        assetId,
        documentType: docType,
        newDocumentId: inserted?.id ?? null,
      });

      await supabase.from("lara_inbox").update({ status: "manually_assigned", processed_at: new Date().toISOString() } as any).eq("id", item.id);
      return { replacedCount: replacedIds.length };
    },
    onSuccess: (data, item) => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-tprm-lara", assetId] });

      const existingDocTypes = vendorDocs.map((d: any) => d.document_type).filter(Boolean);
      const hasAudit = !!assetInfo?.next_review_date;
      const docType = item.matched_document_type || "other";
      const tprmImpact = calculateTPRMImpact(
        existingDocTypes, hasAudit, docType,
        assetInfo?.criticality, assetInfo?.risk_level,
      );
      if (data?.replacedCount) {
        toast.info(`Erstattet ${data.replacedCount} tidligere ${DOC_TYPE_LABELS[docType] || "dokument"}`, {
          description: "Det forrige dokumentet er flyttet til historikken.",
        });
      }
      setApprovedItem({
        fileName: item.file_name || item.subject || "",
        documentType: docType,
        assetId, assetName, isIncident: false, tprmImpact,
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

  return {
    inboxItems,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    approvedItem,
    clearApprovedItem: () => setApprovedItem(null),
  };
}
