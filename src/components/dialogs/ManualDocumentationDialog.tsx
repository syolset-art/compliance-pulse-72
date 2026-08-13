import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check } from "lucide-react";
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
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTypicalDocumentation } from "@/lib/requirementDocumentationHints";
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

function FieldHelp({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Hjelp"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 text-xs leading-relaxed">
        {children}
      </PopoverContent>
    </Popover>
  );
}



export function ManualDocumentationDialog({
  open,
  onOpenChange,
  requirementId,
  requirementName,
  onSave,
}: ManualDocumentationDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("");
  const [articles, setArticles] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [verifiedConfirmed, setVerifiedConfirmed] = useState(false);
  const [verifierName, setVerifierName] = useState("");
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
    setVerifiedConfirmed(false);
    setVerifierName("");
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
    if ((status === "implemented" || status === "verified") && !file) {
      toast({
        title: "Last opp dokumentasjon",
        description:
          status === "verified"
            ? "Last opp det signerte dokumentet fra uavhengig organ"
            : "Legg ved et dokument som viser at kravet er implementert",
        variant: "destructive",
      });
      return;
    }
    if (status === "verified" && (!verifiedConfirmed || !verifierName.trim())) {
      toast({
        title: "Bekreft verifisering",
        description: "Oppgi uavhengig organ og bekreft at dokumentet er signert av dem",
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
        verificationStatus: status === "verified" ? "verified" : "self_reported",
        verifiedBy: status === "verified" ? verifierName.trim() : undefined,
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
            <div className="flex items-center gap-1.5">
              <Label className="font-semibold">
                Status <span className="text-destructive">*</span>
              </Label>
              <FieldHelp>
                <p className="font-medium mb-1">Statusskala</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li><span className="text-foreground">Ikke besvart</span> — kravet er ikke adressert.</li>
                  <li><span className="text-foreground">Pågår</span> — arbeid pågår, ikke ferdig.</li>
                  <li><span className="text-foreground">Implementert</span> — innført; bevis er egenrapportert dokumentasjon dere har lastet opp.</li>
                  <li><span className="text-foreground">Verifisert</span> — bevis er signert eller attestert av uavhengig organ (revisor, sertifiseringsorgan).</li>
                  <li><span className="text-foreground">Ikke relevant</span> — kravet gjelder ikke for din organisasjon.</li>
                </ul>
              </FieldHelp>
            </div>
            <p className="text-xs text-muted-foreground">Hvordan oppfyller dere dette kravet?</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Velg status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_answered">Ikke besvart</SelectItem>

                <SelectItem value="in_progress">Pågår</SelectItem>
                <SelectItem value="implemented">Implementert</SelectItem>
                <SelectPrimitive.Item
                  value="verified"
                  className="relative flex w-full cursor-default select-none items-start rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
                >
                  <span className="absolute left-2 top-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <div className="flex flex-col">
                    <SelectPrimitive.ItemText>Verifisert</SelectPrimitive.ItemText>
                    <span className="text-[11px] text-foreground/70">
                      Krever signert dokument fra uavhengig organ
                    </span>
                  </div>
                </SelectPrimitive.Item>
                <SelectPrimitive.Item
                  value="not_applicable"
                  className="relative flex w-full cursor-default select-none items-start rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
                >
                  <span className="absolute left-2 top-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <div className="flex flex-col">
                    <SelectPrimitive.ItemText>Ikke relevant</SelectPrimitive.ItemText>
                    <span className="text-[11px] text-foreground/70">
                      Kravet gjelder ikke for din organisasjon
                    </span>
                  </div>
                </SelectPrimitive.Item>
              </SelectContent>
            </Select>
          </div>


          {/* Comment */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="font-semibold">Kommentar</Label>
              <FieldHelp>
                <p className="font-medium mb-1">Hva skal du skrive?</p>
                <p className="text-muted-foreground">
                  Beskriv kort hvordan dere oppfyller kravet i praksis — hvilke rutiner, systemer eller ansvarlige dere har på plass.
                  Dette hjelper Lara å vurdere modenhet og gir revisor kontekst.
                </p>
              </FieldHelp>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                status === "not_started"
                  ? "F.eks. 'Vi har ikke startet, men planlegger å adressere dette i Q3.'"
                  : status === "in_progress"
                    ? "F.eks. 'Utkast til rutine er skrevet, avventer godkjenning fra ledelsen.'"
                    : status === "implemented"
                      ? "F.eks. 'Vi har databehandleravtale med alle underleverandører, gjennomgått årlig av DPO.'"
                      : status === "verified"
                        ? "F.eks. 'Rutinen er revidert av BDO i juni 2026, med signert attestasjon vedlagt.'"
                        : status === "not_applicable"
                          ? "F.eks. 'Vi behandler ikke personopplysninger om barn, derfor gjelder ikke dette kravet.'"
                          : "Velg status for å se et eksempel…"
              }
              className="min-h-[80px]"
            />
          </div>

          {/* Uploader — for Implementert og Verifisert */}
          {(status === "implemented" || status === "verified") && (() => {
            const hint = getTypicalDocumentation(requirementId);
            return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="font-semibold">
                    {status === "verified" ? "Last opp signert dokument" : "Last opp dokumentasjon"} <span className="text-destructive">*</span>
                  </Label>
                  <FieldHelp>
                    <p className="font-medium mb-1">Hvorfor kreves dokumentasjon som bevis?</p>
                    <p className="text-muted-foreground mb-2">
                      Status <span className="text-foreground">{status === "verified" ? "Verifisert" : "Implementert"}</span> krever at kravet kan dokumenteres.
                      Uten dokumentasjon har kravet ingen bevisverdi — det står bare som en påstand mot revisor og kunder.
                    </p>
                    <p className="font-medium mb-1">Typisk dokumentasjon for {hint.articleLabel}:</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {hint.typicalDocs.map((d) => (
                        <li key={d}>· {d}</li>
                      ))}
                    </ul>
                  </FieldHelp>
                </div>
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
            );
          })()}

          {/* Verifisert-bekreftelse */}
          {status === "verified" && (
            <div className="space-y-3 rounded-lg border border-success/30 bg-success/5 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                <Label className="font-semibold text-sm">{t("manualDocDialog.verifyConfirm.title")}</Label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {t("manualDocDialog.verifyConfirm.orgLabel")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  placeholder={t("manualDocDialog.verifyConfirm.orgPlaceholder")}
                />
              </div>
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={verifiedConfirmed}
                  onCheckedChange={(v) => setVerifiedConfirmed(v === true)}
                  className="mt-0.5"
                />
                <span>{t("manualDocDialog.verifyConfirm.checkboxText")}</span>
              </label>
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
