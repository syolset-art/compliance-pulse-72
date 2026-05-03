import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Award, Calendar, CheckCircle2, AlertTriangle, FolderOpen, Loader2, Eye, EyeOff, Lock, Database, MoreHorizontal, Pencil, Trash2, ShieldCheck, Download, X as XIcon, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddEvidenceDialog } from "@/components/trust-center/AddEvidenceDialog";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POLICY_TYPES as policyTypes, CERT_TYPES as certTypes, docTypeLabel } from "@/lib/trustDocumentTypes";
import { RequiredArtifactsBlock } from "@/components/trust-center/RequiredArtifactsBlock";

const statusOptions = [
  { value: "draft", labelNb: "Utkast", labelEn: "Draft" },
  { value: "pending", labelNb: "Venter", labelEn: "Pending" },
  { value: "verified", labelNb: "Godkjent", labelEn: "Verified" },
  { value: "expired", labelNb: "Utløpt", labelEn: "Expired" },
];

const getStatusBadge = (status: string | null, isNb: boolean, approvedBy?: string | null) => {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-success/15 text-success border-success/30 text-[13px] gap-1" title={approvedBy ? `${isNb ? "Godkjent av" : "Approved by"} ${approvedBy}` : undefined}>
          <CheckCircle2 className="h-3 w-3" />{isNb ? "Godkjent" : "Verified"}
          {approvedBy && <span className="ml-0.5 opacity-70">({approvedBy})</span>}
        </Badge>
      );
    case "expiring":
      return <Badge className="bg-warning/15 text-warning border-warning/30 text-[13px] gap-1"><AlertTriangle className="h-3 w-3" />{isNb ? "Utløper snart" : "Expiring"}</Badge>;
    case "expired":
      return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[13px] gap-1"><AlertTriangle className="h-3 w-3" />{isNb ? "Utløpt" : "Expired"}</Badge>;
    case "pending":
      return <Badge variant="secondary" className="text-[13px]">{isNb ? "Venter" : "Pending"}</Badge>;
    case "draft":
      return <Badge variant="secondary" className="text-[13px]">{isNb ? "Utkast" : "Draft"}</Badge>;
    default:
      return status ? <Badge variant="outline" className="text-[13px]">{status}</Badge> : null;
  }
};

