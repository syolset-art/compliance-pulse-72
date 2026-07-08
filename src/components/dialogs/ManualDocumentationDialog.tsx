import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Upload,
  CheckCheck,
  Loader2,
  FileText,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClassifyEvidence } from "@/hooks/useClassifyEvidence";
import type { EvidenceDocument } from "@/lib/requirementStatusModel";
import { cn } from "@/lib/utils";

interface ManualDocumentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirementId: string;
  requirementName: string;
  onSave: (status: string, comment: string, doc?: EvidenceDocument) => void;
}

const DOC_TYPE_OPTIONS = [
  "Policy",
  "Prosedyre",
  "Databehandleravtale",
  "Risikovurdering",
  "Sertifikat",
  "Revisjonsrapport",
  "Attestasjon",
  "Rutinebeskrivelse",
  "Annet",
];

function extForFile(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return (m?.[1] || "FILE").toUpperCase();
}

export function ManualDocumentationDialog({
  open,
  onOpenChange,
  requirementId,
  requirementName,
  onSave,
}: ManualDocumentationDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("");
  const [articles, setArticles] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state: aiState, classify, reset: resetAi } = useClassifyEvidence();

  const resetAll = () => {
    setStatus("");
    setComment("");
    setFile(null);
    setDocType("");
    setArticles("");
    setSummary("");
    setConfidence(null);
    resetAi();
  };

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      setDocType("");
      setArticles("");
      setSummary("");
      setConfidence(null);
      try {
        const result = await classify(f);
        if (result.classification) {
          setDocType(result.classification.documentTypeLabel || result.classification.documentType || "");
          setArticles((result.classification.supportedControls ?? []).join(", "));
          setSummary(result.classification.summary || "");
          setConfidence(result.classification.confidence ?? null);
        }
      } catch {
        // fallback handled by hook state
      }
    },
    [classify],
  );

  const removeFile = () => {
    setFile(null);
    setDocType("");
    setArticles("");
    setSummary("");
    setConfidence(null);
    resetAi();
  };

  const handleSave = () => {
    if (!status) {
      toast({
        title: "Velg status",
        description: "Du må velge en status for kravet",
        variant: "destructive",
      });
      return;
    }
    if (status === "implemented" && !file) {
      toast({
        title: "Last opp dokumentasjon",
        description: "Legg ved et dokument som viser at kravet er implementert",
        variant: "destructive",
      });
      return;
    }

    let doc: EvidenceDocument | undefined;
    if (file) {
      const articleList = articles
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      doc = {
        name: file.name,
        kind: extForFile(file.name),
        classification:
          docType || articleList.length > 0 || summary
            ? {
                docType: docType || "Annet",
                articles: articleList,
                confidence: confidence ?? 0,
                summary: summary || undefined,
              }
            : undefined,
        verificationStatus: "self_reported",
      };
    }

    onSave(status, comment, doc);
    toast({
      title: "Dokumentasjon lagret",
      description: `Status for ${requirementName} er oppdatert`,
    });
    resetAll();
    onOpenChange(false);
  };

  const analyzing = aiState.phase === "analyzing";
  const manualFallback = aiState.phase === "manual";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAll();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Manuell dokumentering</DialogTitle>
              <DialogDescription>
                Bekreft om dette kravet oppfylles i din organisasjon ved å velge status og legge til dokumentasjon.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Status */}
          <div className="space-y-2">
            <Label className="font-semibold">
              Status <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">Hvordan oppfyller dere dette kravet?</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Velg status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Ikke påbegynt</SelectItem>
                <SelectItem value="in_progress">Pågår</SelectItem>
                <SelectItem value="implemented">Implementert</SelectItem>
                <SelectItem value="verified" disabled>
                  <div className="flex flex-col">
                    <span>Verifisert</span>
                    <span className="text-[11px] text-muted-foreground">
                      Krever signert dokument fra uavhengig organ
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {status === "implemented" && (
              <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs text-foreground">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>
                  Neste steg: last opp dokumentasjon. Du kan senere be om uavhengig verifisering fra dokumentkortet.
                </span>
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label className="font-semibold">Kommentar</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Beskriv hvordan kravet oppfylles i praksis..."
              className="min-h-[80px]"
            />
          </div>

          {/* Uploader — only when Implementert */}
          {status === "implemented" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">
                  Last opp dokumentasjon <span className="text-destructive">*</span>
                </Label>
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Lara klassifiserer
                </Badge>
              </div>

              {!file && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
                  )}
                >
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Dra fil hit eller klikk for å velge</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX · maks 20 MB</p>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              )}

              {file && (
                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {extForFile(file.name)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={removeFile}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="p-3 space-y-3">
                    {analyzing && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Lara analyserer dokumentet…
                      </div>
                    )}

                    {manualFallback && (
                      <div className="flex items-start gap-2 text-xs text-warning">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>Automatisk klassifisering feilet — fyll inn manuelt under.</span>
                      </div>
                    )}

                    {!analyzing && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Dokumenttype</Label>
                            <Select value={docType} onValueChange={setDocType}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Velg…" />
                              </SelectTrigger>
                              <SelectContent>
                                {DOC_TYPE_OPTIONS.map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                                {docType && !DOC_TYPE_OPTIONS.includes(docType) && (
                                  <SelectItem value={docType}>{docType}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Dekker artikkel/kontroll</Label>
                            <input
                              type="text"
                              value={articles}
                              onChange={(e) => setArticles(e.target.value)}
                              placeholder="f.eks. Art. 28, Art. 32"
                              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                          </div>
                        </div>

                        {(summary || confidence !== null) && (
                          <div className="rounded-md bg-muted/30 p-2.5 space-y-1.5">
                            {confidence !== null && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span className="font-medium">
                                  Lara: {Math.round(confidence * 100)}% sikker
                                </span>
                                {articles && (
                                  <span className="text-muted-foreground">· dekker {articles}</span>
                                )}
                              </div>
                            )}
                            {summary && (
                              <p className="text-xs text-muted-foreground leading-snug">{summary}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={analyzing} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Lagre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
