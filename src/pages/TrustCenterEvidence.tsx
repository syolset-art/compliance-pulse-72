import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Award, Calendar, CheckCircle2, AlertTriangle, FolderOpen, Loader2, Eye, EyeOff, Lock, Database, MoreHorizontal, Pencil, Trash2, ShieldCheck, Download, X as XIcon, Globe, ChevronDown, ChevronRight, Info, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvidenceUploadDialog } from "@/components/trust-controls/EvidenceUploadDialog";
import { EvidenceStatusPill } from "@/components/trust-controls/EvidenceStatusPill";
import { ConfirmAsEvidenceDialog } from "@/components/trust-controls/ConfirmAsEvidenceDialog";
import { AddVerificationDialog } from "@/components/trust-controls/AddVerificationDialog";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { POLICY_TYPES as policyTypes, CERT_TYPES as certTypes, EVIDENCE_TYPES as evidenceTypes, docTypeLabel } from "@/lib/trustDocumentTypes";
import { FrameworkDocumentCoverage } from "@/components/trust-center/FrameworkDocumentCoverage";
import { buildComplianceCoverage } from "@/lib/complianceDocumentCoverage";
import { EvidenceCoverageHeader } from "@/components/trust-center/EvidenceCoverageHeader";
import { EvidenceGapPanel } from "@/components/trust-center/EvidenceGapPanel";
import { buildEvidenceIntelligence } from "@/lib/evidenceIntelligence";
import { useDocumentHub } from "@/hooks/useDocumentHub";
import { MODULE_LABELS, MODULE_ROUTES } from "@/lib/documentHub";

import { DocumentComplianceCard } from "@/components/trust-center/DocumentComplianceCard";
import { DocumentAccessDialog } from "@/components/trust-center/DocumentAccessDialog";
import { Network, Users } from "lucide-react";
import { SaraEvidencePromo } from "@/components/agents/SaraEvidencePromo";
import { useSaraAgent } from "@/lib/saraAgent";
import { SaraIcon } from "@/components/agents/SaraIcon";

