import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Plus,
  Upload,
  History,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Trash2,
  Download,
  Globe,
  Lock,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { nb as nbLocale, enUS } from "date-fns/locale";
import { EditChecklistTable } from "@/components/trust-center/edit/EditChecklistTable";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { frameworks as frameworkDefs } from "@/lib/frameworkDefinitions";
import { useMemo } from "react";

type MasterDoc = {
  id: string;
  name: string;
  doc_type: string;
  category: string | null;
  description: string | null;
  audience_scope: string;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
};

type DocVersion = {
  id: string;
  document_id: string;
  version_label: string;
  status: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  change_summary: string | null;
  published_at: string | null;
  created_at: string;
};

const DOC_TYPES = [
  { value: "dpa", labelNb: "Databehandleravtale (DPA)", labelEn: "Data Processing Agreement" },
  { value: "iso27001", labelNb: "ISO 27001 attest", labelEn: "ISO 27001 certificate" },
  { value: "soc2", labelNb: "SOC 2 rapport", labelEn: "SOC 2 report" },
  { value: "pentest", labelNb: "Penetrasjonstest", labelEn: "Penetration test" },
  { value: "policy", labelNb: "Policy", labelEn: "Policy" },
  { value: "nda", labelNb: "Taushetserklæring (NDA)", labelEn: "NDA" },
  { value: "other", labelNb: "Annet", labelEn: "Other" },
];

const SCOPES = [
  { value: "public", labelNb: "Offentlig", labelEn: "Public", icon: Globe },
  { value: "ecosystem", labelNb: "Økosystem", labelEn: "Ecosystem", icon: Users },
  { value: "private", labelNb: "Privat", labelEn: "Private", icon: Lock },
];

