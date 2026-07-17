import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { EvidenceDocument } from "@/lib/requirementStatusModel";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface AttachEvidenceResult {
  document: EvidenceDocument;
  coveredArticles: string[];
  missingArticles: string[];
  coverageRatio: number;
  hasSignedDocument: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirementId: string;
  requirementName: string;
  requirementDescription?: string;
  /** Artikler kravet skal dekke — brukes til dekningsanalyse. */
  coveredArticles?: string[];
  onConfirm: (result: AttachEvidenceResult) => void;
}

type Phase =
  | { kind: "select" }
  | { kind: "analyzing"; fileName: string }
  | { kind: "review"; result: AttachEvidenceResult }
  | { kind: "error"; message: string };

function readAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string) || "");
    r.onerror = () => resolve("");
    r.readAsText(file);
  });
}

export function AttachEvidenceDialog({
  open,
  onOpenChange,
  requirementId,
  requirementName,
  requirementDescription,
  coveredArticles,
  onConfirm,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language !== "en";
  const [phase, setPhase] = useState<Phase>({ kind: "select" });

  const reset = useCallback(() => setPhase({ kind: "select" }), []);

  const handleFile = useCallback(
    async (file: File) => {
      setPhase({ kind: "analyzing", fileName: file.name });
      try {
        const text = await readAsText(file);
        const documentText =
          text.length > 100
            ? text
            : `[Binary file: ${file.name}, size: ${file.size} bytes, type: ${file.type}]`;

        const timeout = new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), 30000),
        );
        const call = supabase.functions.invoke("analyze-evidence-coverage", {
          body: {
            documentText,
            fileName: file.name,
            requirementId,
            requirementName,
            requirementDescription,
            coveredArticles: coveredArticles ?? [],
          },
        });
        const res = (await Promise.race([call, timeout])) as Awaited<typeof call>;
        if (res.error) throw res.error;
        const coverage = res.data?.coverage;
        if (!coverage) throw new Error("no_coverage");

        const covered: string[] = coverage.coveredArticles ?? [];
        const missing: string[] = coverage.missingArticles ?? [];
        const ratio: number =
          typeof coverage.coverageRatio === "number"
            ? Math.max(0, Math.min(1, coverage.coverageRatio))
            : covered.length > 0 && (covered.length + missing.length) > 0
              ? covered.length / (covered.length + missing.length)
              : 0;

        const signature = coverage.signature ?? { isSigned: false };
        const isVerified = signature.isSigned === true;

        const document: EvidenceDocument = {
          name: file.name,
          kind: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
          classification: {
            docType: coverage.docType ?? "document",
            articles: covered,
            confidence: coverage.confidence ?? 0.7,
            summary: coverage.summary,
          },
          signature: {
            isSigned: !!signature.isSigned,
            signedBy: signature.signedBy,
            signedAt: signature.signedAt,
            issuer: signature.issuer,
          },
          verificationStatus: isVerified ? "verified" : "self_reported",
          verifiedBy: signature.issuer ?? signature.signedBy,
          verifiedAt: signature.signedAt,
        };

        setPhase({
          kind: "review",
          result: {
            document,
            coveredArticles: covered,
            missingArticles: missing,
            coverageRatio: ratio,
            hasSignedDocument: !!signature.isSigned,
          },
        });
      } catch (err) {
        console.error(err);
        setPhase({
          kind: "error",
          message:
            err instanceof Error && err.message === "timeout"
              ? isNb
                ? "Analysen tok for lang tid. Prøv igjen."
                : "Analysis timed out. Please try again."
              : isNb
                ? "Kunne ikke analysere dokumentet."
                : "Could not analyze the document.",
        });
      }
    },
    [requirementId, requirementName, requirementDescription, coveredArticles, isNb],
  );

  const percent = phase.kind === "review" ? Math.round(phase.result.coverageRatio * 100) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isNb ? "Tilknytt bevis" : "Attach evidence"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isNb
              ? `Last opp et dokument. Lara analyserer hvilke artikler det dekker for «${requirementName}».`
              : `Upload a document. Lara analyzes which articles it covers for "${requirementName}".`}
          </DialogDescription>
        </DialogHeader>

        {phase.kind === "select" && (
          <div className="space-y-3">
            <label
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-muted/40 cursor-pointer transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-medium text-foreground">
                {isNb ? "Dra fil hit eller klikk for å velge" : "Drop a file here or click to browse"}
              </div>
              <div className="text-xs text-muted-foreground">
                {isNb ? "PDF, DOCX, TXT" : "PDF, DOCX, TXT"}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
            {(coveredArticles?.length ?? 0) > 0 && (
              <div className="text-xs text-muted-foreground">
                <div className="font-medium text-foreground mb-1">
                  {isNb ? "Kravet skal dekke:" : "This requirement covers:"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {coveredArticles!.map((a) => (
                    <Badge key={a} variant="outline" className="text-[10px]">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {phase.kind === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <div className="text-sm text-foreground">
              {isNb ? "Lara analyserer dokumentet…" : "Lara is analyzing the document…"}
            </div>
            <div className="text-xs text-muted-foreground">{phase.fileName}</div>
          </div>
        )}

        {phase.kind === "review" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{phase.result.document.name}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {isNb ? "Dekning" : "Coverage"}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      percent === 100
                        ? "text-success"
                        : percent >= 60
                          ? "text-warning"
                          : "text-destructive",
                    )}
                  >
                    {phase.result.coveredArticles.length}/
                    {phase.result.coveredArticles.length + phase.result.missingArticles.length ||
                      "?"}{" "}
                    ({percent}%)
                  </span>
                </div>
                <Progress value={percent} className="h-2" />
              </div>
              {phase.result.document.classification?.summary && (
                <p className="text-xs text-muted-foreground italic">
                  {phase.result.document.classification.summary}
                </p>
              )}
            </div>

            {phase.result.coveredArticles.length > 0 && (
              <div>
                <div className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  {isNb ? "Dekket" : "Covered"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {phase.result.coveredArticles.map((a) => (
                    <Badge
                      key={a}
                      variant="outline"
                      className="text-[10px] border-success/40 text-success"
                    >
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {phase.result.missingArticles.length > 0 && (
              <div>
                <div className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-warning" />
                  {isNb ? "Mangler dekning" : "Not covered"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {phase.result.missingArticles.map((a) => (
                    <Badge
                      key={a}
                      variant="outline"
                      className="text-[10px] border-warning/40 text-warning"
                    >
                      {a}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isNb
                    ? "Manglende dekning reduserer score for dette kravet."
                    : "Missing coverage reduces the score for this requirement."}
                </p>
              </div>
            )}

            <div
              className={cn(
                "flex items-start gap-2 rounded-md border p-2 text-xs",
                phase.result.hasSignedDocument
                  ? "border-success/40 bg-success/5"
                  : "border-border bg-muted/30",
              )}
            >
              <ShieldCheck
                className={cn(
                  "h-4 w-4 mt-0.5 shrink-0",
                  phase.result.hasSignedDocument ? "text-success" : "text-muted-foreground",
                )}
              />
              <div>
                <div className="font-medium text-foreground">
                  {phase.result.hasSignedDocument
                    ? isNb
                      ? "Signatur oppdaget"
                      : "Signature detected"
                    : isNb
                      ? "Ingen signatur oppdaget"
                      : "No signature detected"}
                </div>
                <div className="text-muted-foreground">
                  {isNb
                    ? "Signatur påvirker ikke score — den forsterker kun tillitsgraden."
                    : "Signature does not affect score — it only strengthens trust level."}
                </div>
                {phase.result.document.signature?.issuer && (
                  <div className="text-muted-foreground mt-0.5">
                    {isNb ? "Utsteder: " : "Issuer: "}
                    <span className="text-foreground">{phase.result.document.signature.issuer}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {phase.kind === "error" && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div className="text-sm text-foreground">{phase.message}</div>
          </div>
        )}

        <DialogFooter>
          {phase.kind === "review" ? (
            <>
              <Button variant="ghost" onClick={reset}>
                {isNb ? "Last opp annet dokument" : "Upload another"}
              </Button>
              <Button
                onClick={() => {
                  onConfirm(phase.result);
                  reset();
                  onOpenChange(false);
                  toast.success(
                    isNb
                      ? `Bevis tilknyttet (${Math.round(phase.result.coverageRatio * 100)}% dekning)`
                      : `Evidence attached (${Math.round(phase.result.coverageRatio * 100)}% coverage)`,
                  );
                }}
              >
                {isNb ? "Bekreft og tilknytt" : "Confirm & attach"}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {phase.kind === "error" ? (isNb ? "Lukk" : "Close") : isNb ? "Avbryt" : "Cancel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
