import { useMemo, type ReactNode } from "react";

/**
 * Minimal markdown renderer for legal documents (headings, lists, paragraphs).
 * Metadata-linjer (status, org.nr.) hoppes over – datoen vises i sidehodet.
 *
 * Content is grouped into visual cards per section to reduce the wall-of-text
 * feeling and make bullet-heavy terms easier to scan.
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

type ListKind = "ul" | "ol";

type Block =
  | { type: "paragraph"; items: string[] }
  | { type: "list"; kind: ListKind; items: string[] };

type Section = {
  level: number;
  title: string;
  blocks: Block[];
};

function parseSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentBlock: Block | null = null;
  let paraLines: string[] = [];

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = { level: 1, title: "", blocks: [] };
      sections.push(currentSection);
    }
  };

  const flushParagraph = () => {
    if (paraLines.length === 0) return;
    ensureSection();
    currentSection!.blocks.push({ type: "paragraph", items: [paraLines.join(" ")] });
    paraLines = [];
    currentBlock = null;
  };

  const pushListItem = (kind: ListKind, raw: string) => {
    ensureSection();
    if (!currentBlock || currentBlock.type !== "list" || currentBlock.kind !== kind) {
      currentBlock = { type: "list", kind, items: [] };
      currentSection!.blocks.push(currentBlock);
    }
    currentBlock.items.push(raw);
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (SKIP_PREFIXES.some((p) => trimmed.startsWith(p))) {
      flushParagraph();
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      currentSection = {
        level: 2,
        title: trimmed.slice(3).replace(/\*/g, ""),
        blocks: [],
      };
      sections.push(currentSection);
      currentBlock = null;
    } else if (trimmed.startsWith("# ")) {
      flushParagraph();
      currentSection = {
        level: 1,
        title: trimmed.slice(2).replace(/\*/g, ""),
        blocks: [],
      };
      sections.push(currentSection);
      currentBlock = null;
    } else if (trimmed === "") {
      flushParagraph();
      currentBlock = null;
    } else if (trimmed.startsWith("- ")) {
      flushParagraph();
      pushListItem("ul", trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushParagraph();
      pushListItem("ol", trimmed.replace(/^\d+\.\s/, ""));
    } else {
      if (currentBlock?.type === "list") {
        currentBlock = null;
      }
      ensureSection();
      paraLines.push(trimmed);
    }
  });

  flushParagraph();

  return sections;
}

function BulletMarker() {
  return (
    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 ring-2 ring-primary/10" />
  );
}

function NumberMarker({ index }: { index: number }) {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {index + 1}
    </span>
  );
}

function SectionBlock({ block, keyBase }: { block: Block; keyBase: string }) {
  if (block.type === "paragraph") {
    return (
      <p className="text-[15px] leading-7 text-muted-foreground">
        {inline(block.items[0], keyBase)}
      </p>
    );
  }

  const List = block.kind === "ol" ? "ol" : "ul";
  return (
    <List className="space-y-3">
      {block.items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 text-[15px] leading-7 text-muted-foreground"
        >
          {block.kind === "ol" ? <NumberMarker index={i} /> : <BulletMarker />}
          <span className="flex-1">{inline(item, `${keyBase}-${i}`)}</span>
        </li>
      ))}
    </List>
  );
}

export function LegalDocumentView({ markdown }: { markdown: string }) {
  const sections = useMemo(() => parseSections(markdown), [markdown]);

  return (
    <div className="space-y-6">
      {sections.map((section, si) => {
        if (!section.title && section.blocks.length === 0) return null;

        return (
          <section
            key={si}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-card/80"
          >
            {section.title && (
              <div className="mb-5 border-b border-border pb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
            )}
            <div className="space-y-5">
              {section.blocks.map((block, bi) => (
                <SectionBlock
                  key={bi}
                  block={block}
                  keyBase={`${si}-${bi}`}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
