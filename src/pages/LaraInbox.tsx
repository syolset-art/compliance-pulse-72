import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Mail, FileText, ShieldAlert, Database, Loader2, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ApprovalSuccessDialog, type ApprovedItemData } from "@/components/ApprovalSuccessDialog";

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

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  critical: { label: "Kritisk", className: "bg-destructive/15 text-destructive border-destructive/30" },
  high: { label: "Høy", className: "bg-warning/15 text-warning border-warning/30" },
  medium: { label: "Middels", className: "bg-warning/15 text-warning border-warning/30" },
  low: { label: "Lav", className: "bg-status-closed/15 text-status-closed border-status-closed/30" },
};

function getSeverityFromFileName(fileName?: string | null): string | null {
  if (!fileName) return null;
  // Mock incidents have IDs like 7SEC-2026-0451, map them to severity
  const severityMap: Record<string, string> = {
    "7SEC-2026-0451": "critical",
    "7SEC-2026-0449": "high",
    "7SEC-2026-0447": "medium",
    "7SEC-2026-0445": "high",
    "7SEC-2026-0443": "medium",
  };
  for (const [id, sev] of Object.entries(severityMap)) {
    if (fileName.includes(id)) return sev;
  }
  return null;
}

const LaraInbox = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = i18n.language === "nb" ? "nb-NO" : "en-US";
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [approvedItem, setApprovedItem] = useState<ApprovedItemData | null>(null);

  const seedDemoInboxItems = async () => {
    setIsSeeding(true);
    try {
      // Fetch 3 random vendors
      const { data: vendors } = await supabase
        .from("assets")
        .select("id, name")
        .eq("asset_type", "vendor")
        .limit(10);
      if (!vendors || vendors.length === 0) {
        toast.error("Ingen leverandører registrert ennå");
        return;
      }
      const shuffled = vendors.sort(() => Math.random() - 0.5).slice(0, 3);
      const templates = [
        { type: "dpa", subject: "Databehandleravtale" },
        { type: "iso27001", subject: "ISO 27001-sertifikat" },
        { type: "soc2", subject: "SOC 2 Type II-rapport" },
      ];
      const items = shuffled.map((v, i) => ({
        matched_asset_id: v.id,
        matched_document_type: templates[i].type,
        subject: `${templates[i].subject} – ${v.name}`,
        file_name: `${templates[i].type}_${v.name.replace(/\s/g, "_")}.pdf`,
        sender_name: `Compliance – ${v.name}`,
        sender_email: `compliance@${v.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        confidence_score: +(0.88 + Math.random() * 0.1).toFixed(2),
        status: "new",
        received_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString(),
      }));
      const { error } = await supabase.from("lara_inbox").insert(items);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-total"] });
      toast.success("3 demo-elementer lagt til i innboksen");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke laste inn demo-data");
    } finally {
      setIsSeeding(false);
    }
  };

  const clearInbox = async () => {
    setIsClearing(true);
    try {
      await supabase.from("lara_inbox").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-total"] });
      toast.success("Innboksen er tømt");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke tømme innboksen");
    } finally {
      setIsClearing(false);
    }
  };

  const { data: inboxItems = [], isLoading } = useQuery({
    queryKey: ["lara-inbox-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lara_inbox")
        .select("*, assets:matched_asset_id(id, name, vendor, asset_type)")
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Document approve mutation (existing)
  const approveMutation = useMutation({
    mutationFn: async (item: any) => {
      await supabase.from("vendor_documents").insert({
        asset_id: item.matched_asset_id,
        file_name: item.file_name,
        file_path: item.file_path || "",
        document_type: item.matched_document_type || "other",
        source: "email_inbox",
        status: "current",
        received_at: item.received_at,
        notes: `Mottatt fra ${item.sender_name || item.sender_email}`,
      } as any);
      await supabase.from("lara_inbox").update({ status: "manually_assigned", processed_at: new Date().toISOString() } as any).eq("id", item.id);
    },
    onSuccess: (_data, item) => {
      const asset = item.assets || {};
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      setApprovedItem({
        fileName: item.file_name || item.subject || "",
        documentType: item.matched_document_type || "other",
        assetId: item.matched_asset_id,
        assetName: asset.name || "Ukjent leverandør",
        isIncident: false,
      });
    },
  });

  // Incident approve mutation (new)
  const approveIncidentMutation = useMutation({
    mutationFn: async (item: any) => {
      const severity = getSeverityFromFileName(item.file_name) || "medium";
      await supabase.from("system_incidents").insert({
        system_id: item.matched_asset_id,
        title: item.subject,
        description: item.file_path,
        risk_level: severity,
        criticality: severity,
        status: "open",
        source: "7security",
        source_incident_id: item.file_name?.replace(".json", "") || null,
        source_severity: severity,
        auto_created: true,
        category: "sikkerhetshendelse",
      } as any);
      await supabase.from("lara_inbox").update({ status: "manually_assigned", processed_at: new Date().toISOString() } as any).eq("id", item.id);
    },
    onSuccess: (_data, item) => {
      const asset = item.assets || {};
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      setApprovedItem({
        fileName: item.file_name || item.subject || "",
        documentType: item.matched_document_type || "incident",
        assetId: item.matched_asset_id,
        assetName: asset.name || "Ukjent system",
        isIncident: true,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await supabase.from("lara_inbox").update({ status: "rejected", processed_at: new Date().toISOString() } as any).eq("id", itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      toast.success("Forslag avvist");
    },
  });

  const pendingItems = inboxItems.filter((i: any) => i.status === "new" || i.status === "auto_matched");
  const processedItems = inboxItems.filter((i: any) => i.status === "manually_assigned" || i.status === "rejected");

  const isIncident = (item: any) => item.matched_document_type === "incident";

  const [showProcessed, setShowProcessed] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
            {/* Header — minimal */}
            <header className="flex items-end justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Innboks
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingItems.length === 0
                    ? "Alt er behandlet."
                    : `${pendingItems.length} ${pendingItems.length === 1 ? "element venter" : "elementer venter"} på godkjenning.`}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={isSeeding || isClearing}>
                    {(isSeeding || isClearing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={seedDemoInboxItems} disabled={isSeeding}>
                    <Database className="h-4 w-4 mr-2" />
                    Legg til demo-elementer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearInbox} disabled={isClearing} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Tøm innboksen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            {/* Pending list — flat, calm */}
            <section>
              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-md" />)}</div>
              ) : pendingItems.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-3 opacity-30" strokeWidth={1.5} />
                  <p className="text-sm">Ingen nye elementer.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {pendingItems.map((item: any) => {
                    const asset = item.assets;
                    const incident = isIncident(item);
                    const severity = incident ? getSeverityFromFileName(item.file_name) : null;
                    const sevConfig = severity ? SEVERITY_CONFIG[severity] : null;
                    const docLabel = DOC_TYPE_LABELS[item.matched_document_type] || item.matched_document_type;

                    return (
                      <li key={item.id} className="group py-4 flex items-start gap-4">
                        <div className="mt-0.5 text-muted-foreground">
                          {incident ? <ShieldAlert className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.subject || item.file_name}
                            </p>
                            {incident && sevConfig && (
                              <span className={`text-[11px] px-1.5 py-0.5 rounded ${sevConfig.className} border-0 bg-opacity-50`}>
                                {sevConfig.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {incident ? "Avvik for" : docLabel + " · "}
                            <button
                              onClick={() => asset?.id && navigate(`/assets/${asset.id}`)}
                              className="text-foreground/80 hover:text-primary hover:underline"
                            >
                              {asset?.name || "Ukjent"}
                            </button>
                            <span className="mx-1.5">·</span>
                            {new Date(item.received_at).toLocaleDateString(locale)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => rejectMutation.mutate(item.id)}
                            title="Avvis"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => incident ? approveIncidentMutation.mutate(item) : approveMutation.mutate(item)}
                            title={incident ? "Opprett avvik" : "Godkjenn"}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Processed — collapsed by default */}
            {processedItems.length > 0 && (
              <section className="pt-2">
                <button
                  onClick={() => setShowProcessed(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showProcessed ? "" : "-rotate-90"}`} />
                  Behandlet ({processedItems.length})
                </button>
                {showProcessed && (
                  <ul className="mt-3 divide-y divide-border/40">
                    {processedItems.map((item: any) => {
                      const asset = (item as any).assets;
                      const incident = isIncident(item);
                      return (
                        <li key={item.id} className="py-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                          {incident ? <ShieldAlert className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                          <span className="truncate flex-1">{item.subject || item.file_name}</span>
                          <span className="truncate">{asset?.name || "Ukjent"}</span>
                          <span className="text-[11px]">
                            {item.status === "manually_assigned" ? (incident ? "Avvik" : "Godkjent") : "Avvist"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>
        </main>
        <ApprovalSuccessDialog data={approvedItem} onClose={() => setApprovedItem(null)} />
      </div>
    </SidebarProvider>
  );
};

export default LaraInbox;
