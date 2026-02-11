import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Mail, Sparkles, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";

const DOC_TYPE_LABELS: Record<string, string> = {
  penetration_test: "Penetrasjonstest",
  dpa: "DPA / Databehandleravtale",
  iso27001: "ISO 27001-sertifikat",
  soc2: "SOC 2-rapport",
  dpia: "DPIA",
  nda: "NDA",
  other: "Dokument",
};

const LaraInbox = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = i18n.language === "nb" ? "nb-NO" : "en-US";

  // Fetch ALL inbox items with asset info
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      toast.success("Dokument godkjent og lagt til i profilen");
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
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
                  Dokumenter mottatt på e-post som Lara har analysert og foreslått matching for.
                </p>
              </div>
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
                    <p className="text-sm font-medium">Ingen ventende dokumenter</p>
                    <p className="text-xs mt-1">Lara vil varsle deg når nye dokumenter mottas.</p>
                  </div>
                ) : (
                  pendingItems.map((item: any) => {
                    const asset = item.assets;
                    return (
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

                              {/* Lara suggestion with asset link */}
                              <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <p className="text-xs">
                                  <span className="font-medium">Lara foreslår:</span> Koble til{" "}
                                  <button
                                    onClick={() => asset?.id && navigate(`/assets/${asset.id}`)}
                                    className="font-semibold text-primary hover:underline"
                                  >
                                    {asset?.name || "Ukjent leverandør"}
                                  </button>{" "}
                                  som{" "}
                                  <Badge variant="secondary" className="text-[10px] mx-0.5">
                                    {DOC_TYPE_LABELS[item.matched_document_type] || item.matched_document_type}
                                  </Badge>
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
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border opacity-60">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{item.file_name || item.subject}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.sender_name || item.sender_email} → {asset?.name || "Ukjent"}
                          </p>
                        </div>
                        <Badge variant={item.status === "manually_assigned" ? "default" : "secondary"} className="text-[10px]">
                          {item.status === "manually_assigned" ? "Godkjent" : "Avvist"}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default LaraInbox;
