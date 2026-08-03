import { useMemo } from "react";
import { useTerms } from "@/hooks/useTerms";
import { Loader2 } from "lucide-react";

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const out: JSX.Element[] = [];
  let para: string[] = [];

  const flush = (key: string) => {
    if (para.length === 0) return;
    const text = para.join(" ");
    out.push(
      <p key={key} className="text-sm text-muted-foreground leading-relaxed">
        {text.replace(/^_|_$/g, "")}
      </p>
    );
    para = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      flush(`p-${i}`);
      out.push(
        <h2 key={i} className="text-base font-semibold text-foreground mt-6">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flush(`p-${i}`);
      out.push(
        <h1 key={i} className="text-2xl font-semibold text-foreground">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed === "") {
      flush(`p-${i}`);
    } else {
      para.push(trimmed);
    }
  });
  flush("p-end");
  return out;
}

export default function Terms() {
  const { current, loading } = useTerms();
  const body = useMemo(() => (current ? renderMarkdown(current.content_md) : []), [current]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Laster vilkår…
          </div>
        ) : current ? (
          <>
            <p className="text-xs text-muted-foreground">
              Versjon {current.version} · gjelder fra{" "}
              {new Date(current.effective_date).toLocaleDateString("nb-NO", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            <div className="space-y-3">{body}</div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Vilkårene er ikke tilgjengelige akkurat nå.</p>
        )}
      </div>
    </div>
  );
}
