import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Scale, BookOpen, Shield, Info, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { frameworks as allFrameworkDefs, type Framework } from "@/lib/frameworkDefinitions";
import {
  useVendorFrameworkScope,
  VENDOR_FRAMEWORK_SCOPE_KEY,
} from "@/hooks/useVendorFrameworkScope";

export const VENDOR_SCOPE_INTRO_KEY = "vendor-framework-scope-intro";
export const VENDOR_SCOPE_INTRO_EVENT = "vendor-framework-scope-intro-show";

type GroupKey = "regulation" | "standard" | "guidance";

const GROUPS: { key: GroupKey; icon: typeof Scale; nb: string; en: string; types: Framework["type"][] }[] = [
  { key: "regulation", icon: Scale, nb: "Regelverk", en: "Regulations", types: ["regulation"] },
  { key: "standard", icon: Shield, nb: "Standarder", en: "Standards", types: ["standard"] },
  { key: "guidance", icon: BookOpen, nb: "Retningslinjer og rammeverk", en: "Guidelines and frameworks", types: ["guideline", "framework"] },
];

export function VendorFrameworkScopeTab() {
  const { i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") || i18n.language?.startsWith("no");
  const queryClient = useQueryClient();
  const { scopeIds, isLoading } = useVendorFrameworkScope();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialised, setInitialised] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showIntro, setShowIntro] = useState(
    () => localStorage.getItem(VENDOR_SCOPE_INTRO_KEY) !== "dismissed",
  );

  useEffect(() => {
    const handler = () => setShowIntro(true);
    window.addEventListener(VENDOR_SCOPE_INTRO_EVENT, handler);
    return () => window.removeEventListener(VENDOR_SCOPE_INTRO_EVENT, handler);
  }, []);

  const dismissIntro = () => {
    localStorage.setItem(VENDOR_SCOPE_INTRO_KEY, "dismissed");
    setShowIntro(false);
  };

  useEffect(() => {
    if (!isLoading && !initialised) {
      setSelected(new Set(scopeIds));
      setInitialised(true);
    }
  }, [isLoading, initialised, scopeIds]);

  const grouped = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        items: allFrameworkDefs.filter((f) => g.types.includes(f.type)),
      })).filter((g) => g.items.length > 0),
    []
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rows = allFrameworkDefs.map((f) => ({
        framework_id: f.id,
        framework_name: f.name,
        is_enabled: selected.has(f.id),
      }));

      const { error } = await supabase
        .from("vendor_framework_scope")
        .upsert(rows, { onConflict: "framework_id" });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: VENDOR_FRAMEWORK_SCOPE_KEY });
      toast.success(
        isNb ? "Regelverk for leverandørstyring er lagret" : "Vendor management frameworks saved",
        {
          description: isNb
            ? `${selected.size} regelverk gjelder nå for alle leverandører.`
            : `${selected.size} frameworks now apply to all vendors.`,
        }
      );
    } catch (e) {
      toast.error(isNb ? "Kunne ikke lagre valget" : "Could not save selection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {showIntro && (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {isNb
                ? "Velg hvilke regelverk som gjelder for leverandørstyring"
                : "Choose which frameworks apply to vendor management"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isNb
                ? "Valget gjelder alle leverandører, og styrer hvilke krav og modenhetsvisninger som vises på leverandørprofilene. Regelverk i leverandørmodulen er inkludert i modulprisen."
                : "The selection applies to all vendors and controls which requirements and maturity views appear on vendor profiles. Frameworks in the vendor module are included in the module price."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={dismissIntro}
            aria-label={isNb ? "Skjul forklaringen" : "Dismiss explanation"}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      )}

      {grouped.map((group) => {
        const Icon = group.icon;
        return (
          <Card key={group.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {isNb ? group.nb : group.en}
                <span className="text-xs font-normal text-muted-foreground">
                  ({group.items.filter((f) => selected.has(f.id)).length}/{group.items.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {group.items.map((f, idx) => (
                <div key={f.id}>
                  {idx > 0 && <Separator />}
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{f.name}</span>
                        {f.isMandatory && (
                          <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                            {isNb ? "Obligatorisk" : "Mandatory"}
                          </Badge>
                        )}
                        {!f.isMandatory && f.isRecommended && (
                          <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                            {isNb ? "Anbefalt" : "Recommended"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.description}</p>
                    </div>
                    <Switch
                      checked={selected.has(f.id)}
                      onCheckedChange={() => toggle(f.id)}
                      aria-label={f.name}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-lg border bg-card/95 backdrop-blur px-4 py-3 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {isNb
            ? `${selected.size} regelverk i scope for leverandørstyring`
            : `${selected.size} frameworks in scope for vendor management`}
        </p>
        <Button onClick={handleSave} disabled={saving || isLoading}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isNb ? "Lagre" : "Save"}
        </Button>
      </div>
    </div>
  );
}
