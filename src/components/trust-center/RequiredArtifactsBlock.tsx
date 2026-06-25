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
              <div className="relative shrink-0">
                <Icon className={`h-4 w-4 ${documented ? "text-success" : "text-muted-foreground/70"}`} />
                {!documented && variant === "evidence" && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-warning"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{row.label}</span>
                  {!documented && variant === "evidence" && (
                    <span className="text-[11px] text-muted-foreground/80">
                      · {isNb ? "mangler" : "missing"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {documented ? sourceLabel : row.helper}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {documented && row.doc?.external_url && (
                  <Button asChild variant="ghost" size="sm" className="gap-1.5 h-8">
                    <a href={row.doc.external_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {isNb ? "Åpne" : "Open"}
                    </a>
                  </Button>
                )}
                {!documented && variant === "evidence" && (
                  <Popover open={linkOpenFor === row.key} onOpenChange={(o) => { setLinkOpenFor(o ? row.key : null); setLinkValue(""); }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {isNb ? "Legg til" : "Add"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-3">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                            {isNb ? "Lim inn lenke" : "Paste link"}
                          </p>
                          <div className="flex gap-1.5">
                            <Input
                              autoFocus
                              placeholder="https://..."
                              value={linkValue}
                              onChange={(e) => setLinkValue(e.target.value)}
                              className="h-8 text-xs"
                            />
                            <Button
                              size="sm"
                              className="h-8 px-2.5"
                              disabled={!linkValue || addLink.isPending}
                              onClick={() => addLink.mutate({ docType: row.docType, url: linkValue })}
                            >
                              {addLink.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isNb ? "Lagre" : "Save")}
                            </Button>
                          </div>
                        </div>
                        <div className="border-t border-border pt-2 space-y-1">
                          <button
                            type="button"
                            onClick={goToEvidence}
                            className="w-full flex items-center gap-2 text-xs text-foreground hover:bg-muted/60 rounded-md px-2 py-1.5 text-left"
                          >
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                            {isNb ? "Last opp dokument" : "Upload document"}
                          </button>
                          {row.key === "dpa" && (
                            <button
                              type="button"
                              disabled={markDpaOnRequest.isPending}
                              onClick={() => markDpaOnRequest.mutate()}
                              className="w-full flex items-center gap-2 text-xs text-foreground hover:bg-muted/60 rounded-md px-2 py-1.5 text-left disabled:opacity-50"
                            >
                              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                              {isNb ? "Marker som «på forespørsel»" : "Mark as \"on request\""}
                            </button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );

        })}
      </div>
    </div>
  );
};