const getVisibilityBadge = (visibility: string | null, isNb: boolean) => {
  if (visibility === "published") {
    return (
      <Badge className="bg-success/10 text-success border-success/20 text-[12px] gap-1 font-normal">
        <Eye className="h-3 w-3" />
        {isNb ? "Offentlig" : "Public"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[12px] gap-1 font-normal text-muted-foreground">
      <Lock className="h-3 w-3" />
      {isNb ? "Intern" : "Private"}
    </Badge>
  );
};

const seedDemoEvidence = async (assetId: string) => {
  const now = new Date();
  const demoRows = [
    { asset_id: assetId, document_type: "privacy_policy", file_name: "personvernpolicy-2024.pdf", file_path: "demo/personvernpolicy-2024.pdf", display_name: "Personvernpolicy", status: "verified", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 90 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "security_policy", file_name: "infosec-policy-v3.pdf", file_path: "demo/infosec-policy-v3.pdf", display_name: "Informasjonssikkerhetspolicy", status: "verified", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 120 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "acceptable_use", file_name: "akseptabel-bruk.pdf", file_path: "demo/akseptabel-bruk.pdf", display_name: "Akseptabel bruk-policy", status: "verified", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 60 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "incident_response", file_name: "hendelsesplan-v2.pdf", file_path: "demo/hendelsesplan-v2.pdf", display_name: "Hendelseshåndteringsplan", status: "draft", visibility: "hidden", category: "policy", created_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "data_protection_policy", file_name: "databeskyttelse-policy.pdf", file_path: "demo/databeskyttelse-policy.pdf", display_name: "Databeskyttelsespolicy", status: "verified", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 200 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "policy", file_name: "generell-it-policy.pdf", file_path: "demo/generell-it-policy.pdf", display_name: "Generell IT-policy", status: "pending", visibility: "published", category: "policy", created_at: new Date(now.getTime() - 7 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "certification", file_name: "iso27001-sertifikat.pdf", file_path: "demo/iso27001-sertifikat.pdf", display_name: "ISO 27001:2022", status: "verified", visibility: "published", category: "certification", valid_to: new Date(now.getTime() + 300 * 86400000).toISOString().split("T")[0], created_at: new Date(now.getTime() - 180 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "certification", file_name: "soc2-type2-report.pdf", file_path: "demo/soc2-type2-report.pdf", display_name: "SOC 2 Type II", status: "verified", visibility: "published", category: "certification", valid_to: new Date(now.getTime() + 180 * 86400000).toISOString().split("T")[0], created_at: new Date(now.getTime() - 150 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "certification", file_name: "cyber-essentials-plus.pdf", file_path: "demo/cyber-essentials-plus.pdf", display_name: "Cyber Essentials Plus", status: "expiring", visibility: "published", category: "certification", valid_to: new Date(now.getTime() + 20 * 86400000).toISOString().split("T")[0], created_at: new Date(now.getTime() - 340 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "agreement", file_name: "databehandleravtale-2024.pdf", file_path: "demo/databehandleravtale-2024.pdf", display_name: "Databehandleravtale", status: "verified", visibility: "published", category: "document", created_at: new Date(now.getTime() - 45 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "report", file_name: "risikovurdering-q1.pdf", file_path: "demo/risikovurdering-q1.pdf", display_name: "Risikovurderingsrapport Q1 2025", status: "verified", visibility: "hidden", category: "document", created_at: new Date(now.getTime() - 30 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "evidence", file_name: "pentest-rapport-2025.pdf", file_path: "demo/pentest-rapport-2025.pdf", display_name: "Penetrasjonstestrapport", status: "pending", visibility: "hidden", category: "document", created_at: new Date(now.getTime() - 10 * 86400000).toISOString() },
    { asset_id: assetId, document_type: "other", file_name: "beredskapsplan.pdf", file_path: "demo/beredskapsplan.pdf", display_name: "Beredskapsplan", status: "draft", visibility: "hidden", category: "document", created_at: new Date(now.getTime() - 5 * 86400000).toISOString() },
  ];
  const { error } = await supabase.from("vendor_documents").insert(demoRows);
  if (error) throw error;
};

const TrustCenterEvidence = () => {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const queryClient = useQueryClient();

  // Edit state
  const [editDoc, setEditDoc] = useState<any>(null);
  // Delete state
  const [deleteDoc, setDeleteDoc] = useState<any>(null);
  // Approve dialog state (for verified status)
  const [approveDoc, setApproveDoc] = useState<any>(null);
  const [approverName, setApproverName] = useState("");
  // Preview state
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: asset } = useQuery({
    queryKey: ["self-asset-evidence"],
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

  const { data: vendorDocs = [], isLoading } = useQuery({
    queryKey: ["vendor-documents-evidence", asset?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id, document_type, file_name, status, created_at, valid_to, display_name, category, visibility, notes, approved_by, approved_at")
        .eq("asset_id", asset!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success(isNb ? "Dokument slettet" : "Document deleted");
      setDeleteDoc(null);
    },
    onError: () => toast.error(isNb ? "Kunne ikke slette" : "Failed to delete"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("vendor_documents").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      invalidate();
      if (!variables.updates.visibility) {
        toast.success(isNb ? "Oppdatert" : "Updated");
      }
    },
    onError: () => toast.error(isNb ? "Kunne ikke oppdatere" : "Failed to update"),
  });

  const handleStatusChange = (doc: any, newStatus: string) => {
    if (newStatus === "verified") {
      setApproveDoc(doc);
      setApproverName("");
    } else {
      updateMutation.mutate({ id: doc.id, updates: { status: newStatus, approved_by: null, approved_at: null } });
    }
  };

  const confirmApproval = () => {
    if (!approveDoc) return;
    updateMutation.mutate({
      id: approveDoc.id,
      updates: { status: "verified", approved_by: approverName || null, approved_at: new Date().toISOString() },
    });
    setApproveDoc(null);
  };

  const openPreview = async (doc: any) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.storage.from("vendor-documents").createSignedUrl(doc.file_path, 3600);
      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch {
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
  const isPdfFile = (name: string) => /\.pdf$/i.test(name);

  const saveEdit = () => {
    if (!editDoc) return;
    updateMutation.mutate({
      id: editDoc.id,
      updates: {
        display_name: editDoc.display_name,
        document_type: editDoc.document_type,
        valid_to: editDoc.valid_to || null,
        visibility: editDoc.visibility,
        notes: editDoc.notes || null,
      },
    });
    setEditDoc(null);
  };

  // Apply search and filters
  const filteredDocs = vendorDocs.filter((d: any) => {
    const matchesSearch = !searchQuery || 
      (d.display_name || d.file_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      docTypeLabel(d.document_type, isNb).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" ||
      (categoryFilter === "policy" && policyTypes.includes(d.document_type)) ||
      (categoryFilter === "certification" && certTypes.includes(d.document_type)) ||
      (categoryFilter === "document" && !policyTypes.includes(d.document_type) && !certTypes.includes(d.document_type));
    const matchesVisibility = visibilityFilter === "all" ||
      (visibilityFilter === "published" && d.visibility === "published") ||
      (visibilityFilter === "hidden" && d.visibility !== "published");
    return matchesSearch && matchesCategory && matchesVisibility;
  });

  const policies = filteredDocs.filter((d: any) => policyTypes.includes(d.document_type));
  const certifications = filteredDocs.filter((d: any) => certTypes.includes(d.document_type));
  const documents = filteredDocs.filter((d: any) => !policyTypes.includes(d.document_type) && !certTypes.includes(d.document_type));

  const renderActionMenu = (doc: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setEditDoc({ ...doc })}>
          <Pencil className="h-3.5 w-3.5 mr-2" />
          {isNb ? "Rediger" : "Edit"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setDeleteDoc(doc)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          {isNb ? "Slett" : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderDocRow = (doc: any, icon: React.ReactNode) => (
    <Card key={doc.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => openPreview(doc)}>
      <CardContent className="flex items-center justify-between py-4 px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{doc.display_name || doc.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {docTypeLabel(doc.document_type, isNb)} · {isNb ? "Opprettet" : "Created"} {new Date(doc.created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
              {doc.valid_to && <> · {isNb ? "Utløper" : "Expires"} {new Date(doc.valid_to).toLocaleDateString(isNb ? "nb-NO" : "en-US")}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  {doc.visibility === "published" ? (
                    <Globe className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={`text-xs min-w-[42px] ${doc.visibility === "published" ? "text-primary" : "text-muted-foreground"}`}>
                    {doc.visibility === "published" ? (isNb ? "Offentlig" : "Public") : (isNb ? "Intern" : "Private")}
                  </span>
                  <Switch
                    checked={doc.visibility === "published"}
                    onCheckedChange={(checked) => {
                      const docName = doc.display_name || doc.file_name;
                      updateMutation.mutate({
                        id: doc.id,
                        updates: { visibility: checked ? "published" : "hidden" },
                      }, {
                        onSuccess: () => {
                          if (checked) {
                            toast.success(
                              isNb ? `«${docName}» er nå offentlig` : `"${docName}" is now public`,
                              { description: isNb ? "Dokumentet er synlig i din Trust Profile og kan ses av kunder og partnere." : "The document is visible in your Trust Profile and can be viewed by customers and partners." }
                            );
                          } else {
                            toast(
                              isNb ? `«${docName}» er nå intern` : `"${docName}" is now private`,
                              { description: isNb ? "Dokumentet er skjult fra Trust Profile og kun synlig for ditt team." : "The document is hidden from your Trust Profile and only visible to your team." }
                            );
                          }
                        }
                      });
                    }}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{doc.visibility === "published"
                  ? (isNb ? "Synlig i Trust Profile — klikk for å skjule" : "Visible in Trust Profile — click to hide")
                  : (isNb ? "Skjult fra Trust Profile — klikk for å publisere" : "Hidden from Trust Profile — click to publish")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {renderActionMenu(doc)}
        </div>
      </CardContent>
    </Card>
  );

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            {isNb ? "Dokumentasjon og bevis" : "Documentation and Evidence"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {isNb
              ? "Her samler du alle retningslinjer, sertifiseringer og dokumenter som underbygger organisasjonens compliance. Dokumentene fungerer som bevis for kontrollene i din Trust Profile og påvirker Trust Score direkte."
              : "Collect all policies, certifications and documents that support your organization's compliance. Documents serve as evidence for the controls in your Trust Profile and directly impact your Trust Score."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            disabled={seeding}
            onClick={async () => {
              if (!asset?.id) return;
              setSeeding(true);
              try {
                await seedDemoEvidence(asset.id);
                await invalidate();
                toast.success(isNb ? "Demo-data lagt til" : "Demo data added");
              } catch (e) {
                toast.error(isNb ? "Kunne ikke legge til demo-data" : "Failed to add demo data");
              } finally {
                setSeeding(false);
              }
            }}
          >
            {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
            Demo
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            {isNb ? "Legg til" : "Add"}
          </Button>
        </div>
      </div>

      {/* Trust Profile summary */}
      {vendorDocs.length > 0 && !isLoading && (
        <div className="mb-6 flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Eye className="h-4 w-4 text-success" />
            <span className="font-medium">{vendorDocs.filter((d: any) => d.visibility === "published").length}</span>
            <span className="text-muted-foreground">{isNb ? "publisert i Trust Profile" : "published to Trust Profile"}</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1.5 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{vendorDocs.filter((d: any) => d.visibility !== "published").length}</span>
            <span className="text-muted-foreground">{isNb ? "kun internt" : "internal only"}</span>
          </div>
        </div>
      )}

      {/* Required artifacts checklist */}
      {!isLoading && asset?.id && (
        <div className="mb-6">
          <RequiredArtifactsBlock assetId={asset.id} vendorDocs={vendorDocs as any} variant="evidence" />
        </div>
      )}

      {/* Search and filters */}
      {vendorDocs.length > 0 && !isLoading && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isNb ? "Søk i dokumenter..." : "Search documents..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isNb ? "Alle kategorier" : "All categories"}</SelectItem>
              <SelectItem value="policy">{isNb ? "Retningslinjer" : "Policies"}</SelectItem>
              <SelectItem value="certification">{isNb ? "Sertifiseringer" : "Certifications"}</SelectItem>
              <SelectItem value="document">{isNb ? "Dokumenter" : "Documents"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isNb ? "Alle" : "All"}</SelectItem>
              <SelectItem value="published">{isNb ? "Offentlig" : "Public"}</SelectItem>
              <SelectItem value="hidden">{isNb ? "Intern" : "Private"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : vendorDocs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">{isNb ? "Ingen dokumenter registrert ennå." : "No documents registered yet."}</p>
      ) : (
        <div className="space-y-8">
          {policies.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {isNb ? "Retningslinjer" : "Policies"}
                <Badge variant="secondary" className="text-[13px] px-1.5">{policies.length}</Badge>
              </h2>
              <div className="space-y-2">{policies.map((doc: any) => renderDocRow(doc, <FileText className="h-4 w-4 text-primary" />))}</div>
            </section>
          )}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                {isNb ? "Sertifiseringer" : "Certifications"}
                <Badge variant="secondary" className="text-[13px] px-1.5">{certifications.length}</Badge>
              </h2>
              <div className="space-y-2">{certifications.map((doc: any) => renderDocRow(doc, <Award className="h-4 w-4 text-primary" />))}</div>
            </section>
          )}
          {documents.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {isNb ? "Dokumenter" : "Documents"}
                <Badge variant="secondary" className="text-[13px] px-1.5">{documents.length}</Badge>
              </h2>
              <div className="space-y-2">{documents.map((doc: any) => renderDocRow(doc, <FolderOpen className="h-4 w-4 text-primary" />))}</div>
            </section>
          )}
        </div>
      )}

      {asset?.id && <AddEvidenceDialog open={dialogOpen} onOpenChange={setDialogOpen} assetId={asset.id} />}

      {/* Edit Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isNb ? "Rediger dokument" : "Edit document"}</DialogTitle>
          </DialogHeader>
          {editDoc && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isNb ? "Visningsnavn" : "Display name"}</Label>
                <Input value={editDoc.display_name || ""} onChange={(e) => setEditDoc({ ...editDoc, display_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{isNb ? "Dokumenttype" : "Document type"}</Label>
                <Select value={editDoc.document_type} onValueChange={(v) => setEditDoc({ ...editDoc, document_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys({ policy: 1, privacy_policy: 1, acceptable_use: 1, incident_response: 1, security_policy: 1, data_protection_policy: 1, certification: 1, agreement: 1, report: 1, evidence: 1, other: 1 }).map((t) => (
                      <SelectItem key={t} value={t}>{docTypeLabel(t, isNb)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isNb ? "Utløpsdato" : "Expiry date"}</Label>
                <Input type="date" value={editDoc.valid_to || ""} onChange={(e) => setEditDoc({ ...editDoc, valid_to: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{isNb ? "Synlighet" : "Visibility"}</Label>
                <Select value={editDoc.visibility || "hidden"} onValueChange={(v) => setEditDoc({ ...editDoc, visibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">{isNb ? "Publisert" : "Published"}</SelectItem>
                    <SelectItem value="hidden">{isNb ? "Skjult" : "Hidden"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isNb ? "Notater" : "Notes"}</Label>
                <Textarea value={editDoc.notes || ""} onChange={(e) => setEditDoc({ ...editDoc, notes: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>{isNb ? "Avbryt" : "Cancel"}</Button>
            <Button onClick={saveEdit}>{isNb ? "Lagre" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isNb ? "Slett dokument" : "Delete document"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isNb
                ? `Er du sikker på at du vil slette "${deleteDoc?.display_name || deleteDoc?.file_name}"? Denne handlingen kan ikke angres.`
                : `Are you sure you want to delete "${deleteDoc?.display_name || deleteDoc?.file_name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isNb ? "Avbryt" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDoc && deleteMutation.mutate(deleteDoc.id)}
            >
              {isNb ? "Slett" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveDoc} onOpenChange={(open) => !open && setApproveDoc(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isNb ? "Godkjenn dokument" : "Approve document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isNb ? "Hvem godkjenner dette dokumentet?" : "Who is approving this document?"}
            </p>
            <Input
              placeholder={isNb ? "Navn på godkjenner" : "Approver name"}
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDoc(null)}>{isNb ? "Avbryt" : "Cancel"}</Button>
            <Button onClick={confirmApproval}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {isNb ? "Godkjenn" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) { setPreviewDoc(null); setPreviewUrl(null); } }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDoc?.display_name || previewDoc?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            {previewLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewUrl && previewDoc ? (
              isPdfFile(previewDoc.file_name) ? (
                <iframe src={previewUrl} className="w-full h-[70vh] rounded border" title={previewDoc.display_name || previewDoc.file_name} />
              ) : isImageFile(previewDoc.file_name) ? (
                <img src={previewUrl} alt={previewDoc.display_name || previewDoc.file_name} className="max-w-full max-h-[70vh] mx-auto rounded" />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <FolderOpen className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{isNb ? "Forhåndsvisning ikke tilgjengelig for denne filtypen." : "Preview not available for this file type."}</p>
                  <Button asChild>
                    <a href={previewUrl} download={previewDoc.file_name} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-1.5" />
                      {isNb ? "Last ned" : "Download"}
                    </a>
                  </Button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <p className="text-sm text-muted-foreground">{isNb ? "Kunne ikke laste filen." : "Could not load the file."}</p>
              </div>
            )}
          </div>
          {previewUrl && previewDoc && (isPdfFile(previewDoc.file_name) || isImageFile(previewDoc.file_name)) && (
            <DialogFooter>
              <Button variant="outline" asChild>
                <a href={previewUrl} download={previewDoc.file_name} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1.5" />
                  {isNb ? "Last ned" : "Download"}
                </a>
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">{content}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <div className="w-64 flex-shrink-0"><Sidebar /></div>
      <main className="flex-1 h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">{content}</main>
    </div>
  );
};

export default TrustCenterEvidence;
