import { useState } from "react";
import { ChevronDown, ChevronRight, Code2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImplementationNote {
  /** Filsti hvor komponenten finnes / skal implementeres. */
  file: string;
  /** Komponentnavn brukt. */
  component?: string;
  /** Når visningen trigges (event/handling som leder til at kunden ser dette). */
  trigger: string;
  /** Hvor kunden faktisk ser dette (e-post, side, PDF…). */
  channel: string;
  /** Eksempel props eller payload. */
  propsExample?: string;
}

interface PreviewFrameProps {
  title: string;
  subtitle?: string;
  /** Type kanal — vises som chip øverst til høyre. */
  channel: string;
  note: ImplementationNote;
  children: React.ReactNode;
  /** Valgfri bakgrunn for previewen — f.eks. "browser" for nettleserramme. */
  surface?: "default" | "muted" | "browser";
  /** Url vist i nettleserrammen (kun for surface=browser). */
  browserUrl?: string;
}

export function PreviewFrame({
  title,
  subtitle,
  channel,
  note,
  children,
  surface = "default",
  browserUrl,
}: PreviewFrameProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
          {channel}
        </span>
      </div>

      {/* Preview area */}
      <div
        className={cn(
          "p-4 md:p-6",
          surface === "default" && "bg-background",
          surface === "muted" && "bg-muted/20",
          surface === "browser" && "bg-muted/40",
        )}
      >
        {surface === "browser" ? (
          <div className="rounded-lg border border-border bg-background overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/60">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <div className="flex-1 mx-2 rounded-md bg-background border border-border px-3 py-1 text-xs text-muted-foreground truncate">
                {browserUrl ?? "https://trust.mynder.no/"}
              </div>
            </div>
            <div className="p-4 md:p-6 bg-background">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Implementation note */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2.5 border-t border-border bg-muted/20 flex items-center gap-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
        Implementeringsnotat
        <span className="ml-auto text-muted-foreground font-normal">
          {open ? "Skjul" : "Vis fil, trigger og props"}
        </span>
      </button>

      {open && (
        <dl className="px-4 py-3 border-t border-border bg-muted/10 grid gap-2 text-xs">
          <Row label="Fil" value={<code className="font-mono">{note.file}</code>} />
          {note.component && <Row label="Komponent" value={<code className="font-mono">{note.component}</code>} />}
          <Row label="Kanal" value={note.channel} />
          <Row label="Trigger" value={note.trigger} />
          {note.propsExample && (
            <div className="pt-1">
              <dt className="text-muted-foreground font-semibold mb-1">Props/payload</dt>
              <dd>
                <pre className="rounded-md bg-foreground/5 border border-border p-2.5 overflow-x-auto text-xs font-mono whitespace-pre">
                  {note.propsExample}
                </pre>
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
      <dt className="text-muted-foreground font-semibold">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