const formatBytes = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TrustCenterMasterDocuments() {
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [versionDialogDoc, setVersionDialogDoc] = useState<MasterDoc | null>(null);
  const [historyDoc, setHistoryDoc] = useState<MasterDoc | null>(null);
  const [docToDelete, setDocToDelete] = useState<MasterDoc | null>(null);
  const [showFrameworksSheet, setShowFrameworksSheet] = useState(false);
  const [updatingFrameworkId, setUpdatingFrameworkId] = useState<string | null>(null);

  const { data: selfAsset } = useQuery({
    queryKey: ["self-asset-edit"],
    queryFn: async () => {
      const { data } = await supabase.from("assets").select("*").eq("asset_type", "self").order("updated_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const { data: allFrameworkRows = [] } = useQuery({
    queryKey: ["selected-frameworks-edit"],
    queryFn: async () => {
      const { data } = await supabase.from("selected_frameworks").select("*");
      return data || [];
    },
  });
  const activeFrameworks = useMemo(
    () => (allFrameworkRows as any[]).filter((r: any) => r.is_selected),
    [allFrameworkRows]
  );
  const activeFrameworkIds = useMemo(
    () => new Set<string>(activeFrameworks.map((r: any) => r.framework_id)),
    [activeFrameworks]
  );

  const handleToggleFramework = async (frameworkId: string, currentlyActive: boolean) => {
    const existing = (allFrameworkRows as any[]).find((f: any) => f.framework_id === frameworkId);
    setUpdatingFrameworkId(frameworkId);
    try {
      if (existing) {
        await supabase.from("selected_frameworks").update({ is_selected: !currentlyActive }).eq("id", existing.id);
      } else {
        const fw = frameworkDefs.find((f) => f.id === frameworkId);
        if (!fw) return;
        await supabase.from("selected_frameworks").insert({
          framework_id: fw.id,
          framework_name: fw.name,
          category: fw.category,
          is_mandatory: fw.isMandatory || false,
          is_recommended: fw.isRecommended || false,
          is_selected: true,
        });
      }
      await qc.invalidateQueries({ queryKey: ["selected-frameworks-edit"] });
      toast.success(!currentlyActive ? (isNb ? "Regelverk aktivert" : "Framework activated") : (isNb ? "Regelverk fjernet" : "Framework removed"));
    } catch (e: any) {
      toast.error(isNb ? "Kunne ikke oppdatere" : "Could not update");
    } finally {
      setUpdatingFrameworkId(null);
    }
  };

  const { data: docs, isLoading } = useQuery({
    queryKey: ["tc-master-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trust_center_master_documents")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MasterDoc[];
    },
  });

  const { data: versionsByDoc } = useQuery({
    queryKey: ["tc-doc-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trust_center_document_versions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, DocVersion[]> = {};
      (data as DocVersion[]).forEach((v) => {
        (map[v.document_id] ||= []).push(v);
      });
      return map;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trust_center_master_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tc-master-docs"] });
      qc.invalidateQueries({ queryKey: ["tc-doc-versions"] });
      toast.success(isNb ? "Dokument slettet" : "Document deleted");
      setDocToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const docTypeLabel = (v: string) => {
    const t = DOC_TYPES.find((d) => d.value === v);
    return t ? (isNb ? t.labelNb : t.labelEn) : v;
  };
  const scopeMeta = (v: string) => SCOPES.find((s) => s.value === v) ?? SCOPES[1];

  const getCurrentVersion = (doc: MasterDoc): DocVersion | undefined => {
    const list = versionsByDoc?.[doc.id];
    if (!list) return undefined;
    if (doc.current_version_id) return list.find((v) => v.id === doc.current_version_id);
    return list.find((v) => v.status === "published") ?? list[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={isMobile ? "pt-16 px-4 pb-20" : "ml-64 pt-16 px-8 pb-12"}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {isNb ? "Master-dokumenter" : "Master documents"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {isNb
                  ? "Én kilde til sannhet for dokumentene i Trust Profilen din. Hver oppdatering blir en ny versjon – kunder og leverandører ser alltid gjeldende godkjente versjon."
                  : "One source of truth for the documents in your Trust Profile. Each update creates a new version – customers and vendors always see the current approved version."}
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {isNb ? "Nytt dokument" : "New document"}
            </Button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !docs || docs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium mb-1">
                  {isNb ? "Ingen master-dokumenter ennå" : "No master documents yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                  {isNb
                    ? "Legg til ditt første dokument – f.eks. DPA, ISO 27001-attest eller pentest-rapport."
                    : "Add your first document – e.g. DPA, ISO 27001 certificate or pentest report."}
                </p>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {isNb ? "Opprett dokument" : "Create document"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => {
                const current = getCurrentVersion(doc);
                const versions = versionsByDoc?.[doc.id] ?? [];
                const Scope = scopeMeta(doc.audience_scope);
                const ScopeIcon = Scope.icon;
                return (
                  <Card key={doc.id} className="group hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-medium truncate">{doc.name}</h3>
                              <Badge variant="outline" className="text-[11px] font-normal">
                                {docTypeLabel(doc.doc_type)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[11px] font-normal gap-1"
                              >
                                <ScopeIcon className="h-3 w-3" />
                                {isNb ? Scope.labelNb : Scope.labelEn}
                              </Badge>
                            </div>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {current ? (
                                <>
                                  <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-success" />
                                    {isNb ? "Gjeldende" : "Current"}: <strong className="text-foreground">{current.version_label}</strong>
                                  </span>
                                  {current.published_at && (
                                    <span>
                                      {isNb ? "publisert" : "published"}{" "}
                                      {formatDistanceToNow(new Date(current.published_at), {
                                        addSuffix: true,
                                        locale: isNb ? nbLocale : enUS,
                                      })}
                                    </span>
                                  )}
                                  <span>
                                    {versions.length} {isNb ? "versjoner" : "versions"}
                                  </span>
                                </>
                              ) : (
                                <span className="text-amber-600">
                                  {isNb ? "Ingen versjoner ennå" : "No versions yet"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setVersionDialogDoc(doc)}
                            className="gap-1.5"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {isNb ? "Ny versjon" : "New version"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setHistoryDoc(doc)}
                            className="gap-1.5"
                          >
                            <History className="h-3.5 w-3.5" />
                            {isNb ? "Historikk" : "History"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDocToDelete(doc)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isNb ? "Slett dokument" : "Delete document"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <CreateDocDialog open={createOpen} onClose={() => setCreateOpen(false)} isNb={isNb} />

      {versionDialogDoc && (
        <NewVersionDialog
          doc={versionDialogDoc}
          isNb={isNb}
          onClose={() => setVersionDialogDoc(null)}
        />
      )}

      {historyDoc && (
        <HistoryDialog
          doc={historyDoc}
          versions={versionsByDoc?.[historyDoc.id] ?? []}
          isNb={isNb}
          onClose={() => setHistoryDoc(null)}
        />
      )}

      <AlertDialog open={!!docToDelete} onOpenChange={(o) => !o && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isNb ? "Slett dokument?" : "Delete document?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isNb
                ? `Dette sletter "${docToDelete?.name}" og alle versjonene. Kunder og leverandører som har tilgang vil miste den.`
                : `This deletes "${docToDelete?.name}" and all versions. Customers and vendors with access will lose it.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isNb ? "Avbryt" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => docToDelete && deleteMutation.mutate(docToDelete.id)}
            >
              {isNb ? "Slett" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- Create dialog ----------
function CreateDocDialog({
  open,
  onClose,
  isNb,
}: {
  open: boolean;
  onClose: () => void;
  isNb: boolean;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("dpa");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("ecosystem");

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("trust_center_master_documents").insert({
        user_id: userData.user.id,
        name: name.trim(),
        doc_type: docType,
        description: description.trim() || null,
        audience_scope: scope,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tc-master-docs"] });
      toast.success(isNb ? "Dokument opprettet" : "Document created");
      setName("");
      setDescription("");
      setDocType("dpa");
      setScope("ecosystem");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNb ? "Nytt master-dokument" : "New master document"}</DialogTitle>
          <DialogDescription>
            {isNb
              ? "Opprett en logisk container. Du kan laste opp filer som versjoner etterpå."
              : "Create a logical container. You can upload files as versions afterwards."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{isNb ? "Navn" : "Name"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isNb ? "F.eks. Databehandleravtale" : "E.g. Data Processing Agreement"}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{isNb ? "Type" : "Type"}</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {isNb ? t.labelNb : t.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isNb ? "Synlighet" : "Audience"}</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {isNb ? s.labelNb : s.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{isNb ? "Beskrivelse" : "Description"}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={isNb ? "Valgfritt" : "Optional"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isNb ? "Opprett" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- New version dialog ----------
function NewVersionDialog({
  doc,
  isNb,
  onClose,
}: {
  doc: MasterDoc;
  isNb: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [versionLabel, setVersionLabel] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishNow, setPublishNow] = useState(true);

  const upload = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const userId = userData.user.id;

      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `trust-center/${userId}/${doc.id}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("documents")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        filePath = path;
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
      }

      const { data: versionRow, error: vErr } = await supabase
        .from("trust_center_document_versions")
        .insert({
          document_id: doc.id,
          user_id: userId,
          version_label: versionLabel.trim(),
          status: publishNow ? "published" : "draft",
          published_at: publishNow ? new Date().toISOString() : null,
          change_summary: changeSummary.trim() || null,
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
        })
        .select()
        .single();
      if (vErr) throw vErr;

      if (publishNow && versionRow) {
        const { error: updErr } = await supabase
          .from("trust_center_master_documents")
          .update({ current_version_id: versionRow.id })
          .eq("id", doc.id);
        if (updErr) throw updErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tc-master-docs"] });
      qc.invalidateQueries({ queryKey: ["tc-doc-versions"] });
      toast.success(isNb ? "Ny versjon lagt til" : "New version added");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isNb ? "Ny versjon av" : "New version of"} {doc.name}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Last opp en ny fil eller registrer en oppdatering. Versjonen blir gjeldende hvis du publiserer den."
              : "Upload a new file or register an update. The version becomes current if you publish it."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{isNb ? "Versjonsetikett" : "Version label"}</Label>
            <Input
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="v1.0 / 2026.06"
            />
          </div>
          <div className="space-y-2">
            <Label>{isNb ? "Fil" : "File"}</Label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{isNb ? "Hva er endret?" : "What changed?"}</Label>
            <Textarea
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              rows={3}
              placeholder={isNb ? "Kort endringslogg" : "Brief changelog"}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="rounded"
            />
            {isNb
              ? "Publiser som gjeldende versjon nå"
              : "Publish as current version now"}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button
            onClick={() => upload.mutate()}
            disabled={!versionLabel.trim() || upload.isPending}
          >
            {upload.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isNb ? "Lagre versjon" : "Save version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- History dialog ----------
function HistoryDialog({
  doc,
  versions,
  isNb,
  onClose,
}: {
  doc: MasterDoc;
  versions: DocVersion[];
  isNb: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const setCurrent = useMutation({
    mutationFn: async (versionId: string) => {
      const { error: vErr } = await supabase
        .from("trust_center_document_versions")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", versionId);
      if (vErr) throw vErr;
      const { error } = await supabase
        .from("trust_center_master_documents")
        .update({ current_version_id: versionId })
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tc-master-docs"] });
      qc.invalidateQueries({ queryKey: ["tc-doc-versions"] });
      toast.success(isNb ? "Versjon satt som gjeldende" : "Version set as current");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = async (v: DocVersion) => {
    if (!v.file_path) {
      toast.info(isNb ? "Ingen fil knyttet" : "No file attached");
      return;
    }
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(v.file_path, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Error");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isNb ? "Versjonshistorikk" : "Version history"} · {doc.name}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Alle versjoner. Klikk på en versjon for å sette den som gjeldende."
              : "All versions. Click a version to set it as current."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isNb ? "Ingen versjoner ennå" : "No versions yet"}
            </p>
          )}
          {versions.map((v) => {
            const isCurrent = v.id === doc.current_version_id;
            return (
              <div
                key={v.id}
                className={`border rounded-lg p-3 ${
                  isCurrent ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{v.version_label}</span>
                      {isCurrent && (
                        <Badge className="bg-success/15 text-success border-success/30 text-[11px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {isNb ? "Gjeldende" : "Current"}
                        </Badge>
                      )}
                      {v.status === "draft" && (
                        <Badge variant="secondary" className="text-[11px]">
                          {isNb ? "Utkast" : "Draft"}
                        </Badge>
                      )}
                      {v.file_name && (
                        <span className="text-xs text-muted-foreground">
                          {v.file_name} · {formatBytes(v.file_size)}
                        </span>
                      )}
                    </div>
                    {v.change_summary && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {v.change_summary}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {v.published_at
                        ? `${isNb ? "Publisert" : "Published"} ${formatDistanceToNow(new Date(v.published_at), { addSuffix: true, locale: isNb ? nbLocale : enUS })}`
                        : `${isNb ? "Opprettet" : "Created"} ${formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: isNb ? nbLocale : enUS })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {v.file_path && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => download(v)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrent.mutate(v.id)}
                        disabled={setCurrent.isPending}
                        className="gap-1.5"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        {isNb ? "Sett gjeldende" : "Set current"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isNb ? "Lukk" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
