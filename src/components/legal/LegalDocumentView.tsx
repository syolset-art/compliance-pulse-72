import { useMemo, type ReactNode } from "react";

/**
 * Minimal markdown renderer for legal documents (headings, lists, paragraphs).
 * Metadata-linjer (status, org.nr.) hoppes over – datoen vises i sidehodet.
 */
const SKIP_PREFIXES = ["**Status:**", "**Mynder AS**, org.nr.", "---"];

/** Gjør om **fet tekst** til <strong> og fjerner gjenværende stjerner. */
function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyBase}-${i}`} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyBase}-${i}`}>{part.replace(/\*/g, "")}</span>;
  });
}

export function LegalDocumentView({ markdown }: { markdown: string }) {
  const body = useMemo(() => {
    const lines = markdown.split("\n");
    const out: JSX.Element[] = [];
    let para: string[] = [];
    let list: string[] = [];

    const flushList = (key: string) => {
      if (list.length === 0) return;
      out.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1">
          {list.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed">
              {inline(item, `${key}-${i}`)}
            </li>
          ))}
        </ul>
      );
      list = [];
    };

    const flush = (key: string) => {
      flushList(key);
      if (para.length === 0) return;
      const text = para.join(" ");
      out.push(
        <p key={key} className="text-sm text-muted-foreground leading-relaxed">
          {inline(text.replace(/^_|_$/g, ""), key)}
        </p>
      );
      para = [];
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (SKIP_PREFIXES.some((p) => trimmed.startsWith(p))) {
        flush(`p-${i}`);
        return;
      }
      if (trimmed.startsWith("## ")) {
        flush(`p-${i}`);
        out.push(
          <h2 key={i} className="text-base font-semibold text-foreground mt-6">
            {trimmed.slice(3).replace(/\*/g, "")}
          </h2>
        );
      } else if (trimmed.startsWith("# ")) {
        flush(`p-${i}`);
        out.push(
          <h1 key={i} className="text-2xl font-semibold text-foreground">
            {trimmed.slice(2).replace(/\*/g, "")}
          </h1>
        );
      } else if (trimmed.startsWith("- ")) {
        flush(`p-${i}`);
        list.push(trimmed.slice(2));
      } else if (trimmed === "") {
        flush(`p-${i}`);
      } else {
        flushList(`p-${i}`);
        para.push(trimmed);
      }
    });
    flush("p-end");
    return out;
  }, [markdown]);

  return <div className="space-y-3">{body}</div>;
}
