import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Loader2,
  Download,
  Shield,
  ScrollText,
  AlertTriangle,
  Plus,
  Brain,
  BrainCircuit,
  MoreHorizontal,
  Search,
} from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "dpa", label: "Databehandleravtale (DPA)" },
  { value: "sla", label: "SLA-avtale" },
  { value: "nda", label: "Taushetserklæring (NDA)" },
  { value: "privacy_policy", label: "Personvernerklæring" },
  { value: "risk_assessment", label: "Risikovurdering" },
  { value: "contract", label: "Kontrakt" },
  { value: "other", label: "Annet" },
];

const GENERATE_TEMPLATES = [
  {
    type: "privacy_declaration",
    label: "Personvernerklæring",
    description: "Generer utkast basert på systemer og leverandører i arbeidsområdet",
    icon: Shield,
  },
  {
    type: "dpa_template",
    label: "Databehandleravtale",
    description: "Lag DPA-utkast i henhold til GDPR art. 28",
    icon: ScrollText,
  },
  {
    type: "risk_assessment",
    label: "Risikovurdering",
    description: "Oppsummer risikoer fra systemer og leverandører",
    icon: AlertTriangle,
  },
];

// Group config for document types
const DOC_GROUPS = [
  { key: "agreements", label: "Avtaler", types: ["dpa", "sla", "nda", "contract"], icon: ScrollText },
  { key: "policies", label: "Retningslinjer", types: ["privacy_policy", "risk_assessment"], icon: Shield },
  { key: "other", label: "Andre dokumenter", types: ["other"], icon: FileText },
];

interface WorkAreaDocumentsTabProps {
  workAreaId: string;
  workAreaName: string;
}

