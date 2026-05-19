import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, CheckCircle2, ShieldCheck, Eye, Clock, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface EvidenceFileMeta {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export type ActivityStatus = "in_progress" | "not_relevant" | "done";

export interface ConfirmPayload {
  note: string;
  files: EvidenceFileMeta[];
  sharedWithCustomer: boolean;
  status: ActivityStatus;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityLabel: string;
  controlId: string;
  controlName: string;
  frameworkLabel?: string;
  readOnly?: boolean;
  initial?: Partial<ConfirmPayload>;
  onConfirm?: (payload: ConfirmPayload) => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const ConfirmActivityDialog = ({
  open,
  onOpenChange,
  activityLabel,
  controlId,
  controlName,
  frameworkLabel,
  readOnly = false,
  initial,
  onConfirm,
}: Props) => {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<EvidenceFileMeta[]>([]);
  const [shared, setShared] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNote(initial?.note ?? "");
      setFiles(initial?.files ?? []);
      setShared(initial?.sharedWithCustomer ?? true);
    }
  }, [open, initial]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: EvidenceFileMeta[] = Array.from(list).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      uploadedAt: new Date().toISOString(),
    }));
    setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            {readOnly ? "Bevis for aktivitet" : "Send aktivitet til kunde"}
          </DialogTitle>
          <DialogDescription className="space-y-1.5 pt-1">
            <span className="block text-foreground font-medium">{activityLabel}</span>
            <span className="flex flex-wrap items-center gap-1.5 text-xs">
              <Badge variant="outline" className="text-[10px] font-mono">{controlId}</Badge>
              <span className="text-muted-foreground">{controlName}</span>
              {frameworkLabel && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <FileText className="h-3 w-3" />
                  {frameworkLabel}
                </Badge>
              )}
            </span>
            {!readOnly && (
              <span className="block text-[11px] text-muted-foreground pt-1">
                Kunden må godkjenne rapporten før aktiviteten kan berike Trust Profile.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Notat til kunde {readOnly ? "" : "(valgfritt)"}
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kort beskrivelse av hva som er gjort…"
              rows={3}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Dokumentbevis {!readOnly && <span className="text-muted-foreground font-normal">— vedlegg kunden får til godkjenning</span>}
            </label>



            {!readOnly && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs text-foreground font-medium">
                  Dra filer hit eller klikk for å velge
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  PDF, bilder, Office-dokumenter
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>
            )}

            {files.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs text-foreground flex-1 truncate">{f.name}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {formatSize(f.size)}
                    </span>
                    {readOnly ? (
                      <button
                        type="button"
                        onClick={() => toast.info(`Åpner ${f.name}`, { description: "Forhåndsvisning i demo." })}
                        className="text-muted-foreground hover:text-primary"
                        aria-label="Åpne fil"
                        title="Åpne fil"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Fjern fil"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                  </li>
                ))}
              </ul>
            )}

            {readOnly && files.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Ingen bevis lastet opp.</p>
            )}
          </div>

          {!readOnly && (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  Sendes til kunden for godkjenning
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Du kan ikke berike kundens Trust Profile direkte. Kunden mottar rapporten på melding og må godkjenne den før modenhetsscoren oppdateres.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {readOnly ? (
            <Button onClick={() => onOpenChange(false)}>Lukk</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button
                onClick={() => {
                  onConfirm?.({ note, files, sharedWithCustomer: true });
                  onOpenChange(false);
                }}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Send til kunde for godkjenning
              </Button>

            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
