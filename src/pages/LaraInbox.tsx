import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Mail, Sparkles, FileText, AlertTriangle, ShieldAlert, Database, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";
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
  critical: { label: "Kritisk", className: "bg-red-500/15 text-red-700 border-red-500/30" },
  high: { label: "Høy", className: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  medium: { label: "Middels", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  low: { label: "Lav", className: "bg-green-500/15 text-green-700 border-green-500/30" },
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={laraButterfly} alt="Lara" className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                    Lara Innboks
                    {pendingItems.length > 0 && (
                      <Badge className="bg-primary/15 text-primary border-primary/30">{pendingItems.length} nye</Badge>
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Dokumenter og hendelser mottatt fra leverandører, analysert og foreslått av Lara.
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isSeeding || isClearing}>
                    {(isSeeding || isClearing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    Demo-data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={seedDemoInboxItems} disabled={isSeeding}>
                    <Database className="h-4 w-4 mr-2" />
                    Legg til 3 demo-elementer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearInbox} disabled={isClearing} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Tøm innboksen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Pending items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Ventende godkjenning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}</div>
                ) : pendingItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">Ingen ventende elementer</p>
                    <p className="text-xs mt-1">Lara vil varsle deg når nye dokumenter eller hendelser mottas.</p>
                  </div>
                ) : (
                  pendingItems.map((item: any) => {
                    const asset = item.assets;
                    const incident = isIncident(item);
                    const severity = incident ? getSeverityFromFileName(item.file_name) : null;
                    const sevConfig = severity ? SEVERITY_CONFIG[severity] : null;

                    return (
                      <div key={item.id} className={`p-4 rounded-lg border bg-card hover:shadow-sm transition-all ${incident ? "border-orange-500/30" : "border-border"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${incident ? "bg-orange-500/10" : "bg-primary/10"}`}>
                              {incident ? (
                                <ShieldAlert className="h-4 w-4 text-orange-600" />
                              ) : (
                                <FileText className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{item.subject || item.file_name}</p>
                                {incident && sevConfig && (
                                  <Badge className={`text-[10px] ${sevConfig.className}`}>{sevConfig.label}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Fra: {item.sender_name || item.sender_email} · {new Date(item.received_at).toLocaleDateString(locale)}
                              </p>
                              {incident && item.file_path && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.file_path}</p>
                              )}

                              {/* Lara suggestion */}
                              <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <p className="text-xs">
                                  <span className="font-medium">Lara foreslår:</span>{" "}
                                  {incident ? "Opprett avvik for" : "Koble til"}{" "}
                                  <button
                                    onClick={() => asset?.id && navigate(`/assets/${asset.id}`)}
                                    className="font-semibold text-primary hover:underline"
                                  >
                                    {asset?.name || "Ukjent leverandør"}
                                  </button>{" "}
                                  {!incident && (
                                    <>
                                      som{" "}
                                      <Badge variant="secondary" className="text-[10px] mx-0.5">
                                        {DOC_TYPE_LABELS[item.matched_document_type] || item.matched_document_type}
                                      </Badge>
                                    </>
                                  )}
                                </p>
                                {item.confidence_score && (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] ml-auto flex-shrink-0">
                                    {Math.round(item.confidence_score * 100)}% sikker
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              size="sm"
                              className={`h-8 text-xs ${incident ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                              onClick={() => incident ? approveIncidentMutation.mutate(item) : approveMutation.mutate(item)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              {incident ? "Opprett avvik" : "Godkjenn"}
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => rejectMutation.mutate(item.id)}>
                              <X className="h-3.5 w-3.5 mr-1" />
                              Avvis
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                  {processedItems.map((item: any) => {
                    const asset = (item as any).assets;
                    const incident = isIncident(item);
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border opacity-60">
                        {incident ? (
                          <ShieldAlert className="h-4 w-4 text-orange-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{item.subject || item.file_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.sender_name || item.sender_email} → {asset?.name || "Ukjent"}
                          </p>
                        </div>
                        <Badge variant={item.status === "manually_assigned" ? "default" : "secondary"} className="text-[10px]">
                          {item.status === "manually_assigned" ? (incident ? "Avvik opprettet" : "Godkjent") : "Avvist"}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <ApprovalSuccessDialog data={approvedItem} onClose={() => setApprovedItem(null)} />
      </div>
    </SidebarProvider>
  );
};

export default LaraInbox;
