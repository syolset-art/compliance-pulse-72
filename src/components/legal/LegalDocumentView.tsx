import { useMemo } from "react";

/**
 * Minimal markdown renderer for legal documents (headings + paragraphs).
 */
export function LegalDocumentView({ markdown }: { markdown: string }) {
  const body = useMemo(() => {
    const lines = markdown.split("\n");
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
  }, [markdown]);

  return <div className="space-y-3">{body}</div>;
}
