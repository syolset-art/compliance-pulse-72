import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe, Sparkles, Plus, Check, X, RotateCcw, Trash2, ExternalLink, Loader2, Info,
} from "lucide-react";
import { useTrustProfileSources, type TrustProfileSource } from "@/hooks/useTrustProfileSources";

interface SourcesPanelProps {
  assetId: string;
  controlArea: string;
  assetWebsite?: string | null;
}

export function SourcesPanel({ assetId, controlArea, assetWebsite }: SourcesPanelProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { data: sources = [], isLoading, setStatus, addManual, remove, discover } =
    useTrustProfileSources(assetId, controlArea);

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newSnippet, setNewSnippet] = useState("");

  const active = sources.filter((s) => s.status !== "rejected");
  const rejected = sources.filter((s) => s.status === "rejected");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addManual.mutate(
      { title: newTitle.trim(), url: newUrl.trim() || undefined, snippet: newSnippet.trim() || undefined, area: controlArea },
      {
        onSuccess: () => {
          setNewTitle(""); setNewUrl(""); setNewSnippet(""); setShowAdd(false);
        },
      }
    );
  };

  const statusBadge = (s: TrustProfileSource) => {
    const map: Record<string, { label: [string, string]; cls: string }> = {
      suggested: { label: ["Foreslått av Lara", "Suggested by Lara"], cls: "bg-primary/10 text-primary border-primary/20" },
      accepted:  { label: ["Akseptert", "Accepted"], cls: "bg-status-closed/10 text-status-closed border-status-closed/20" },
      manual:    { label: ["Lagt til av deg", "Added by you"], cls: "bg-muted text-foreground border-border" },
      rejected:  { label: ["Forkastet", "Rejected"], cls: "bg-muted/60 text-muted-foreground border-border" },
    };
    const m = map[s.status];
    return <Badge variant="outline" className={`text-[11px] ${m.cls}`}>{isNb ? m.label[0] : m.label[1]}</Badge>;
  };

  return (
    <div className="mt-3 pt-3 border-t border-border animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {isNb ? "Kilder" : "Sources"}
          </p>
          <Badge variant="secondary" className="text-[11px]">
            {active.length} {isNb ? "aktive" : "active"}
            {rejected.length > 0 && ` · ${rejected.length} ${isNb ? "forkastet" : "rejected"}`}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1"
            onClick={() => discover.mutate()}
            disabled={discover.isPending}
          >
            {discover.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {isNb ? "Be Lara analysere" : "Run Lara analysis"}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="h-3 w-3" />
            {isNb ? "Legg til kilde" : "Add source"}
          </Button>
        </div>
      </div>

      {/* Explainer */}
      <div className="mb-2 p-2.5 rounded-md bg-muted/40 border border-border flex gap-2 text-[11px] text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
        <p>
          {isNb
            ? "Kilder er informasjon Lara har funnet om dette området — typisk fra leverandørens nettsider, personvernerklæring eller åpenhetsrapport. Du kan akseptere, forkaste eller legge til egne. Verifisert dokumentasjon (under) gir høyere modenhet enn kilder alene."
            : "Sources are information Lara has found for this area — typically from the vendor's website, privacy policy or transparency report. You can accept, reject or add your own. Verified documentation (below) carries more weight than sources alone."}
        </p>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-3 p-3 rounded-md border border-border bg-background space-y-2 animate-fade-in">
          <Input
            placeholder={isNb ? "Tittel (f.eks. «Personvernerklæring»)" : "Title (e.g. 'Privacy policy')"}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder={isNb ? "URL (valgfritt)" : "URL (optional)"}
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="h-8 text-xs"
          />
          <Textarea
            placeholder={isNb ? "Kort begrunnelse (valgfritt)" : "Short note (optional)"}
            value={newSnippet}
            onChange={(e) => setNewSnippet(e.target.value)}
            className="min-h-[50px] text-xs"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowAdd(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={!newTitle.trim() || addManual.isPending}>
              {isNb ? "Lagre" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : sources.length === 0 ? (
        <div className="p-4 rounded-md border border-dashed border-border text-center">
          <p className="text-xs text-muted-foreground mb-2">
            {isNb ? "Ingen kilder kartlagt ennå." : "No sources mapped yet."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1"
            onClick={() => discover.mutate()}
            disabled={discover.isPending}
          >
            {discover.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {isNb ? "La Lara finne kilder fra nettsiden" : "Let Lara discover web sources"}
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sources.map((s) => (
            <div
              key={s.id}
              className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs ${
                s.status === "rejected" ? "border-border bg-muted/30 opacity-60" : "border-border bg-background"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground truncate">{s.title}</span>
                  {statusBadge(s)}
                </div>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline truncate"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    {s.url}
                  </a>
                )}
                {s.snippet && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{s.snippet}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {s.status === "suggested" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title={isNb ? "Aksepter" : "Accept"}
                      onClick={() => setStatus.mutate({ id: s.id, status: "accepted" })}
                    >
                      <Check className="h-3 w-3 text-status-closed" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title={isNb ? "Forkast" : "Reject"}
                      onClick={() => setStatus.mutate({ id: s.id, status: "rejected" })}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </>
                )}
                {s.status === "accepted" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title={isNb ? "Forkast" : "Reject"}
                    onClick={() => setStatus.mutate({ id: s.id, status: "rejected" })}
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                )}
                {s.status === "rejected" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title={isNb ? "Gjenopprett" : "Restore"}
                    onClick={() => setStatus.mutate({ id: s.id, status: s.discovered_by === "user" ? "manual" : "accepted" })}
                  >
                    <RotateCcw className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
                {(s.discovered_by === "user" || s.status === "manual") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title={isNb ? "Slett" : "Delete"}
                    onClick={() => remove.mutate(s.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
