import { type ReactNode } from "react";

/** Lager en stabil ankerid av en overskrift. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\wæøå\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Henter innholdsfortegnelsen (nivå 2-overskrifter) fra markdown. */
export function extractToc(markdown: string): { id: string; label: string }[] {
  return markdown
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const label = l.replace(/^##\s+/, "").trim();
      return { id: headingId(label), label };
    });
}

/** Gjør om **fet tekst** til React-elementer. */
function inline(text: string, keyBase: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={`${keyBase}-${i}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={`${keyBase}-${i}`}>{part}</span>
      ),
    );
}

/**
 * Enkel, lesbar markdown-visning for juridiske dokumenter.
 * Overskrifter får ankerid slik at innholdsfortegnelsen kan lenke til dem.
 */
export function LegalMarkdown({ markdown }: { markdown: string }) {
  const blocks: ReactNode[] = [];
  const lines = markdown.split("\n");
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = (key: string) => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={key} className="text-[15px] leading-7 text-muted-foreground">
        {paragraph.flatMap((l, i) => [
          ...inline(l, `${key}-${i}`),
          i < paragraph.length - 1 ? <br key={`${key}-br-${i}`} /> : null,
        ])}
      </p>,
    );
    paragraph = [];
  };

  const flushList = (key: string) => {
    if (!list.length) return;
    blocks.push(
      <ul key={key} className="list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-muted-foreground">
        {list.map((item, i) => (
          <li key={`${key}-${i}`}>{inline(item, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();
    const key = `b-${index}`;

    if (!line.trim()) {
      flushParagraph(key);
      flushList(`${key}-l`);
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph(`${key}-p`);
      flushList(`${key}-l`);
      const label = line.replace(/^##\s+/, "").trim();
      blocks.push(
        <h2
          key={key}
          id={headingId(label)}
          className="scroll-mt-24 pt-6 text-lg font-semibold text-foreground"
        >
          {label}
        </h2>,
      );
      return;
    }

    if (line.startsWith("### ")) {
      flushParagraph(`${key}-p`);
      flushList(`${key}-l`);
      const label = line.replace(/^###\s+/, "").trim();
      blocks.push(
        <h3 key={key} id={headingId(label)} className="scroll-mt-24 pt-3 text-base font-semibold text-foreground">
          {label}
        </h3>,
      );
      return;
    }

    if (/^[a-z]\.\s/.test(line.trim()) || line.trim().startsWith("- ")) {
      flushParagraph(`${key}-p`);
      list.push(line.trim().replace(/^-\s+/, ""));
      return;
    }

    flushList(`${key}-l`);
    paragraph.push(line);
  });

  flushParagraph("b-end");
  flushList("b-end-l");

  return <div className="space-y-4">{blocks}</div>;
}
