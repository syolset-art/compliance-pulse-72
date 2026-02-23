import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Download, Loader2, User, Building2, Globe } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface FrameworkDocument {
  id: string;
  framework_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  document_type: string;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

interface WorkArea {
  id: string;
  name: string;
}

const DOCUMENT_TYPES = [
  { value: "policy", label: "Policy" },
  { value: "procedure", label: "Prosedyre" },
  { value: "guideline", label: "Retningslinje" },
  { value: "soa", label: "Statement of Applicability" },
  { value: "risk_assessment", label: "Risikovurdering" },
  { value: "report", label: "Rapport" },
  { value: "other", label: "Annet" },
];

const getDocTypeLabel = (value: string) =>
  DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frameworkId: string;
  frameworkName: string;
  onCountChange?: () => void;
}

export function FrameworkDocumentsDialog({
  open, onOpenChange, frameworkId, frameworkName, onCountChange,
}: Props) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<FrameworkDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("policy");
  const [notes, setNotes] = useState("");
  const [owner, setOwner] = useState("");
  const [workAreaMode, setWorkAreaMode] = useState<"all" | "selected">("all");
  const [selectedWorkAreas, setSelectedWorkAreas] = useState<string[]>([]);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);

  // Local metadata store for owner/work area (prototype - stored client-side)
  const [docMetadata, setDocMetadata] = useState<Record<string, { owner: string; workAreaMode: string; workAreaNames: string[] }>>({});

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("framework_documents")
      .select("*")
      .eq("framework_id", frameworkId)
      .order("created_at", { ascending: false });

    if (!error) setDocuments((data as FrameworkDocument[]) || []);
    setLoading(false);
  };

  const fetchWorkAreas = async () => {
    const { data } = await supabase
      .from("work_areas")
      .select("id, name")
      .order("name");
    if (data) setWorkAreas(data);
  };

  useEffect(() => {
    if (open) {
      fetchDocuments();
      fetchWorkAreas();
    }
  }, [open, frameworkId]);

  const toggleWorkArea = (id: string) => {
    setSelectedWorkAreas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!owner.trim()) {
      toast({ title: "Mangler eier", description: "Angi hvem som eier dette dokumentet.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    if (workAreaMode === "selected" && selectedWorkAreas.length === 0) {
      toast({ title: "Velg arbeidsområder", description: "Velg minst ett arbeidsområde dokumentet skal gjelde for.", variant: "destructive" });
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const filePath = `framework-docs/${frameworkId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Build notes with owner and work area info embedded
      const workAreaInfo = workAreaMode === "all"
        ? "Alle arbeidsområder"
        : workAreas.filter(wa => selectedWorkAreas.includes(wa.id)).map(wa => wa.name).join(", ");
      const fullNotes = [
        notes || null,
      ].filter(Boolean).join(" | ");

      const { error: insertError } = await supabase
        .from("framework_documents")
        .insert({
          framework_id: frameworkId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          document_type: selectedType,
          notes: fullNotes || null,
          uploaded_by: owner.trim(),
        } as any);

      if (insertError) throw insertError;

      // Store metadata locally for display
      const newMeta = { ...docMetadata };
      newMeta[filePath] = {
        owner: owner.trim(),
        workAreaMode,
        workAreaNames: workAreaMode === "all"
          ? ["Alle arbeidsområder"]
          : workAreas.filter(wa => selectedWorkAreas.includes(wa.id)).map(wa => wa.name),
      };
      setDocMetadata(newMeta);

      toast({ title: "Dokument lastet opp", description: `${file.name} – eier: ${owner.trim()}` });
      setNotes("");
      setOwner("");
      setSelectedType("policy");
      setWorkAreaMode("all");
      setSelectedWorkAreas([]);
      await fetchDocuments();
      onCountChange?.();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Feil ved opplasting", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (doc: FrameworkDocument) => {
    try {
      await supabase.storage.from("documents").remove([doc.file_path]);
      const { error } = await supabase
        .from("framework_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;

      toast({ title: "Dokument fjernet", description: doc.file_name });
      await fetchDocuments();
      onCountChange?.();
    } catch (err: any) {
      toast({ title: "Feil", description: err.message, variant: "destructive" });
    }
  };

  const handleDownload = async (doc: FrameworkDocument) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Feil", description: "Kunne ikke laste ned filen", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Dokumenter – {frameworkName}
          </DialogTitle>
          <DialogDescription>
            Last opp og koble policyer, prosedyrer og annen dokumentasjon til dette regelverket.
          </DialogDescription>
        </DialogHeader>

        {/* Upload section */}
        <div className="space-y-3 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
          <p className="text-sm font-medium">Last opp nytt dokument</p>

          {/* Document type & owner */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Dokumenteier *"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="h-9 text-xs pl-8"
              />
            </div>
          </div>

          {/* Work area selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs font-medium">Gjelder for arbeidsområder</Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={workAreaMode === "all" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => { setWorkAreaMode("all"); setSelectedWorkAreas([]); }}
              >
                <Globe className="h-3 w-3" />
                Alle
              </Button>
              <Button
                type="button"
                variant={workAreaMode === "selected" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setWorkAreaMode("selected")}
              >
                Utvalgte
              </Button>
            </div>

            {workAreaMode === "selected" && (
              <div className="max-h-28 overflow-y-auto space-y-1.5 rounded-md border bg-background p-2">
                {workAreas.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">Ingen arbeidsområder opprettet ennå.</p>
                ) : (
                  workAreas.map((wa) => (
                    <div key={wa.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`wa-${wa.id}`}
                        checked={selectedWorkAreas.includes(wa.id)}
                        onCheckedChange={() => toggleWorkArea(wa.id)}
                      />
                      <Label htmlFor={`wa-${wa.id}`} className="text-xs cursor-pointer">
                        {wa.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <Textarea
            placeholder="Notater (valgfritt)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-9 min-h-0 text-xs resize-none py-2"
          />

          {/* Upload button */}
          <label className="block">
            <Input
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Laster opp..." : "Velg fil"}
              </span>
            </Button>
          </label>
        </div>

        <Separator />

        {/* Document list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Ingen dokumenter koblet til dette regelverket ennå.</p>
            <p className="text-xs mt-1">Last opp policyer, prosedyrer eller andre relevante dokumenter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {documents.length} dokument{documents.length !== 1 ? "er" : ""}
            </p>
            {documents.map((doc) => {
              const meta = docMetadata[doc.file_path];
              return (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                >
                  <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {getDocTypeLabel(doc.document_type)}
                      </Badge>
                      {doc.file_size && (
                        <span className="text-[10px] text-muted-foreground">{formatSize(doc.file_size)}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                      </span>
                    </div>
                    {/* Owner info */}
                    {(doc.uploaded_by || meta?.owner) && (
                      <div className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Eier: {doc.uploaded_by || meta?.owner}
                        </span>
                      </div>
                    )}
                    {/* Work area info */}
                    {meta?.workAreaNames && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {meta.workAreaNames.join(", ")}
                        </span>
                      </div>
                    )}
                    {doc.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
