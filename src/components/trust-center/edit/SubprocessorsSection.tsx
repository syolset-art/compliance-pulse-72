import { useMemo } from "react";
import { Users, Sparkles, Trash2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getSubprocessorCountry,
  type AnalyzedSubprocessor,
  type SubprocessorListData,
} from "@/lib/demoSubprocessorAnalysis";
import { AddSubprocessorCombobox } from "./AddSubprocessorCombobox";

interface Props {
  asset: { id: string; metadata?: any } | null | undefined;
}

function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function SubprocessorsSection({ asset }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const meta = (asset?.metadata || {}) as Record<string, any>;
  const list = (meta.subprocessors as SubprocessorListData | undefined) ?? null;
  const vendors: AnalyzedSubprocessor[] = useMemo(() => list?.vendors ?? [], [list]);

  const persist = async (next: AnalyzedSubprocessor[]) => {
    if (!asset?.id) return;
    const nextList: SubprocessorListData = {
      source: list?.source ?? "manual",
      fileName: list?.fileName,
      url: list?.url,
      analyzedAt: new Date().toISOString(),
      vendors: next,
    };
    const currentMeta = (asset?.metadata || {}) as Record<string, any>;
    const nextMeta = { ...currentMeta, subprocessors: nextList, last_edited_at: new Date().toISOString() };
    const { error } = await supabase.from("assets").update({ metadata: nextMeta as any }).eq("id", asset.id);
    if (error) {
      toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["self-asset-edit"] });
    queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
  };

  const handleAdd = async (vendor: AnalyzedSubprocessor) => {
    const exists = vendors.some((v) => v.name.toLowerCase() === vendor.name.toLowerCase());
    if (exists) {
      toast.info(isNb ? "Leverandøren er allerede lagt til" : "Vendor is already added");
      return;
    }
    await persist([...vendors, vendor]);
    toast.success(
      vendor.source === "matched"
        ? (isNb ? `${vendor.name} lagt til med data fra Lara` : `${vendor.name} added with Lara data`)
        : (isNb ? `${vendor.name} lagt til` : `${vendor.name} added`)
    );
  };

  const handleRemove = async (name: string) => {
    await persist(vendors.filter((v) => v.name !== name));
  };

  return (
    <section id="subprocessors" className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">
          {isNb ? "Tredjepartsleverandører" : "Subprocessors"}
        </h2>
        <Badge variant="secondary" className="text-sm ml-auto">
          {vendors.length}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {isNb
          ? "Legg til underleverandører som behandler data på vegne av virksomheten din. De vises i Trust-profilen og styrker tilliten hos kunder."
          : "Add subprocessors that handle data on behalf of your company. They will appear on your Trust Profile and strengthen customer trust."}
      </p>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {isNb
              ? "Søk — Lara fyller automatisk inn land og formål når vi har data."
              : "Search — Lara auto-fills country and purpose when we have data."}
          </div>
          <AddSubprocessorCombobox
            existingNames={vendors.map((v) => v.name)}
            onAdd={handleAdd}
            isNb={isNb}
          />
        </div>

        {vendors.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {isNb
              ? "Ingen leverandører lagt til ennå."
              : "No subprocessors added yet."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {vendors.map((v) => {
              const country = getSubprocessorCountry(v.country);
              const description = v.category && v.category !== "Ukjent" ? v.category : null;
              return (
                <li key={v.name} className="flex items-start gap-4 px-4 py-3 hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{v.name}</div>
                    {description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground w-32 pt-0.5">
                    {country ? (
                      <span>{country.name}</span>
                    ) : (
                      <span>{isNb ? "Land ukjent" : "Country unknown"}</span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(v.name)}
                    aria-label={isNb ? "Fjern" : "Remove"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}
