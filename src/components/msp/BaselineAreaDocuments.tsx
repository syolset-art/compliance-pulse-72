import { useRef, useState } from "react";
import { Paperclip, Upload, Sparkles, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { BaselineDocument } from "@/hooks/useBaselineDocuments";
import { suggestQuestionsForFile } from "@/hooks/useBaselineDocuments";
import type { MaturityQuestion } from "@/lib/trustMaturityQuestions";

interface Props {
  areaId: string;
  questions: MaturityQuestion[];
  documents: BaselineDocument[];
  onAdd: (doc: { areaId: string; fileName: string; size: number; questionIds: string[]; suggestedQuestionIds?: string[] }) => void;
  onLink: (docId: string, questionIds: string[]) => void;
  onRemove: (docId: string) => void;
}

export function BaselineAreaDocuments({
  areaId,
  questions,
  documents,
  onAdd,
  onLink,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const suggested = suggestQuestionsForFile(file.name, questions);
      onAdd({
        areaId,
        fileName: file.name,
        size: file.size,
        questionIds: suggested,
        suggestedQuestionIds: suggested,
      });
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap py-2 border-b border-border/60">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
        Dokumentasjon
        {documents.length > 0 && <span>· {documents.length}</span>}
      </span>

      {documents.map((doc) => (
        <DocumentChip
          key={doc.id}
          doc={doc}
          questions={questions}
          onLink={onLink}
          onRemove={onRemove}
        />
      ))}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4 ml-auto"
      >
        <Upload className="h-3 w-3" />
        Last opp
      </button>
    </div>
  );
}

function DocumentChip({
  doc,
  questions,
  onLink,
  onRemove,
}: {
  doc: BaselineDocument;
  questions: MaturityQuestion[];
  onLink: (docId: string, questionIds: string[]) => void;
  onRemove: (docId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(doc.questionIds);
  const isSuggestion = (doc.suggestedQuestionIds?.length ?? 0) > 0;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setSelected(doc.questionIds);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs max-w-[180px] transition-colors",
            isSuggestion
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-border bg-muted/40 text-foreground/80 hover:bg-muted",
          )}
          title={doc.fileName}
        >
          {isSuggestion && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
          <span className="truncate">{doc.fileName}</span>
          {doc.questionIds.length > 0 && (
            <span className="text-muted-foreground shrink-0">· {doc.questionIds.length}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{doc.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {isSuggestion ? "Lara foreslår kobling — bekreft" : "Koblet dokumentasjon"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(doc.id)}
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label="Fjern dokument"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {questions.map((q) => (
            <label key={q.id} className="flex items-start gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={selected.includes(q.id)}
                onCheckedChange={() => toggle(q.id)}
                className="mt-0.5"
              />
              <span className="leading-snug text-foreground/80">{q.text}</span>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onLink(doc.id, selected);
            setOpen(false);
          }}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Check className="h-3.5 w-3.5" />
          Lagre kobling
        </button>
      </PopoverContent>
    </Popover>
  );
}
