import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { OFFER_VARIABLES } from "@/lib/offerVariables";

interface VariableTextareaProps {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  language?: "no" | "en";
  singleLine?: boolean;
  id?: string;
}

export interface VariableTextareaHandle {
  insertVariable: (key: string) => void;
  focus: () => void;
}

/**
 * Textarea that supports "/" command palette for variable insertion.
 */
export const VariableTextarea = forwardRef<VariableTextareaHandle, VariableTextareaProps>(
  ({ value, onChange, rows = 8, placeholder, language = "no", singleLine, id }, ref) => {
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [slashStart, setSlashStart] = useState<number | null>(null);
    const [query, setQuery] = useState("");

    const closeMenu = () => {
      setMenuOpen(false);
      setSlashStart(null);
      setQuery("");
    };

    const insertAt = useCallback(
      (start: number, end: number, replacement: string) => {
        const next = value.slice(0, start) + replacement + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const pos = start + replacement.length;
            inputRef.current.focus();
            inputRef.current.setSelectionRange(pos, pos);
          }
        });
      },
      [value, onChange],
    );

    const insertVariable = useCallback(
      (key: string) => {
        const token = `{{${key}}}`;
        const el = inputRef.current;
        if (slashStart != null && el) {
          const caret = el.selectionStart ?? value.length;
          insertAt(slashStart, caret, token);
        } else if (el) {
          const start = el.selectionStart ?? value.length;
          const end = el.selectionEnd ?? value.length;
          insertAt(start, end, token);
        } else {
          onChange(value + token);
        }
        closeMenu();
      },
      [insertAt, slashStart, value, onChange],
    );

    useImperativeHandle(ref, () => ({
      insertVariable,
      focus: () => inputRef.current?.focus(),
    }));

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const next = e.target.value;
      onChange(next);
      const caret = e.target.selectionStart ?? next.length;
      // Detect "/" trigger
      const lastSlash = next.lastIndexOf("/", caret - 1);
      if (lastSlash >= 0) {
        const before = lastSlash === 0 ? "" : next[lastSlash - 1];
        const isWordBoundary = !before || /\s/.test(before);
        const fragment = next.slice(lastSlash + 1, caret);
        if (isWordBoundary && !/\s/.test(fragment)) {
          setSlashStart(lastSlash);
          setQuery(fragment.toLowerCase());
          // Position menu near caret (rough)
          const rect = e.target.getBoundingClientRect();
          setMenuPos({ top: rect.bottom + 4, left: rect.left + 12 });
          setMenuOpen(true);
          return;
        }
      }
      if (menuOpen) closeMenu();
    };

    useEffect(() => {
      if (!menuOpen) return;
      const onClick = (e: MouseEvent) => {
        const t = e.target as HTMLElement;
        if (!t.closest("[data-variable-menu]") && t !== inputRef.current) closeMenu();
      };
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }, [menuOpen]);

    const filtered = OFFER_VARIABLES.filter((v) => {
      if (!query) return true;
      const label = language === "no" ? v.labelNo : v.labelEn;
      return v.key.toLowerCase().includes(query) || label.toLowerCase().includes(query);
    });

    const sharedProps = {
      id,
      ref: inputRef as any,
      value,
      onChange: handleChange,
      placeholder,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (menuOpen && e.key === "Escape") {
          e.preventDefault();
          closeMenu();
        }
        if (menuOpen && e.key === "Enter" && filtered[0]) {
          e.preventDefault();
          insertVariable(filtered[0].key);
        }
      },
      className: "font-mono text-[13px]",
    };

    return (
      <div className="relative">
        {singleLine ? <Input {...sharedProps} /> : <Textarea {...sharedProps} rows={rows} />}
        {menuOpen && filtered.length > 0 && (
          <div
            data-variable-menu
            className="fixed z-50 w-72 rounded-md border border-border bg-popover shadow-lg overflow-hidden"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
              {language === "no" ? "Sett inn variabel" : "Insert variable"}
            </div>
            <div className="max-h-64 overflow-auto py-1">
              {filtered.map((v) => (
                <button
                  type="button"
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="w-full text-left px-3 py-1.5 hover:bg-accent text-sm flex items-center justify-between gap-2"
                >
                  <span>{language === "no" ? v.labelNo : v.labelEn}</span>
                  <code className="text-[11px] text-muted-foreground">{`{{${v.key}}}`}</code>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

VariableTextarea.displayName = "VariableTextarea";
