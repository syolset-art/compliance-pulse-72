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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (open) fetchDocuments();
  }, [open, frameworkId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const filePath = `framework-docs/${frameworkId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("framework_documents")
        .insert({
          framework_id: frameworkId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          document_type: selectedType,
          notes: notes || null,
        } as any);

      if (insertError) throw insertError;

      toast({ title: "Dokument lastet opp", description: file.name });
      setNotes("");
      setSelectedType("policy");
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
            <Textarea
              placeholder="Notater (valgfritt)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 min-h-0 text-xs resize-none py-2"
            />
          </div>
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
            {documents.map((doc) => (
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
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
