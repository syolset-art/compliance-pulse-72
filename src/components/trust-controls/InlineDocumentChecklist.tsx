import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Upload, FileText, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";

// Expected document types per control area
const AREA_EXPECTED_DOCS: Record<string, { type: string; labelNb: string; labelEn: string }[]> = {
  governance: [
    { type: "iso27001", labelNb: "Informasjonssikkerhetspolicy (ISMS)", labelEn: "Information Security Policy (ISMS)" },
    { type: "other", labelNb: "Roller og ansvarsdokument", labelEn: "Roles & Responsibilities Document" },
    { type: "other", labelNb: "Eget styringsrammeverk (valgfritt)", labelEn: "Custom Governance Framework (optional)" },
  ],
  risk_compliance: [
    { type: "penetration_test", labelNb: "Penetrasjonstest / sikkerhetstest", labelEn: "Penetration Test / Security Test" },
    { type: "dpia", labelNb: "DPIA / Personvernkonsekvensvurdering", labelEn: "DPIA / Data Protection Impact Assessment" },
    { type: "other", labelNb: "Risikovurdering", labelEn: "Risk Assessment" },
    { type: "other", labelNb: "Beredskapsplan / BCP", labelEn: "Business Continuity Plan / BCP" },
  ],
  security_posture: [
    { type: "dpa", labelNb: "DPA / Databehandleravtale", labelEn: "DPA / Data Processing Agreement" },
    { type: "other", labelNb: "Personvernerklæring", labelEn: "Privacy Policy" },
    { type: "other", labelNb: "Tilgangsstyringspolicy", labelEn: "Access Control Policy" },
  ],
  supplier_governance: [
    { type: "dpa", labelNb: "DPA / Databehandleravtale", labelEn: "DPA / Data Processing Agreement" },
    { type: "nda", labelNb: "NDA / Konfidensialitetsavtale", labelEn: "NDA / Confidentiality Agreement" },
    { type: "soc2", labelNb: "SOC 2 / Sikkerhetsattest", labelEn: "SOC 2 / Security Attestation" },
    { type: "other", labelNb: "Leverandørvurdering", labelEn: "Vendor Assessment" },
  ],
};

interface InlineDocumentChecklistProps {
  assetId: string;
  controlArea: string;
  onNavigateToDocuments?: () => void;
}

export function InlineDocumentChecklist({
  assetId,
  controlArea,
  onNavigateToDocuments,
}: InlineDocumentChecklistProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const expectedDocs = AREA_EXPECTED_DOCS[controlArea] || [];

  const { data: existingDocs = [] } = useQuery({
    queryKey: ["vendor-documents-checklist", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id, document_type, file_name, source, created_at, display_name")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, docType }: { file: File; docType: string }) => {
      const filePath = `${assetId}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage
        .from("vendor-documents")
        .upload(filePath, file);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        file_name: file.name,
        file_path: filePath,
        document_type: docType,
        source: "internal",
        status: "valid",
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-checklist", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-count", assetId] });
      toast.success(isNb ? "Dokument lastet opp" : "Document uploaded");
      setUploadingType(null);
    },
    onError: () => {
      toast.error(isNb ? "Kunne ikke laste opp" : "Upload failed");
      setUploadingType(null);
    },
  });

  const handleUploadClick = (docType: string) => {
    setUploadingType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingType) {
      uploadMutation.mutate({ file, docType: uploadingType });
    }
    e.target.value = "";
  };

  // Match expected docs to existing ones by type
  const getMatchingDocs = (type: string) => {
    return existingDocs.filter((d: any) => d.document_type === type);
  };

  const uploadedCount = expectedDocs.filter((ed) => getMatchingDocs(ed.type).length > 0).length;

  return (
    <div className="mt-3 pt-3 border-t border-border animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-foreground">
          {isNb ? "Forventet dokumentasjon" : "Expected documentation"}
        </p>
        <Badge variant="secondary" className="text-[9px]">
          {uploadedCount}/{expectedDocs.length} {isNb ? "lastet opp" : "uploaded"}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {expectedDocs.map((doc, idx) => {
          const matches = getMatchingDocs(doc.type);
          const hasDoc = matches.length > 0;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                hasDoc ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" : "bg-muted/50 border border-border"
              }`}
            >
              {hasDoc ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`font-medium ${hasDoc ? "text-foreground" : "text-muted-foreground"}`}>
                  {isNb ? doc.labelNb : doc.labelEn}
                </span>
                {hasDoc && matches[0] && (
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {matches[0].file_name} · {new Date(matches[0].created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                  </span>
                )}
              </div>
              {hasDoc ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 text-[9px] shrink-0">
                  {isNb ? "Lastet opp" : "Uploaded"}
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] gap-1 shrink-0"
                  onClick={() => handleUploadClick(doc.type)}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="h-3 w-3" />
                  {isNb ? "Last opp" : "Upload"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {onNavigateToDocuments && (
        <button
          onClick={onNavigateToDocuments}
          className="flex items-center gap-1.5 text-[11px] text-primary hover:underline font-medium mt-3"
        >
          <ExternalLink className="h-3 w-3" />
          {isNb ? "Se alle dokumenter i Dokumenter-fanen" : "View all documents in Documents tab"}
        </button>
      )}
    </div>
  );
}
