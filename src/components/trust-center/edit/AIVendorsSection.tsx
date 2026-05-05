import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus, X } from "lucide-react";
import { useAssetMetadata } from "./useAssetMetadata";

interface SubProcessor {
  name: string;
  purpose: string;
  location: string;
}

export function AIVendorsSection({ asset }: { asset: any }) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const av = meta.ai_vendors || {};
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  const subs: SubProcessor[] = av.sub_processors || [];
  const [draft, setDraft] = useState<SubProcessor>({ name: "", purpose: "", location: "" });

  const addSub = () => {
    if (!draft.name.trim()) return;
    updatePath(["ai_vendors", "sub_processors"], [...subs, draft], { silent: true });
    setDraft({ name: "", purpose: "", location: "" });
  };
  const removeSub = (i: number) => {
    updatePath(["ai_vendors", "sub_processors"], subs.filter((_, idx) => idx !== i), { silent: true });
  };

  return (
    <section id="ai-vendors" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">AI og leverandørstyring</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Hvordan dere bruker AI og hvordan dere vurderer underleverandører.
      </p>

      <Card className="p-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">AI-bruk</label>
          <p className="text-[13px] text-muted-foreground">Hvilke AI-systemer brukes, til hvilke formål.</p>
          <Textarea
            defaultValue={av.ai_usage || ""}
            placeholder="F.eks. OpenAI for kundestøtte, intern bruk av Lovable AI..."
            className="text-sm min-h-[80px]"
            onBlur={(e) => updatePath(["ai_vendors", "ai_usage"], e.target.value, { silent: true })}
          />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Leverandørrisikostyring</label>
          <p className="text-[13px] text-muted-foreground">Prosess og kriterier for å vurdere tredjeparter.</p>
          <Textarea
            defaultValue={av.vendor_risk || ""}
            placeholder="Beskriv hvordan dere vurderer og følger opp leverandører..."
            className="text-sm min-h-[80px]"
            onBlur={(e) => updatePath(["ai_vendors", "vendor_risk"], e.target.value, { silent: true })}
          />
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-xs font-medium text-foreground">Underleverandører (sub-prosessorer)</label>
          <p className="text-[13px] text-muted-foreground">Tredjeparter som behandler data på vegne av dere.</p>

          {subs.length > 0 && (
            <div className="space-y-1.5">
              {subs.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border border-border p-2.5 bg-muted/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[s.purpose, s.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSub(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Navn (f.eks. AWS)"
              className="text-sm"
            />
            <Input
              value={draft.purpose}
              onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
              placeholder="Formål"
              className="text-sm"
            />
            <Input
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="Lokasjon (f.eks. EU)"
              className="text-sm"
            />
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={addSub} disabled={!draft.name.trim()}>
            <Plus className="h-3 w-3" /> Legg til underleverandør
          </Button>
        </div>
      </Card>
    </section>
  );
}
