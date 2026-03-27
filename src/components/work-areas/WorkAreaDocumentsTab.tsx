import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  FileCheck,
  Plus,
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
  const [selectedDocType, setSelectedDocType] = useState("other");
  const { toast } = useToast();
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

  // Fetch assets to check for missing DPAs
  const { data: assets = [] } = useQuery({
    queryKey: ["work-area-assets-dpa-check", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, gdpr_role")
        .eq("work_area_id", workAreaId)
        .eq("gdpr_role", "processor");
      if (error) throw error;
      return data || [];
    },
  });

  const dpaDocCount = documents.filter((d: any) => d.document_type === "dpa").length;
  const processorAssets = assets.length;
  const missingDPAs = Math.max(0, processorAssets - dpaDocCount);

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
          document_type: selectedDocType,
          generated: false,
        });

      if (insertError) throw insertError;

      toast({ title: "Dokument lastet opp", description: file.name });
      queryClient.invalidateQueries({ queryKey: ["work-area-documents", workAreaId] });
      setSelectedDocType("other");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      await supabase.storage.from("documents").remove([filePath]);
      await supabase.from("work_area_documents" as any).delete().eq("id", docId);
      toast({ title: "Dokument slettet" });
      queryClient.invalidateQueries({ queryKey: ["work-area-documents", workAreaId] });
    } catch (error: any) {
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Feil ved generering",
        description: error.message,
        variant: "destructive",
      });
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
      });

      toast({ title: "Dokument lagret", description: fileName });
      queryClient.invalidateQueries({ queryKey: ["work-area-documents", workAreaId] });
      setShowPreviewDialog(false);
      setGeneratedContent(null);
    } catch (error: any) {
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Feil ved nedlasting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDocTypeLabel = (type: string) =>
    DOCUMENT_TYPES.find((d) => d.value === type)?.label || type;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card variant="flat">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Dokumenter lastet opp</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="flat">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dpaDocCount}</p>
              <p className="text-xs text-muted-foreground">Databehandleravtaler</p>
            </div>
          </CardContent>
        </Card>
        <Card variant="flat">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${missingDPAs > 0 ? "bg-destructive/10" : "bg-green-500/10"}`}>
              <AlertTriangle className={`h-5 w-5 ${missingDPAs > 0 ? "text-destructive" : "text-green-500"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{missingDPAs}</p>
              <p className="text-xs text-muted-foreground">Manglende DPA-er</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <input
            type="file"
            id="doc-upload"
            className="sr-only"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <div className="flex gap-2">
            <Select value={selectedDocType} onValueChange={setSelectedDocType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Dokumenttype" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => document.getElementById("doc-upload")?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Last opp
            </Button>
          </div>
        </div>

        <Button
          variant="secondary"
          className="gap-2 ml-auto"
          onClick={() => setShowGenerateDialog(true)}
        >
          <Sparkles className="h-4 w-4" />
          Generer dokument
        </Button>
      </div>

      {/* Documents table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dokumentnavn</TableHead>
              <TableHead className="w-[180px]">Type</TableHead>
              <TableHead className="w-[120px]">Dato</TableHead>
              <TableHead className="w-[80px]">Kilde</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Ingen dokumenter ennå. Last opp en kontrakt eller generer et dokument.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{doc.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getDocTypeLabel(doc.document_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString("nb-NO")}
                  </TableCell>
                  <TableCell>
                    {doc.generated ? (
                      <Badge className="text-xs bg-violet-500/10 text-violet-600 border-violet-500/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Opplastet</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(doc.file_path, doc.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(doc.id, doc.file_path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