export function WorkAreaDocumentsTab({ workAreaId, workAreaName }: WorkAreaDocumentsTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["work-area-documents", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_area_documents" as any)
        .select("*")
        .eq("work_area_id", workAreaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["work-area-documents", workAreaId] });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const filePath = `work-areas/${workAreaId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("work_area_documents" as any)
        .insert({
          work_area_id: workAreaId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          document_type: "other",
          generated: false,
          ai_enabled: false,
        });

      if (insertError) throw insertError;

      toast.success("Dokument lastet opp", { description: file.name });
      invalidate();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Feil ved opplasting", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      await supabase.storage.from("documents").remove([filePath]);
      await supabase.from("work_area_documents" as any).delete().eq("id", docId);
      toast.success("Dokument slettet");
      invalidate();
    } catch (error: any) {
      toast.error("Feil ved sletting", { description: error.message });
    }
  };

  const handleToggleAI = async (docId: string, enabled: boolean, docName: string) => {
    try {
      await supabase
        .from("work_area_documents" as any)
        .update({ ai_enabled: enabled })
        .eq("id", docId);

      if (enabled) {
        toast.success(`«${docName}» er nå tilgjengelig for AI`, {
          description: "AI-agenter kan bruke dette dokumentet til analyse og generering.",
        });
      } else {
        toast(`«${docName}» er ikke lenger tilgjengelig for AI`, {
          description: "Dokumentet brukes ikke av AI-agenter.",
        });
      }
      invalidate();
    } catch (error: any) {
      toast.error("Kunne ikke oppdatere AI-tilgang", { description: error.message });
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(filePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Feil ved nedlasting", { description: error.message });
    }
  };

  const handleGenerate = async (templateType: string) => {
    setIsGenerating(templateType);
    try {
      const { data, error } = await supabase.functions.invoke("generate-work-area-document", {
        body: { workAreaId, templateType },
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      setGeneratedTitle(
        GENERATE_TEMPLATES.find((t) => t.type === templateType)?.label || "Generert dokument"
      );
      setShowGenerateDialog(false);
      setShowPreviewDialog(true);
    } catch (error: any) {
      console.error("Generate error:", error);
      toast.error("Feil ved generering", { description: error.message });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedContent) return;

    try {
      const fileName = `${generatedTitle.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.md`;
      const filePath = `work-areas/${workAreaId}/${fileName}`;
      const blob = new Blob([generatedContent], { type: "text/markdown" });

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const docType = generatedTitle.includes("Personvern")
        ? "privacy_policy"
        : generatedTitle.includes("Databehandler")
        ? "dpa"
        : "risk_assessment";

      await supabase.from("work_area_documents" as any).insert({
        work_area_id: workAreaId,
        file_name: fileName,
        file_path: filePath,
        file_size: blob.size,
        document_type: docType,
        generated: true,
        ai_enabled: false,
      });

      toast.success("Dokument lagret", { description: fileName });
      invalidate();
      setShowPreviewDialog(false);
      setGeneratedContent(null);
    } catch (error: any) {
      toast.error("Feil ved lagring", { description: error.message });
    }
  };

  const getDocTypeLabel = (type: string) =>
    DOCUMENT_TYPES.find((d) => d.value === type)?.label || type;

  // Filter documents
  const filtered = documents.filter((doc: any) =>
    doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group documents
  const grouped = DOC_GROUPS.map((group) => ({
    ...group,
    docs: filtered.filter((doc: any) => group.types.includes(doc.document_type)),
  })).filter((g) => g.docs.length > 0);

  // Ungrouped
  const groupedTypes = DOC_GROUPS.flatMap((g) => g.types);
  const ungrouped = filtered.filter((doc: any) => !groupedTypes.includes(doc.document_type));
  if (ungrouped.length > 0) {
    grouped.push({ key: "uncategorized", label: "Ukategorisert", types: [], icon: FileText, docs: ungrouped });
  }

  // AI summary
  const aiCount = documents.filter((d: any) => d.ai_enabled).length;

  return (
    <div className="space-y-6">
      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i dokumenter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="file"
            id="doc-upload"
            className="sr-only"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => document.getElementById("doc-upload")?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Last opp
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowGenerateDialog(true)}
          >
            <Sparkles className="h-4 w-4" />
            Generer
          </Button>
        </div>
      </div>

      {/* AI summary */}
      {documents.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-medium">{aiCount}</span>
            <span className="text-muted-foreground">tilgjengelig for AI</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1.5 text-sm">
            <BrainOff className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{documents.length - aiCount}</span>
            <span className="text-muted-foreground">ikke AI</span>
          </div>
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Ingen dokumenter ennå. Last opp en kontrakt eller generer et dokument.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Ingen dokumenter matcher søket.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => {
            const GroupIcon = group.icon;
            return (
              <section key={group.key}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <GroupIcon className="h-4 w-4" />
                  {group.label}
                  <Badge variant="secondary" className="text-[13px] px-1.5">{group.docs.length}</Badge>
                </h2>
                <div className="space-y-2">
                  {group.docs.map((doc: any) => (
                    <Card key={doc.id} className="hover:bg-accent/30 transition-colors">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            {doc.generated && (
                              <Badge className="text-[11px] bg-violet-500/10 text-violet-600 border-violet-500/30 shrink-0">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getDocTypeLabel(doc.document_type)} · {new Date(doc.created_at).toLocaleDateString("nb-NO")}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5">
                                  {doc.ai_enabled ? (
                                    <Brain className="h-3.5 w-3.5 text-primary" />
                                  ) : (
                                    <BrainOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className={`text-xs min-w-[28px] ${doc.ai_enabled ? "text-primary" : "text-muted-foreground"}`}>
                                    {doc.ai_enabled ? "AI" : "Ikke AI"}
                                  </span>
                                  <Switch
                                    checked={!!doc.ai_enabled}
                                    onCheckedChange={(checked) => handleToggleAI(doc.id, checked, doc.file_name)}
                                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">
                                  {doc.ai_enabled
                                    ? "Tilgjengelig for AI-agenter — klikk for å deaktivere"
                                    : "Ikke tilgjengelig for AI — klikk for å aktivere"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                                <Download className="h-4 w-4 mr-2" />
                                Last ned
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(doc.id, doc.file_path)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Slett
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Generate dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generer dokument med AI
            </DialogTitle>
            <DialogDescription>
              Velg en mal. AI bruker informasjon fra systemer, leverandører og prosesser i «{workAreaName}» for å lage et utkast.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {GENERATE_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <button
                  key={tmpl.type}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
                  onClick={() => handleGenerate(tmpl.type)}
                  disabled={!!isGenerating}
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {isGenerating === tmpl.type ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tmpl.label}</p>
                    <p className="text-xs text-muted-foreground">{tmpl.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview generated document dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              {generatedTitle} — Utkast
            </DialogTitle>
            <DialogDescription>
              Gjennomgå utkastet generert for «{workAreaName}». Du kan lagre det som et dokument.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-muted/30 prose prose-sm max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
              {generatedContent}
            </pre>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Lukk
            </Button>
            <Button onClick={handleSaveGenerated} className="gap-2">
              <Download className="h-4 w-4" />
              Lagre dokument
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
