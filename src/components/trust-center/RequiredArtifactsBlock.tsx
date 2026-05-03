import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, FileText, Award, CheckCircle2, AlertTriangle, ExternalLink, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Doc = {
  id: string;
  document_type: string;
  display_name?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  external_url?: string | null;
  available_on_request?: boolean | null;
  category?: string | null;
};

interface Props {
  assetId?: string;
  vendorDocs: Doc[];
  variant?: "profile" | "evidence";
}

const SECURITY_CERT_TYPES = ["certification", "iso_27001", "iso27001", "soc2", "isae_3402", "security_whitepaper", "security_policy"];

function findPrivacy(docs: Doc[]) {
  return docs.find(d => d.document_type === "privacy_policy");
}
function findDpa(docs: Doc[]) {
  return docs.find(d => 
    d.document_type === "dpa" || 
    d.category === "dpa" ||
    (d.document_type === "agreement" && /dpa|databehandler|processing/i.test((d.display_name || d.file_name || "")))
  );
}
function findSecurity(docs: Doc[]) {
  return docs.find(d => SECURITY_CERT_TYPES.includes(d.document_type) || d.category === "certification");
}

export const RequiredArtifactsBlock = ({ assetId, vendorDocs, variant = "profile" }: Props) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [linkOpenFor, setLinkOpenFor] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState("");

  const privacy = findPrivacy(vendorDocs);
  const dpa = findDpa(vendorDocs);
  const dpaOnRequest = vendorDocs.some(d => d.document_type === "dpa" && d.available_on_request);
  const security = findSecurity(vendorDocs);

  const addLink = useMutation({
    mutationFn: async ({ docType, url }: { docType: string; url: string }) => {
      if (!assetId) throw new Error("no asset");
      const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const { error } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        document_type: docType,
        display_name: docType === "privacy_policy" ? (isNb ? "Personvernerklæring" : "Privacy Policy") :
          docType === "dpa" ? (isNb ? "Databehandleravtale" : "Data Processing Agreement") :
          (isNb ? "Sikkerhetsdokument" : "Security document"),
        file_name: safe,
        file_path: null as any,
        external_url: safe,
        category: docType === "dpa" ? "dpa" : docType === "privacy_policy" ? "policy" : "certification",
        status: "verified",
        visibility: "published",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
      toast.success(isNb ? "Lenke lagt til" : "Link added");
      setLinkOpenFor(null);
      setLinkValue("");
    },
    onError: () => toast.error(isNb ? "Kunne ikke lagre lenke" : "Failed to save link"),
  });

  const markDpaOnRequest = useMutation({
    mutationFn: async () => {
      if (!assetId) throw new Error("no asset");
      const { error } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        document_type: "dpa",
        display_name: isNb ? "Databehandleravtale (på forespørsel)" : "Data Processing Agreement (on request)",
        file_name: isNb ? "Tilgjengelig på forespørsel" : "Available on request",
        file_path: null as any,
        available_on_request: true,
        category: "dpa",
        status: "verified",
        visibility: "published",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
      toast.success(isNb ? "Markert som tilgjengelig på forespørsel" : "Marked as available on request");
    },
    onError: () => toast.error(isNb ? "Kunne ikke oppdatere" : "Failed to update"),
  });

  const goToEvidence = () => navigate("/trust-center/evidence");

  const rows: Array<{
    key: "privacy" | "dpa" | "security";
    icon: typeof Shield;
    label: string;
    helper: string;
    doc?: Doc;
    onRequest?: boolean;
    docType: string;
  }> = [
    {
      key: "privacy",
      icon: FileText,
      label: isNb ? "Personvernpolicy" : "Privacy Policy",
      helper: isNb ? "Lenke eller opplastet dokument" : "Link or uploaded document",
      doc: privacy,
      docType: "privacy_policy",
    },
    {
      key: "dpa",
      icon: Shield,
      label: isNb ? "Databehandleravtale (DPA)" : "Data Processing Agreement (DPA)",
      helper: isNb ? "Lenke, dokument eller \"på forespørsel\"" : "Link, document or \"on request\"",
      doc: dpa,
      onRequest: dpaOnRequest,
      docType: "dpa",
    },
    {
      key: "security",
      icon: Award,
      label: isNb ? "Sikkerhetssertifisering eller whitepaper" : "Security certification or whitepaper",
      helper: isNb ? "ISO 27001, SOC 2, ISAE 3402, eller egen-erklæring" : "ISO 27001, SOC 2, ISAE 3402 or self-declaration",
      doc: security,
      docType: "iso_27001",
    },
  ];

  const documentedCount = rows.filter(r => r.doc || r.onRequest).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {isNb ? "Påkrevde dokumenter for kjøpere" : "Required documents for buyers"}
          </h3>
        </div>
        <Badge
          variant={documentedCount === 3 ? "default" : "secondary"}
          className={documentedCount === 3 ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}
        >
          {documentedCount}/3
        </Badge>
      </div>
      <div className="divide-y divide-border">
        {rows.map(row => {
          const documented = !!row.doc || !!row.onRequest;
          const Icon = row.icon;
          const sourceLabel = row.onRequest
            ? (isNb ? "Tilgjengelig på forespørsel" : "Available on request")
            : row.doc?.external_url
            ? row.doc.external_url.replace(/^https?:\/\//, "").replace(/\/$/, "")
            : row.doc?.display_name || row.doc?.file_name;

          return (
            <div key={row.key} className="px-5 py-3.5 flex items-center gap-4">
              <Icon className={`h-4 w-4 shrink-0 ${documented ? "text-success" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{row.label}</span>
                  {documented ? (
                    <Badge className="bg-success/10 text-success border-success/20 gap-1 font-normal text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      {isNb ? "Dokumentert" : "Documented"}
                    </Badge>
                  ) : (
                    <Badge className="bg-warning/10 text-warning border-warning/30 gap-1 font-normal text-[11px]">
                      <AlertTriangle className="h-3 w-3" />
                      {isNb ? "Ikke dokumentert" : "Not documented"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {documented ? sourceLabel : row.helper}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {documented && row.doc?.external_url && (
                  <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8">
                    <a href={row.doc.external_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {isNb ? "Åpne" : "Open"}
                    </a>
                  </Button>
                )}
                {!documented && variant === "evidence" && (
                  <>
                    <Popover open={linkOpenFor === row.key} onOpenChange={(o) => { setLinkOpenFor(o ? row.key : null); setLinkValue(""); }}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 h-8">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {isNb ? "Lim inn lenke" : "Paste link"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80">
                        <div className="space-y-2">
                          <p className="text-xs font-medium">{isNb ? "Lenke til publisert dokument" : "Link to published document"}</p>
                          <Input
                            autoFocus
                            placeholder="https://..."
                            value={linkValue}
                            onChange={(e) => setLinkValue(e.target.value)}
                          />
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={!linkValue || addLink.isPending}
                            onClick={() => addLink.mutate({ docType: row.docType, url: linkValue })}
                          >
                            {addLink.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                            {isNb ? "Lagre lenke" : "Save link"}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={goToEvidence}>
                      <Plus className="h-3.5 w-3.5" />
                      {isNb ? "Last opp" : "Upload"}
                    </Button>
                    {row.key === "dpa" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground"
                        disabled={markDpaOnRequest.isPending}
                        onClick={() => markDpaOnRequest.mutate()}
                      >
                        {isNb ? "På forespørsel" : "On request"}
                      </Button>
                    )}
                  </>
                )}
                {!documented && variant === "profile" && (
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={goToEvidence}>
                    <Plus className="h-3.5 w-3.5" />
                    {isNb ? "Legg til" : "Add"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