// localStorage helpers for collapsible UI state
const LS_REQUIRED_OPEN = "trust.evidence.required.open";
const LS_SECTIONS_OPEN = "trust.evidence.sections.open";
const readBoolLS = (key: string, fallback: boolean): boolean => {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === "1"; } catch { return fallback; }
};
const writeBoolLS = (key: string, value: boolean) => {
  try { localStorage.setItem(key, value ? "1" : "0"); } catch {}
};
const readSectionsLS = (): Record<string, boolean> => {
  try { const v = localStorage.getItem(LS_SECTIONS_OPEN); return v ? JSON.parse(v) : {}; } catch { return {}; }
};
const writeSectionsLS = (v: Record<string, boolean>) => {
  try { localStorage.setItem(LS_SECTIONS_OPEN, JSON.stringify(v)); } catch {}
};

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
  const [saraOnboardingOpen, setSaraOnboardingOpen] = useState(false);
  const { installed: saraInstalled } = useSaraAgent();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [activeMainTab, setActiveMainTab] = useState<"documents" | "access">("documents");
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<"all" | "upload" | "agent">("all");
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
  // Access dialog state
  const [accessDoc, setAccessDoc] = useState<any>(null);
  const [confirmDoc, setConfirmDoc] = useState<any>(null);
  const [verifyDoc, setVerifyDoc] = useState<any>(null);
  // Collapsible UI state
  const [requiredOpen, setRequiredOpen] = useState<boolean>(() => readBoolLS(LS_REQUIRED_OPEN, true));
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>(() => readSectionsLS());
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => { writeBoolLS(LS_REQUIRED_OPEN, requiredOpen); }, [requiredOpen]);
  useEffect(() => { writeSectionsLS(sectionsOpen); }, [sectionsOpen]);
  const toggleSection = (key: string, fallbackOpen: boolean) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !(prev[key] ?? fallbackOpen) }));
  };
  const activeFilterCount = (categoryFilter !== "all" ? 1 : 0) + (visibilityFilter !== "all" ? 1 : 0);

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
      const { data } = await (supabase as any)
        .from("vendor_documents")
        .select("id, document_type, file_name, file_path, status, created_at, updated_at, valid_to, valid_from, version, display_name, category, visibility, notes, approved_by, approved_at, external_url, available_on_request, reviewed_at, reviewed_by")
        .eq("asset_id", asset!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!asset?.id,
  });

  const docIds = (vendorDocs as any[]).map((d: any) => d.id);
  const { data: grantsRows = [] } = useQuery({
    queryKey: ["vendor-document-grants", asset?.id, docIds.length],
    queryFn: async () => {
      if (docIds.length === 0) return [];
      const { data } = await (supabase as any)
        .from("trust_document_grants")
        .select("document_id, recipient_name, recipient_email, granted_at")
        .in("document_id", docIds)
        .is("revoked_at", null)
        .order("granted_at", { ascending: false });
      return data || [];
    },
    enabled: docIds.length > 0,
  });

  // Aktiverte regelverk → påkrevd compliance-dokumentasjon
  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-evidence"],
    queryFn: async () => {
      const { data } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name, is_selected")
        .eq("is_selected", true);
      return data || [];
    },
  });

  // Alle dokumenter i plattformen (Trust Center, leverandør, regelverk, arbeidsområde)
  const { documents: hubDocuments } = useDocumentHub();

  const frameworkRefs = useMemo(
    () => (frameworks as any[]).map((f) => ({ framework_id: f.framework_id, framework_name: f.framework_name })),
    [frameworks],
  );

  const intel = useMemo(
    () => buildEvidenceIntelligence(frameworkRefs, hubDocuments, selectedFrameworkIds),
    [frameworkRefs, hubDocuments, selectedFrameworkIds],
  );
  const coverage = intel.coverage;

  const toggleFramework = (id: string) =>
    setSelectedFrameworkIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /** Dokumenter fra andre moduler enn Trust Center — vises som lesbar oversikt. */
  const platformRows = useMemo(() => {
    const ownIds = new Set((vendorDocs as any[]).map((d) => d.id));
    return intel.rows
      .filter((r) => !ownIds.has(r.doc.id))
      .filter((r) => sourceFilter === "all" || r.sourceKind === sourceFilter)
      .filter(
        (r) =>
          selectedFrameworkIds.length === 0 ||
          r.requirements.some((q) => selectedFrameworkIds.includes(q.frameworkId)),
      )
      .sort((a, b) => b.requirements.length - a.requirements.length);
  }, [intel.rows, vendorDocs, sourceFilter, selectedFrameworkIds]);




  const grantsByDoc = (grantsRows as any[]).reduce<Record<string, number>>((acc, r) => {
    acc[r.document_id] = (acc[r.document_id] || 0) + 1;
    return acc;
  }, {});

  // Aggregate by recipient for the "Tilganger" tab
  const grantsByRecipient = (grantsRows as any[]).reduce<Record<string, { name: string; email: string; documents: string[]; latest: string }>>((acc, r) => {
    const key = (r.recipient_email || r.recipient_name || "ukjent").toLowerCase();
    if (!acc[key]) {
      acc[key] = { name: r.recipient_name || r.recipient_email || "—", email: r.recipient_email || "", documents: [], latest: r.granted_at };
    }
    const doc = (vendorDocs as any[]).find((d: any) => d.id === r.document_id);
    if (doc) acc[key].documents.push(doc.display_name || doc.file_name);
    if (r.granted_at > acc[key].latest) acc[key].latest = r.granted_at;
    return acc;
  }, {});

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
    queryClient.invalidateQueries({ queryKey: ["vendor-document-grants"] });
  };

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

  const markReviewedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;
      const { error } = await (supabase as any)
        .from("vendor_documents")
        .update({
          valid_from: new Date().toISOString().split("T")[0],
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq("id", id);
      if (error) throw error;
      return userData?.user?.email ?? null;
    },
    onSuccess: (email) => {
      invalidate();
      toast.success(
        isNb
          ? `Markert som gjennomgått${email ? ` av ${email}` : ""}. Neste anbefalte gjennomgang om 12 mnd.`
          : `Marked as reviewed${email ? ` by ${email}` : ""}. Next recommended review in 12 months.`,
      );
      setEditDoc(null);
    },
    onError: () => toast.error(isNb ? "Kunne ikke markere som gjennomgått" : "Failed to mark as reviewed"),
  });

  // Apply search and filters
  const filteredDocs = vendorDocs.filter((d: any) => {
    const matchesSearch = !searchQuery || 
      (d.display_name || d.file_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      docTypeLabel(d.document_type, isNb).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" ||
      (categoryFilter === "policy" && policyTypes.includes(d.document_type)) ||
      (categoryFilter === "certification" && certTypes.includes(d.document_type)) ||
      (categoryFilter === "evidence" && evidenceTypes.includes(d.document_type)) ||
      (categoryFilter === "document" && !policyTypes.includes(d.document_type) && !certTypes.includes(d.document_type) && !evidenceTypes.includes(d.document_type));
    const matchesVisibility = visibilityFilter === "all" ||
      (visibilityFilter === "published" && d.visibility === "published") ||
      (visibilityFilter === "ecosystem" && d.visibility === "ecosystem") ||
      (visibilityFilter === "restricted" && d.visibility !== "published" && d.visibility !== "ecosystem" && (grantsByDoc[d.id] || 0) > 0) ||
      (visibilityFilter === "hidden" && d.visibility !== "published" && d.visibility !== "ecosystem" && !(grantsByDoc[d.id] > 0));
    const sourceKind = intel.rows.find((r) => r.doc.id === d.id)?.sourceKind ?? "upload";
    const matchesSource = sourceFilter === "all" || sourceKind === sourceFilter;
    const mapped = intel.rows.find((r) => r.doc.id === d.id)?.requirements ?? [];
    const matchesFramework =
      selectedFrameworkIds.length === 0 || mapped.some((m) => selectedFrameworkIds.includes(m.frameworkId));
    return matchesSearch && matchesCategory && matchesVisibility && matchesSource && matchesFramework;

  });

  const policies = filteredDocs.filter((d: any) => policyTypes.includes(d.document_type));
  const certifications = filteredDocs.filter((d: any) => certTypes.includes(d.document_type));
  const evidenceDocs = filteredDocs.filter((d: any) => evidenceTypes.includes(d.document_type));
  const documents = filteredDocs.filter((d: any) => !policyTypes.includes(d.document_type) && !certTypes.includes(d.document_type) && !evidenceTypes.includes(d.document_type));

  const renderActionMenu = (doc: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!["confirmed","attested","verified","evidence"].includes(doc.evidence_status ?? "") && (
          <DropdownMenuItem onClick={() => setConfirmDoc(doc)}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-success" />
            {isNb ? "Bekreft som bevis" : "Confirm as evidence"}
          </DropdownMenuItem>
        )}
        {doc.evidence_status !== "verified" && (
          <DropdownMenuItem onClick={() => setVerifyDoc(doc)}>
            <ShieldCheck className="h-3.5 w-3.5 mr-2 text-primary" />
            {isNb ? "Legg til verifikasjon" : "Add verification"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
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

  const isSaraSourced = (doc: any) =>
    ["sara", "agent", "local_agent"].includes(String(doc.source ?? doc.origin ?? "").toLowerCase()) ||
    String(doc.file_path ?? "").startsWith("sara/");

  const renderDocRow = (doc: any, icon: React.ReactNode) => (
    <Card key={doc.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => openPreview(doc)}>
      <CardContent className="flex items-center justify-between py-4 px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {isSaraSourced(doc) ? (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span><SaraIcon size={20} /></span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-[12px]">
                    {isNb ? "Hentet av Sara – lokal agent" : "Collected by Sara – local agent"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{doc.display_name || doc.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {docTypeLabel(doc.document_type, isNb)} · {isNb ? "Opprettet" : "Created"} {new Date(doc.created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
              {doc.valid_to && <> · {isNb ? "Utløper" : "Expires"} {new Date(doc.valid_to).toLocaleDateString(isNb ? "nb-NO" : "en-US")}</>}
            </p>
            {(() => {
              const mapped = intel.rows.find((r) => r.doc.id === doc.id)?.requirements ?? [];
              if (mapped.length === 0) {
                return (
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                    {isNb ? "Ikke kartlagt mot krav" : "Not mapped to requirements"}
                  </p>
                );
              }
              const fws = Array.from(new Set(mapped.map((m) => m.frameworkName)));
              return (
                <p className="mt-0.5 truncate text-[11px] text-primary">
                  {isNb
                    ? `Kartlagt mot ${mapped.length} krav · ${fws.join(", ")}`
                    : `Mapped to ${mapped.length} requirement${mapped.length === 1 ? "" : "s"} · ${fws.join(", ")}`}
                </p>
              );
            })()}

          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <EvidenceStatusPill status={(doc.evidence_status as any) || "draft"} size="sm" />
          {(() => {
            const count = grantsByDoc[doc.id] || 0;
            const isPublic = doc.visibility === "published";
            const isEcosystem = doc.visibility === "ecosystem";
            const isRestricted = !isPublic && !isEcosystem && count > 0;
            const Icon = isPublic ? Globe : isEcosystem ? Network : isRestricted ? Users : Lock;
            const label = isPublic
              ? (isNb ? "Offentlig" : "Public")
              : isEcosystem
                ? (isNb ? "Økosystem" : "Ecosystem")
                : isRestricted
                  ? (isNb ? `${count} mottaker${count === 1 ? "" : "e"}` : `${count} recipient${count === 1 ? "" : "s"}`)
                  : (isNb ? "Intern" : "Private");
            const tone = isPublic
              ? "text-success border-success/30 bg-success/10"
              : isEcosystem
                ? "text-primary border-primary/30 bg-primary/10"
                : isRestricted
                  ? "text-foreground border-border bg-muted/60"
                  : "text-muted-foreground border-border";
            const tip = isPublic
              ? (isNb ? "Synlig for alle på Trust Profile" : "Visible to everyone on Trust Profile")
              : isEcosystem
                ? (isNb ? "Synlig for innloggede kunder og partnere" : "Visible to signed-in customers and partners")
                : isRestricted
                  ? (isNb ? "Synlig for utvalgte mottakere" : "Visible to selected recipients")
                  : (isNb ? "Kun synlig internt — klikk for å gi tilgang" : "Internal only — click to grant access");
            return (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setAccessDoc(doc)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80 ${tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{tip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })()}
          {renderActionMenu(doc)}
        </div>
      </CardContent>
    </Card>
  );

  const content = (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {isNb ? "Dokumentasjon og bevis" : "Documentation and Evidence"}
            </h1>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" aria-label={isNb ? "Mer info" : "More info"}>
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <p className="text-xs leading-relaxed">
                    {isNb
                      ? "Her samler du alle retningslinjer, sertifiseringer og dokumenter som underbygger organisasjonens compliance. Dokumentene fungerer som bevis for kontrollene i din Trust Profile og påvirker Trust Score direkte."
                      : "Collect all policies, certifications and documents that support your organization's compliance. Documents serve as evidence for the controls in your Trust Profile and directly impact your Trust Score."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
          {!saraInstalled && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSaraOnboardingOpen(true)}>
              <Download className="h-4 w-4" />
              {isNb ? "Installer Sara" : "Install Sara"}
            </Button>
          )}
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            {isNb ? "Legg til" : "Add"}
          </Button>
        </div>
      </div>

      <SaraEvidencePromo
        onboardingOpen={saraOnboardingOpen}
        onOnboardingOpenChange={setSaraOnboardingOpen}
      />

      {/* Trust Profile summary — three states */}
      {vendorDocs.length > 0 && !isLoading && (() => {
        const publicCount = vendorDocs.filter((d: any) => d.visibility === "published").length;
        const ecosystemCount = vendorDocs.filter((d: any) => d.visibility === "ecosystem").length;
        const restrictedCount = vendorDocs.filter((d: any) =>
          d.visibility !== "published" && d.visibility !== "ecosystem" && (grantsByDoc[d.id] || 0) > 0
        ).length;
        const internalCount = vendorDocs.filter((d: any) =>
          d.visibility !== "published" && d.visibility !== "ecosystem" && !(grantsByDoc[d.id] > 0)
        ).length;
        const sharedCount = ecosystemCount + restrictedCount;
        const setFilter = (v: string) => { setVisibilityFilter(v); setActiveMainTab("documents"); };
        return (
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
            <button type="button" onClick={() => setFilter("published")} className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity">
              <Globe className="h-4 w-4 text-success" />
              <span className="font-semibold">{publicCount}</span>
              <span className="text-muted-foreground">{isNb ? "offentlig" : "public"}</span>
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button type="button" onClick={() => setFilter("restricted")} className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold">{sharedCount}</span>
              <span className="text-muted-foreground">{isNb ? "delt med utvalgte" : "shared with selected"}</span>
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button type="button" onClick={() => setFilter("hidden")} className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{internalCount}</span>
              <span className="text-muted-foreground">{isNb ? "kun internt" : "internal only"}</span>
            </button>
          </div>
        );
      })()}

      {/* Main tabs: Documents | Access */}
      {vendorDocs.length > 0 && !isLoading && (
        <div className="mb-5 border-b">
          <div className="flex items-center gap-6">
            {([
              { id: "documents" as const, nb: "Dokumenter", en: "Documents" },
              { id: "access" as const, nb: "Tilganger", en: "Access" },
            ]).map((t) => {
              const active = activeMainTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveMainTab(t.id)}
                  className={`relative py-2.5 text-sm font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {isNb ? t.nb : t.en}
                  {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Zone 1 + 2: dekningsbilde og gap mot aktiverte regelverk */}
      {!isLoading && activeMainTab === "documents" && (
        <>
          <EvidenceCoverageHeader
            intel={intel}
            frameworks={frameworkRefs}
            selected={selectedFrameworkIds}
            onToggleFramework={toggleFramework}
            onClearFrameworks={() => setSelectedFrameworkIds([])}
            sourceFilter={sourceFilter}
            onSourceFilter={setSourceFilter}
          />
          <EvidenceGapPanel
            coverage={coverage}
            saraInstalled={saraInstalled}
            onUpload={() => setDialogOpen(true)}
            onAskSara={(name) =>
              toast.success(
                isNb
                  ? `Sara ser etter dokumentasjon for «${name}» ved neste kjøring.`
                  : `Sara will look for documentation for "${name}" on the next run.`,
              )
            }

            onOpenDoc={(id) => {
              const doc = (vendorDocs as any[]).find((d) => d.id === id);
              if (doc) openPreview(doc);
            }}
          />
        </>
      )}



      {/* Documents tab content */}
      {activeMainTab === "documents" && (
        <>
          {vendorDocs.length > 0 && !isLoading && (
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {isNb ? "Alle dokumenter" : "All documents"}
            </h2>
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
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 relative">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {isNb ? "Filter" : "Filter"}
                    {activeFilterCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-medium px-1">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isNb ? "Kategori" : "Category"}</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isNb ? "Alle kategorier" : "All categories"}</SelectItem>
                        <SelectItem value="policy">{isNb ? "Retningslinjer" : "Policies"}</SelectItem>
                        <SelectItem value="certification">{isNb ? "Sertifiseringer" : "Certifications"}</SelectItem>
                        <SelectItem value="evidence">{isNb ? "Avtaler & bevis" : "Agreements & evidence"}</SelectItem>
                        <SelectItem value="document">{isNb ? "Andre dokumenter" : "Other documents"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isNb ? "Synlighet" : "Visibility"}</Label>
                    <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isNb ? "Alle nivåer" : "All levels"}</SelectItem>
                        <SelectItem value="published">{isNb ? "Offentlig" : "Public"}</SelectItem>
                        <SelectItem value="ecosystem">{isNb ? "Økosystem" : "Ecosystem"}</SelectItem>
                        <SelectItem value="restricted">{isNb ? "Begrenset" : "Restricted"}</SelectItem>
                        <SelectItem value="hidden">{isNb ? "Intern" : "Private"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => { setCategoryFilter("all"); setVisibilityFilter("all"); }}
                    >
                      {isNb ? "Nullstill filtre" : "Reset filters"}
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : vendorDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">{isNb ? "Ingen dokumenter registrert ennå." : "No documents registered yet."}</p>
          ) : (() => {
            const totalDocs = filteredDocs.length;
            const isFiltering = !!searchQuery || categoryFilter !== "all" || visibilityFilter !== "all";
            // Default-open logic per section
            const defaultOpen = (count: number) => {
              if (isFiltering) return true;
              if (totalDocs <= 8) return true;
              return count < 3;
            };
            const sectionDef = [
              { key: "evidence", docs: evidenceDocs, label: isNb ? "Avtaler" : "Agreements", icon: <ShieldCheck className="h-4 w-4" />, rowIcon: <ShieldCheck className="h-4 w-4 text-primary" />, forceOpen: !isFiltering && totalDocs > 8 },
              { key: "policies", docs: policies, label: isNb ? "Retningslinjer" : "Policies", icon: <FileText className="h-4 w-4" />, rowIcon: <FileText className="h-4 w-4 text-primary" /> },
              { key: "certifications", docs: certifications, label: isNb ? "Sertifiseringer" : "Certifications", icon: <Award className="h-4 w-4" />, rowIcon: <Award className="h-4 w-4 text-primary" /> },
              { key: "documents", docs: documents, label: isNb ? "Andre dokumenter" : "Other documents", icon: <FolderOpen className="h-4 w-4" />, rowIcon: <FolderOpen className="h-4 w-4 text-primary" /> },
            ];
            return (
              <div className="space-y-3">
                {sectionDef.filter(s => s.docs.length > 0).map((s) => {
                  const fallback = s.forceOpen ? true : defaultOpen(s.docs.length);
                  const open = sectionsOpen[s.key] ?? fallback;
                  return (
                    <Collapsible key={s.key} open={open} onOpenChange={() => toggleSection(s.key, fallback)}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between gap-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors px-4 py-2.5 text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground">{s.icon}</span>
                            <span className="text-sm font-medium">{s.label}</span>
                            <Badge variant="secondary" className="text-[11px] px-1.5">{s.docs.length}</Badge>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 pb-1">
                        <div className="space-y-2">{s.docs.map((doc: any) => renderDocRow(doc, s.rowIcon))}</div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            );
          })()}

          {/* Zone 3b: dokumentasjon som ligger i andre moduler i plattformen */}
          {platformRows.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-1 text-base font-semibold text-foreground">
                {isNb ? "Dokumentasjon i andre moduler" : "Documentation in other modules"}
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">
                {isNb
                  ? "Samlet fra leverandører, regelverk og arbeidsområder. Åpne modulen for å redigere."
                  : "Collected from vendors, frameworks and work areas. Open the module to edit."}
              </p>
              <div className="divide-y rounded-lg border bg-card">
                {platformRows.slice(0, 40).map((row) => {
                  const route = row.doc.sourceRoute || MODULE_ROUTES[row.doc.module];
                  const fws = Array.from(new Set(row.requirements.map((r) => r.frameworkName)));
                  return (
                    <div key={row.doc.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {row.sourceKind === "agent" ? <SaraIcon size={18} /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{row.doc.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {MODULE_LABELS[row.doc.module][isNb ? "nb" : "en"]}
                          {row.doc.contextLabel ? ` · ${row.doc.contextLabel}` : ""}
                          {row.requirements.length > 0
                            ? ` · ${isNb ? "kartlagt mot" : "mapped to"} ${row.requirements.length} ${isNb ? "krav" : "req."} (${fws.join(", ")})`
                            : ` · ${isNb ? "ikke kartlagt" : "not mapped"}`}
                        </p>
                      </div>
                      {route && (
                        <Button asChild variant="ghost" size="sm" className="text-xs shrink-0">
                          <Link to={route}>{isNb ? "Åpne" : "Open"}</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}


      {/* Access tab content */}
      {activeMainTab === "access" && !isLoading && (
        <div className="space-y-3">
          {Object.keys(grantsByRecipient).length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{isNb ? "Ingen tilganger gitt ennå" : "No access granted yet"}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">
                    {isNb
                      ? "Klikk på tilgangs-merket på et dokument under «Dokumenter» for å dele det med utvalgte mottakere."
                      : "Click the access chip on a document under \"Documents\" to share it with selected recipients."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-xs text-muted-foreground px-1">
                {isNb
                  ? `${Object.keys(grantsByRecipient).length} mottaker(e) har tilgang til ett eller flere dokumenter.`
                  : `${Object.keys(grantsByRecipient).length} recipient(s) have access to one or more documents.`}
              </p>
              {Object.entries(grantsByRecipient).map(([key, info]) => (
                <Card key={key}>
                  <CardContent className="py-4 px-5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{info.name}</p>
                      {info.email && info.email !== info.name && (
                        <p className="text-xs text-muted-foreground truncate">{info.email}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {isNb ? "Har tilgang til" : "Has access to"}{" "}
                        <span className="text-foreground font-medium">{info.documents.length}</span>{" "}
                        {isNb ? `dokument${info.documents.length === 1 ? "" : "er"}` : `document${info.documents.length === 1 ? "" : "s"}`}
                        {" · "}
                        {isNb ? "sist delt" : "last shared"}{" "}
                        {new Date(info.latest).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                      </p>
                      {info.documents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {info.documents.slice(0, 5).map((d, i) => (
                            <Badge key={i} variant="outline" className="text-[11px] font-normal">
                              {d}
                            </Badge>
                          ))}
                          {info.documents.length > 5 && (
                            <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                              +{info.documents.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[11px] gap-1 shrink-0">
                      <Users className="h-3 w-3" />
                      {isNb ? "Aktiv" : "Active"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {asset?.id && <EvidenceUploadDialog open={dialogOpen} onOpenChange={setDialogOpen} assetId={asset.id} />}
      {confirmDoc && (
        <ConfirmAsEvidenceDialog
          open={!!confirmDoc}
          onOpenChange={(v) => !v && setConfirmDoc(null)}
          documentId={confirmDoc.id}
          documentName={confirmDoc.display_name || confirmDoc.file_name}
          existingAudit={confirmDoc.audit_trail || []}
          defaultSharingLevel={confirmDoc.sharing_level || "internal"}
        />
      )}
      {verifyDoc && (
        <AddVerificationDialog
          open={!!verifyDoc}
          onOpenChange={(v) => !v && setVerifyDoc(null)}
          documentId={verifyDoc.id}
          documentName={verifyDoc.display_name || verifyDoc.file_name}
          existingAudit={verifyDoc.audit_trail || []}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNb ? "Rediger dokument" : "Edit document"}</DialogTitle>
          </DialogHeader>
          {editDoc && (
            <div className="space-y-5">
              {/* Document context header */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate" title={editDoc.file_name}>
                      {editDoc.file_name || editDoc.display_name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {docTypeLabel(editDoc.document_type, isNb)}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] font-normal">
                        v{editDoc.version || 1}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {isNb ? "Lastet opp" : "Uploaded"} {editDoc.created_at ? new Date(editDoc.created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance status (advisory) */}
              <DocumentComplianceCard
                doc={editDoc}
                isNb={isNb}
                onUploadNewVersion={() => { setEditDoc(null); setDialogOpen(true); }}
                onMarkReviewed={() => markReviewedMutation.mutate(editDoc.id)}
                markingReviewed={markReviewedMutation.isPending}
              />

              {/* Sharing — the main purpose of editing */}
              <div className="space-y-2">
                <div>
                  <Label className="text-sm">{isNb ? "Hvem ser dokumentet?" : "Who sees this document?"}</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isNb ? "Velg synlighet for dokumentet." : "Choose the document's visibility."}
                  </p>
                </div>
                <Select
                  value={
                    editDoc.visibility === "published" ? "published"
                    : editDoc.visibility === "ecosystem" ? "ecosystem"
                    : (grantsByDoc[editDoc.id] || 0) > 0 ? "restricted"
                    : "hidden"
                  }
                  onValueChange={(v) => {
                    if (v === "restricted") {
                      // keep visibility hidden; open access manager
                      setEditDoc({ ...editDoc, visibility: "hidden" });
                      const d = { ...editDoc, visibility: "hidden" };
                      setEditDoc(null);
                      setAccessDoc(d);
                    } else {
                      setEditDoc({ ...editDoc, visibility: v });
                    }
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hidden">
                      <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" />{isNb ? "Internt – kun for organisasjonen" : "Internal – organization only"}</div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" />{isNb ? "Offentlig – synlig på Trust Profile" : "Public – visible on Trust Profile"}</div>
                    </SelectItem>
                    <SelectItem value="ecosystem">
                      <div className="flex items-center gap-2"><Network className="h-3.5 w-3.5" />{isNb ? "Økosystem – delt med Mynder-nettverket" : "Ecosystem – shared with the Mynder network"}</div>
                    </SelectItem>
                    <SelectItem value="restricted">
                      <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{isNb ? "Begrenset – kun valgte mottakere" : "Restricted – only selected recipients"}</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>



              {/* Metadata */}
              <div className="space-y-3 pt-3 border-t">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {isNb ? "Detaljer" : "Details"}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{isNb ? "Visningsnavn" : "Display name"}</Label>
                  <Input value={editDoc.display_name || ""} onChange={(e) => setEditDoc({ ...editDoc, display_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">{isNb ? "Dokumenttype" : "Document type"}</Label>
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
                    <Label className="text-xs">{isNb ? "Utløpsdato" : "Expiry date"}</Label>
                    <Input type="date" value={editDoc.valid_to || ""} onChange={(e) => setEditDoc({ ...editDoc, valid_to: e.target.value })} />
                    <p className="text-[10px] text-muted-foreground">
                      {isNb ? "Brukes for sertifikater og avtaler med fast utløpsdato." : "Used for certificates and agreements with a fixed expiry date."}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{isNb ? "Notater" : "Notes"}</Label>
                  <Textarea value={editDoc.notes || ""} onChange={(e) => setEditDoc({ ...editDoc, notes: e.target.value })} rows={2} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>{isNb ? "Avbryt" : "Cancel"}</Button>
            <Button onClick={saveEdit}>{isNb ? "Lagre endringer" : "Save changes"}</Button>
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

      {/* Access Dialog */}
      <DocumentAccessDialog
        open={!!accessDoc}
        onOpenChange={(open) => !open && setAccessDoc(null)}
        document={accessDoc}
      />
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
