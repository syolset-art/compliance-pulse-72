import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Sparkles, Upload } from "lucide-react";
import { persistHubDocument, linkRequirementEvidence } from "@/lib/requirementEvidence";
import { analyseDocumentCoverage, coverageLabel, type CoverageMatch } from "@/lib/laraDocumentCoverage";
import { hasDocumentationCatalog } from "@/lib/requirementDocumentationHints";

const DOC_TYPES = [
  { id: "policy", nb: "Policy", en: "Policy" },
  { id: "dpa", nb: "Databehandleravtale", en: "Data processing agreement" },
  { id: "audit_report", nb: "Revisjonsrapport", en: "Audit report" },
  { id: "certification", nb: "Sertifisering", en: "Certification" },
  { id: "evidence", nb: "Bevis", en: "Evidence" },
  { id: "other", nb: "Annet", en: "Other" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Aktiverte regelverk, brukes til å velge hva Lara skal analysere mot. */
  frameworks: { framework_id: string; framework_name: string }[];
  /** Forhåndsvalgt dokumenttype/navn (fra veiledende dokumentasjon). */
  presetName?: string;
  presetType?: string;
  presetFrameworkId?: string;
}

type Step = "form" | "saving" | "offer" | "analysing" | "done";

export function UploadHubDocumentDialog({
  open,
  onOpenChange,
  frameworks,
  presetName,
  presetType,
  presetFrameworkId,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analysable = frameworks.filter((f) => hasDocumentationCatalog(f.framework_id));

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("other");
  const [frameworkId, setFrameworkId] = useState<string>("");
  const [step, setStep] = useState<Step>("form");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [matches, setMatches] = useState<CoverageMatch[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileId = useId();
  const nameId = useId();
  const typeId = useId();
  const frameworkId_ = useId();
  const fileErrorId = `${fileId}-error`;

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setName(presetName ?? "");
    setType(presetType ?? "other");
    setFrameworkId(presetFrameworkId ?? analysable[0]?.framework_id ?? "");
    setStep("form");
    setDocumentId(null);
    setMatches([]);
    setFileError(null);
    // Fokus på første felt når dialogen åpnes.
    window.setTimeout(() => fileInputRef.current?.focus(), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["document-hub"] });
    if (frameworkId) queryClient.invalidateQueries({ queryKey: ["requirement-evidence", frameworkId] });
  };

  const handleUpload = async () => {
    if (!file) {
      setFileError(L("Du må velge en fil før du kan laste opp.", "You must choose a file before uploading."));
      fileInputRef.current?.focus();
      return;
    }
    setFileError(null);
    setStep("saving");
    const result = await persistHubDocument({
      file,
      displayName: name || file.name,
      documentType: type,
    });
    if ("error" in result) {
      toast({
        title: L("Kunne ikke lagre dokumentet", "Could not save the document"),
        description: result.error,
        variant: "destructive",
      });
      setStep("form");
      setFileError(result.error);
      fileInputRef.current?.focus();
      return;
    }
    setDocumentId(result.documentId);
    refresh();
    setStep("offer");
  };

  const handleAnalyse = async () => {
    if (!documentId || !frameworkId || !file) return;
    setStep("analysing");
    const found = analyseDocumentCoverage({
      frameworkId,
      displayName: name || file.name,
      fileName: file.name,
      documentType: type,
    });
    setMatches(found);
    if (found.length) {
      const { error } = await linkRequirementEvidence({
        documentId,
        frameworkId,
        matches: found.map((m) => ({
          requirementId: m.requirementId,
          coveredArticles: m.coveredArticles,
          missingArticles: m.missingArticles,
          coverageRatio: m.coverageRatio,
        })),
      });
      if (error) {
        toast({
          title: L("Kunne ikke lagre analysen", "Could not save the analysis"),
          description: error,
          variant: "destructive",
        });
      }
    }
    refresh();
    setStep("done");
  };

  const finishLater = () => {
    toast({
      title: L("Dokumentet er lagret", "Document saved"),
      description: L(
        "Du kan la Lara analysere det senere fra dokumentpanelet.",
        "You can let Lara analyse it later from the document panel.",
      ),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {L("Last opp dokument", "Upload document")}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {L(
              "Dokumentet lagres på din egen organisasjon og dukker opp i Dokument hub med én gang.",
              "The document is stored on your own organisation and appears in the Document hub right away.",
            )}
          </DialogDescription>
        </DialogHeader>

        {(step === "form" || step === "saving") && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={fileId} className="text-[13px]">
                {L("Fil", "File")}
              </Label>
              <Input
                id={fileId}
                ref={fileInputRef}
                type="file"
                aria-invalid={!!fileError}
                aria-describedby={fileError ? fileErrorId : undefined}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setFileError(null);
                  if (f && !name) setName(f.name.replace(/\.[a-z0-9]+$/i, ""));
                }}
              />
              {fileError && (
                <p id={fileErrorId} className="text-[13px] text-destructive">
                  {fileError}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={nameId} className="text-[13px]">
                {L("Visningsnavn", "Display name")}
              </Label>
              <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={typeId} className="text-[13px]">
                {L("Dokumenttype", "Document type")}
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id={typeId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {isNb ? t.nb : t.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === "offer" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                {L("Vil du at Lara skal analysere dokumentet?", "Would you like Lara to analyse the document?")}
              </div>
              <p className="text-[13px] text-muted-foreground">
                {L(
                  "Lara finner hvilke krav dokumentet dekker, og hvor mange av artiklene det treffer. Det påvirker modenheten. Du kan gjøre dette senere også.",
                  "Lara finds which requirements the document covers and how many of the articles it addresses. This affects maturity. You can also do this later.",
                )}
              </p>
            </div>
            {analysable.length > 0 ? (
              <div className="space-y-1.5">
                <Label htmlFor={frameworkId_} className="text-[13px]">
                  {L("Analyser mot regelverk", "Analyse against regulation")}
                </Label>
                <Select value={frameworkId} onValueChange={setFrameworkId}>
                  <SelectTrigger id={frameworkId_}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {analysable.map((f) => (
                      <SelectItem key={f.framework_id} value={f.framework_id}>
                        {f.framework_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                {L(
                  "Dere har ingen aktiverte regelverk å analysere mot ennå.",
                  "You have no activated regulations to analyse against yet.",
                )}
              </p>
            )}
          </div>
        )}

        {step === "analysing" && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {L("Lara analyserer dokumentet…", "Lara is analysing the document…")}
          </div>
        )}

        {step === "done" && (
          <div className="space-y-3" role="status" aria-live="polite">
            {matches.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                {L(
                  "Lara fant ingen tydelig kobling mot kravene i dette regelverket. Dokumentet er lagret, og du kan koble det manuelt fra Regelverk.",
                  "Lara found no clear link to the requirements in this regulation. The document is saved and you can link it manually from Regulations.",
                )}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[13px] text-muted-foreground">
                  {L("Dokumentet dekker:", "The document covers:")}
                </p>
                {matches.map((m) => (
                  <div
                    key={m.requirementId}
                    className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{m.label}</p>
                      <p className="text-[12px] text-muted-foreground truncate">
                        {m.coveredArticles.join(", ")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        m.coverageRatio >= 1
                          ? "border-success bg-success/10 text-foreground"
                          : "border-warning bg-warning/10 text-foreground"
                      }
                    >
                      {coverageLabel(m.coverageRatio, isNb)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {(step === "form" || step === "saving") && (
            <Button onClick={handleUpload} disabled={!file || step === "saving"} className="gap-2">
              {step === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              {L("Last opp", "Upload")}
            </Button>
          )}
          {step === "offer" && (
            <>
              <Button variant="outline" onClick={finishLater}>
                {L("Gjør det senere", "Do it later")}
              </Button>
              <Button onClick={handleAnalyse} disabled={!frameworkId} className="gap-2">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {L("Analyser nå", "Analyse now")}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => onOpenChange(false)} className="gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {L("Ferdig", "Done")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
