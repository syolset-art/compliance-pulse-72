import { Checkbox } from "@/components/ui/checkbox";

interface TermsAcceptRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  version?: string | null;
  disabled?: boolean;
  id?: string;
}

/**
 * Compact one-line terms consent row: checkbox + link to the single
 * combined terms document. Reused across activation and purchase flows.
 */
export function TermsAcceptRow({
  checked,
  onCheckedChange,
  version,
  disabled,
  id = "terms-accept",
}: TermsAcceptRowProps) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <label htmlFor={id} className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
        Jeg godtar{" "}
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-2 hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          vilkår og betingelser
        </a>
        {version ? ` (versjon ${version})` : ""}
      </label>
    </div>
  );
}
