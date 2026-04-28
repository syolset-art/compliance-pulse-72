import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Globe,
  Lock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { AddEvidenceDialog } from "@/components/trust-center/AddEvidenceDialog";
import { POLICY_TYPES, docTypeLabel } from "@/lib/trustDocumentTypes";

const statusBadge = (status: string | null, isNb: boolean) => {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-success/15 text-success border-success/30 text-[12px] gap-1 font-normal">
          <CheckCircle2 className="h-3 w-3" />
          {isNb ? "Godkjent" : "Verified"}
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[12px] gap-1 font-normal">
          <AlertTriangle className="h-3 w-3" />
          {isNb ? "Utløpt" : "Expired"}
        </Badge>
      );
    case "pending":
      return <Badge variant="secondary" className="text-[12px]">{isNb ? "Venter" : "Pending"}</Badge>;
    case "draft":
      return <Badge variant="secondary" className="text-[12px]">{isNb ? "Utkast" : "Draft"}</Badge>;
    default:
      return null;
  }
};

const TrustCenterPolicies = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "published" | "hidden">("all");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Get the org's self asset (same query pattern as Evidence page)
  const { data: asset } = useQuery({
    queryKey: ["self-asset-policies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_type", "self")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) return data;
      const { data: created, error } = await supabase
        .from("assets")
        .insert({ name: "Min organisasjon", asset_type: "self" })
        .select("id")
        .single();
      if (error) throw error;
      return created;
    },
  });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["vendor-documents-policies", asset?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id, document_type, file_name, file_path, status, created_at, valid_to, display_name, visibility")
        .eq("asset_id", asset!.id)
        .in("document_type", POLICY_TYPES)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("vendor_documents").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both this page and the Evidence page so they stay in sync
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-policies"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
    },
    onError: () => toast.error(isNb ? "Kunne ikke oppdatere" : "Failed to update"),
  });

  const openPreview = async (doc: any) => {
    if (!doc.file_path) return;
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("vendor-documents")
        .createSignedUrl(doc.file_path, 3600);
      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch {
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filtered = policies.filter((d: any) => {
    if (visibilityFilter === "all") return true;
    if (visibilityFilter === "published") return d.visibility === "published";
    return d.visibility !== "published";
  });

  const publishedCount = policies.filter((d: any) => d.visibility === "published").length;

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            {isNb ? "Retningslinjer" : "Policies"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {isNb
              ? "Administrer retningslinjer og policyer. Dokumenter merket som offentlige vises automatisk i Trust Profilen."
              : "Manage policies and guidelines. Documents marked as public are automatically shown in your Trust Profile."}
          </p>
        </div>
        <Button size="sm" className="gap-1.5 self-start" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          {isNb ? "Ny policy" : "New policy"}
        </Button>
      </div>

      {/* Status banner — relation to Trust Profile */}
      <Card className="mb-5 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {publishedCount}{" "}
                {isNb
                  ? `av ${policies.length} retningslinjer er offentlige`
                  : `of ${policies.length} policies are public`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Disse vises i Trust Profilen din under «Retningslinjer»."
                  : "These appear in your Trust Profile under \"Policies\"."}
              </p>
            </div>
          </div>
          <Tabs value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-6 px-2.5">{isNb ? "Alle" : "All"}</TabsTrigger>
              <TabsTrigger value="published" className="text-xs h-6 px-2.5">{isNb ? "Offentlig" : "Public"}</TabsTrigger>
              <TabsTrigger value="hidden" className="text-xs h-6 px-2.5">{isNb ? "Intern" : "Private"}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">
              {policies.length === 0
                ? isNb ? "Ingen retningslinjer ennå" : "No policies yet"
                : isNb ? "Ingen treff på filteret" : "No matches for filter"}
            </p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              {isNb
                ? "Legg til organisasjonens retningslinjer for å bygge tillit og oppfylle kompliansekrav."
                : "Add your organization's policies to build trust and meet compliance requirements."}
            </p>
            {policies.length === 0 && (
              <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                {isNb ? "Legg til din første retningslinje" : "Add your first policy"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((policy: any) => (
            <Card
              key={policy.id}
              className="hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => openPreview(policy)}
            >
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {policy.display_name || policy.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {docTypeLabel(policy.document_type, isNb)} ·{" "}
                      {isNb ? "Lagt til" : "Added"}{" "}
                      {new Date(policy.created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {statusBadge(policy.status, isNb)}
                  <div className="flex items-center gap-1.5">
                    {policy.visibility === "published" ? (
                      <Globe className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={`text-xs hidden sm:inline ${
                        policy.visibility === "published" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {policy.visibility === "published"
                        ? isNb ? "Offentlig" : "Public"
                        : isNb ? "Intern" : "Private"}
                    </span>
                    <Switch
                      checked={policy.visibility === "published"}
                      onCheckedChange={(checked) => {
                        const docName = policy.display_name || policy.file_name;
                        updateMutation.mutate(
                          {
                            id: policy.id,
                            updates: { visibility: checked ? "published" : "hidden" },
                          },
                          {
                            onSuccess: () => {
                              toast.success(
                                checked
                                  ? isNb
                                    ? `«${docName}» er nå offentlig i Trust Profilen`
                                    : `"${docName}" is now public in your Trust Profile`
                                  : isNb
                                    ? `«${docName}» er nå intern`
                                    : `"${docName}" is now private`
                              );
                            },
                          }
                        );
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <div className="flex flex-col min-h-screen bg-gradient-mynder">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">{content}</main>
        </div>
      ) : (
        <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          <main className="flex-1 h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">
            {content}
          </main>
        </div>
      )}

      {asset?.id && (
        <AddEvidenceDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          assetId={asset.id}
        />
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 pr-8">
              <span className="truncate">{previewDoc?.display_name || previewDoc?.file_name}</span>
              {previewUrl && (
                <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {isNb ? "Åpne i ny fane" : "Open in new tab"}
                  </a>
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-md border bg-muted">
            {previewLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full" title="preview" />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                {isNb ? "Forhåndsvisning ikke tilgjengelig" : "Preview not available"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrustCenterPolicies;
