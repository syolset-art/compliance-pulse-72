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
import {
  Upload, FileText, Trash2, Download, Loader2, User, Building2,
  Globe, Sparkles, CheckCircle2, Lightbulb, ArrowLeft,
} from "lucide-react";
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

interface AISuggestion {
  suggestedType: string;
  suggestedTypeReason: string;
  suggestedOwner: string;
  suggestedOwnerReason: string;
  suggestedWorkAreaMode: "all" | "selected";
  suggestedWorkAreas: string[];
  workAreaTip: string;
  metadataTip: string;
  documentDescription: string;
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

const DEMO_OWNERS = [
  { value: "kari.nordmann", label: "Kari Nordmann – Compliance Officer" },
  { value: "ola.hansen", label: "Ola Hansen – CISO" },
  { value: "erik.berg", label: "Erik Berg – DPO / Personvernombud" },
  { value: "lise.johansen", label: "Lise Johansen – Kvalitetsleder" },
  { value: "thomas.dahl", label: "Thomas Dahl – IT-sjef" },
  { value: "marte.svendsen", label: "Marte Svendsen – HR-leder" },
];

const getDocTypeLabel = (value: string) =>
  DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;

const getOwnerLabel = (value: string) =>
  DEMO_OWNERS.find((o) => o.value === value)?.label ?? value;

type UploadStep = "idle" | "analyzing" | "review" | "saving";

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
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);

  // Upload flow state
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  // Form fields (populated by AI, editable by user)
  const [selectedType, setSelectedType] = useState("policy");
  const [owner, setOwner] = useState("");
  const [workAreaMode, setWorkAreaMode] = useState<"all" | "selected">("all");
  const [selectedWorkAreas, setSelectedWorkAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Local metadata for display
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
    const { data } = await supabase.from("work_areas").select("id, name").order("name");
    if (data) setWorkAreas(data);
  };

  useEffect(() => {
    if (open) {
      fetchDocuments();
      fetchWorkAreas();
      resetUploadState();
    }
  }, [open, frameworkId]);

  const resetUploadState = () => {
    setUploadStep("idle");
    setPendingFile(null);
    setAiSuggestion(null);
    setSelectedType("policy");
    setOwner("");
    setWorkAreaMode("all");
    setSelectedWorkAreas([]);
    setNotes("");
  };

  const toggleWorkArea = (id: string) => {
    setSelectedWorkAreas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Step 1: User picks a file → AI analyzes
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setPendingFile(file);
    setUploadStep("analyzing");

    try {
      const { data, error } = await supabase.functions.invoke("classify-framework-doc", {
        body: {
          fileName: file.name,
          frameworkId,
          frameworkName,
          workAreaNames: workAreas.map(wa => wa.name),
        },
      });

      if (error) throw error;

      const suggestion = data?.suggestion as AISuggestion | undefined;
      if (suggestion) {
        setAiSuggestion(suggestion);
        // Pre-fill form with AI suggestions
        setSelectedType(suggestion.suggestedType);
        setOwner(suggestion.suggestedOwner);
        setWorkAreaMode(suggestion.suggestedWorkAreaMode);
        if (suggestion.suggestedWorkAreaMode === "selected" && suggestion.suggestedWorkAreas.length > 0) {
          const matchedIds = workAreas
            .filter(wa => suggestion.suggestedWorkAreas.some(s =>
              wa.name.toLowerCase().includes(s.toLowerCase()) ||
              s.toLowerCase().includes(wa.name.toLowerCase())
            ))
            .map(wa => wa.id);
          setSelectedWorkAreas(matchedIds);
        }
      }
      setUploadStep("review");
    } catch (err: any) {
      console.error("AI classification failed:", err);
      // Fall back to manual mode
      toast({ title: "AI-analyse utilgjengelig", description: "Fyll inn metadata manuelt.", variant: "destructive" });
      setUploadStep("review");
    }
  };

  // Step 2: User confirms → save to storage + DB
  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    if (!owner) {
      toast({ title: "Velg en eier", description: "Dokumentet må ha en eier.", variant: "destructive" });
      return;
    }
    if (workAreaMode === "selected" && selectedWorkAreas.length === 0) {
      toast({ title: "Velg arbeidsområder", description: "Velg minst ett arbeidsområde.", variant: "destructive" });
      return;
    }

    setUploadStep("saving");
    try {
      const filePath = `framework-docs/${frameworkId}/${Date.now()}_${pendingFile.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, pendingFile);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("framework_documents")
        .insert({
          framework_id: frameworkId,
          file_name: pendingFile.name,
          file_path: filePath,
          file_size: pendingFile.size,
          document_type: selectedType,
          notes: notes || null,
          uploaded_by: owner,
        } as any);
      if (insertError) throw insertError;

      // Store work area metadata locally
      setDocMetadata(prev => ({
        ...prev,
        [filePath]: {
          owner,
          workAreaMode,
          workAreaNames: workAreaMode === "all"
            ? ["Alle arbeidsområder"]
            : workAreas.filter(wa => selectedWorkAreas.includes(wa.id)).map(wa => wa.name),
        },
      }));

      toast({ title: "Dokument lagret", description: `${pendingFile.name} – ${getOwnerLabel(owner)}` });
      resetUploadState();
      await fetchDocuments();
      onCountChange?.();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Feil ved lagring", description: err.message, variant: "destructive" });
      setUploadStep("review");
    }
  };

  const handleDelete = async (doc: FrameworkDocument) => {
    try {
      await supabase.storage.from("documents").remove([doc.file_path]);
      await supabase.from("framework_documents").delete().eq("id", doc.id);
      toast({ title: "Dokument fjernet", description: doc.file_name });
      await fetchDocuments();
      onCountChange?.();
    } catch (err: any) {
      toast({ title: "Feil", description: err.message, variant: "destructive" });
    }
  };

  const handleDownload = async (doc: FrameworkDocument) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 60);
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
            Last opp fil – AI foreslår dokumenttype, eier og arbeidsområder automatisk.
          </DialogDescription>
        </DialogHeader>

        {/* === STEP: IDLE – Show upload button === */}
        {uploadStep === "idle" && (
          <div className="space-y-2 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Last opp dokument</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Velg en fil – AI analyserer filnavnet og foreslår type, eier og omfang.
            </p>
            <label className="block mt-2">
              <Input
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              />
              <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Velg fil
                </span>
              </Button>
            </label>
          </div>
        )}

        {/* === STEP: ANALYZING – AI spinner === */}
        {uploadStep === "analyzing" && (
          <div className="p-6 rounded-lg border bg-primary/5 text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium">Analyserer «{pendingFile?.name}»...</p>
            <p className="text-xs text-muted-foreground">AI foreslår metadata basert på filnavn og regelverk.</p>
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}

        {/* === STEP: REVIEW – AI suggestions + editable form === */}
        {uploadStep === "review" && pendingFile && (
          <div className="space-y-4">
            {/* File info bar */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(pendingFile.size)}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetUploadState}>
                <ArrowLeft className="h-3 w-3 mr-1" />
                Bytt fil
              </Button>
            </div>

            {/* AI suggestion banner */}
            {aiSuggestion && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">AI-forslag</span>
                </div>
                <p className="text-xs text-muted-foreground">{aiSuggestion.documentDescription}</p>
                <div className="flex items-start gap-1.5 mt-1">
                  <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">{aiSuggestion.metadataTip}</p>
                </div>
              </div>
            )}

            {/* Editable form */}
            <div className="space-y-3">
              {/* Document type */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Dokumenttype</Label>
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
                {aiSuggestion && selectedType === aiSuggestion.suggestedType && (
                  <p className="text-[10px] text-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {aiSuggestion.suggestedTypeReason}
                  </p>
                )}
              </div>

              {/* Owner */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Dokumenteier</Label>
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Velg eier" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_OWNERS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {aiSuggestion && owner === aiSuggestion.suggestedOwner && (
                  <p className="text-[10px] text-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {aiSuggestion.suggestedOwnerReason}
                  </p>
                )}
              </div>

              {/* Work areas */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs font-medium">Gjelder for arbeidsområder</Label>
                </div>

                {aiSuggestion && (
                  <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                    <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                    {aiSuggestion.workAreaTip}
                  </p>
                )}

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
                          <Label htmlFor={`wa-${wa.id}`} className="text-xs cursor-pointer flex-1">
                            {wa.name}
                          </Label>
                          {aiSuggestion?.suggestedWorkAreas?.some(s =>
                            wa.name.toLowerCase().includes(s.toLowerCase()) ||
                            s.toLowerCase().includes(wa.name.toLowerCase())
                          ) && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                              Foreslått
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Notater (valgfritt)</Label>
                <Textarea
                  placeholder="Legg til notater..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[60px] text-xs resize-none"
                />
              </div>
            </div>

            {/* Confirm / Cancel */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={resetUploadState}>
                Avbryt
              </Button>
              <Button size="sm" className="flex-1 gap-1.5" onClick={handleConfirmUpload}>
                <CheckCircle2 className="h-4 w-4" />
                Lagre dokument
              </Button>
            </div>
          </div>
        )}

        {/* === STEP: SAVING === */}
        {uploadStep === "saving" && (
          <div className="p-6 text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Lagrer dokument...</p>
          </div>
        )}

        {uploadStep === "idle" && <Separator />}

        {/* Document list */}
        {uploadStep === "idle" && (
          <>
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
                        {(doc.uploaded_by || meta?.owner) && (
                          <div className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              Eier: {getOwnerLabel(doc.uploaded_by || meta?.owner || "")}
                            </span>
                          </div>
                        )}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
