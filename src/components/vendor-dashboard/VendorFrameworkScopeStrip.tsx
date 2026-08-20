import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVendorFrameworkScope } from "@/hooks/useVendorFrameworkScope";
import { getFrameworkById } from "@/lib/frameworkDefinitions";

/** Subtle strip showing the global framework scope all vendors are managed against. */
export function VendorFrameworkScopeStrip() {
  const { i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") || i18n.language?.startsWith("no");
  const [searchParams, setSearchParams] = useSearchParams();
  const { scopeIds } = useVendorFrameworkScope();

  if (scopeIds.length === 0) return null;

  const visible = scopeIds.slice(0, 6);
  const rest = scopeIds.length - visible.length;

  return (
    <div className="flex items-center gap-2 flex-wrap rounded-lg border bg-muted/30 px-3 py-2">
      <Scale className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {isNb ? "Regelverk i scope:" : "Frameworks in scope:"}
      </span>
      {visible.map((id) => (
        <Badge key={id} variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
          {getFrameworkById(id)?.name || id}
        </Badge>
      ))}
      {rest > 0 && <span className="text-xs text-muted-foreground">+{rest}</span>}
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 ml-auto text-xs"
        onClick={() => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", "frameworks");
          setSearchParams(next, { replace: true });
        }}
      >
        {isNb ? "Endre" : "Change"}
      </Button>
    </div>
  );
}
