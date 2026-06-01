import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Search, ArrowUpDown, ExternalLink, Mail, ShieldCheck, FileText } from "lucide-react";
import type { SubprocessorListData, AnalyzedSubprocessor } from "@/lib/demoSubprocessorAnalysis";

type SortKey = "name" | "category" | "tp" | "dpa" | "country";

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 75
      ? "bg-success/15 text-success border-success/30"
      : score >= 50
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-destructive/15 text-destructive border-destructive/30";
  return (
    <Badge variant="outline" className={`gap-1 ${cls}`}>
      <ShieldCheck className="h-3 w-3" />
      TP {score}
    </Badge>
  );
}

function dpaLabel(t: AnalyzedSubprocessor["dpaType"]) {
  if (t === "standard") return "Standard DPA";
  if (t === "individual") return "Individuell DPA";
  if (t === "none") return "Ikke aktuelt";
  return "Ukjent";
}

interface Props {
  data?: SubprocessorListData | null;
  isNb?: boolean;
  onReanalyze?: () => void;
  onAddList?: () => void;
}

export function SubprocessorTable({ data, isNb = true, onReanalyze, onAddList }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "tp" | "noTp" | "standard">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "tp", dir: "desc" });

  const rows = useMemo(() => {
    const all = data?.vendors ?? [];
    let r = all.filter((v) => v.name.toLowerCase().includes(query.toLowerCase()));
    if (filter === "tp") r = r.filter((v) => v.hasTrustProfile);
    if (filter === "noTp") r = r.filter((v) => !v.hasTrustProfile);
    if (filter === "standard") r = r.filter((v) => v.dpaType === "standard");
    const dir = sort.dir === "asc" ? 1 : -1;
    r = [...r].sort((a, b) => {
      const get = (v: AnalyzedSubprocessor) => {
        switch (sort.key) {
          case "name": return v.name.toLowerCase();
          case "category": return v.category.toLowerCase();
          case "tp": return v.trustProfileScore ?? -1;
          case "dpa": return v.dpaType;
          case "country": return v.country ?? "zz";
        }
      };
      const av = get(a) as any, bv = get(b) as any;
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return r;
  }, [data, query, filter, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  // Empty state — no list uploaded
  if (!data || !data.vendors || data.vendors.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Underleverandører" : "Subprocessors"}
          </h3>
        </div>
        <div className="px-5 pb-5 pt-1 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground">
            {isNb
              ? "Last opp en samlet liste over underleverandører eller lim inn lenken til en offentlig oversikt. Lara analyserer listen og kobler hver leverandør mot Mynder-katalogen."
              : "Upload a list of subprocessors or paste a public URL. Lara analyses the list and matches each vendor against the Mynder catalogue."}
          </p>
          {onAddList && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onAddList}>
              <FileText className="h-3.5 w-3.5" />
              {isNb ? "Legg til leverandørliste" : "Add subprocessor list"}
            </Button>
          )}
        </div>
      </section>
    );
  }

  const tpCount = data.vendors.filter((v) => v.hasTrustProfile).length;
  const analyzedDate = data.analyzedAt
    ? new Date(data.analyzedAt).toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Underleverandører" : "Subprocessors"}
          </h3>
          <Badge variant="secondary" className="text-[11px] font-normal">
            {data.vendors.length} {isNb ? "totalt" : "total"} · {tpCount} {isNb ? "med Trust Profile" : "with Trust Profile"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          {analyzedDate && (
            <span>
              {isNb ? "Sist analysert" : "Last analysed"} {analyzedDate}
              {data.source === "upload" && data.fileName && ` · ${data.fileName}`}
              {data.source === "url" && data.url && (
                <a
                  href={data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  {isNb ? "kilde" : "source"} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
          )}
          {onReanalyze && (
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onReanalyze}>
              <Sparkles className="h-3 w-3" />
              {isNb ? "Analyser på nytt" : "Re-analyse"}
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 pb-3 pt-1 border-t border-border flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isNb ? "Søk leverandør…" : "Search vendor…"}
            className="h-8 pl-7 text-xs"
          />
        </div>
        {([
          { id: "all", label: isNb ? "Alle" : "All" },
          { id: "tp", label: isNb ? "Har TP" : "Has TP" },
          { id: "noTp", label: isNb ? "Mangler TP" : "Missing TP" },
          { id: "standard", label: isNb ? "Standard DPA" : "Standard DPA" },
        ] as const).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
              filter === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border-t border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[12px] uppercase tracking-wider text-muted-foreground">
            <tr>
              {([
                { key: "name", label: isNb ? "Leverandør" : "Vendor" },
                { key: "category", label: isNb ? "Kategori" : "Category" },
                { key: "tp", label: "Trust Profile" },
                { key: "dpa", label: "DPA" },
                { key: "country", label: isNb ? "Land" : "Country" },
              ] as { key: SortKey; label: string }[]).map((col) => (
                <th key={col.key} className="px-4 py-2 text-left font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {col.label} <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((v, i) => (
              <tr key={`${v.name}-${i}`} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium text-foreground">{v.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.category}</td>
                <td className="px-4 py-2.5">
                  {v.hasTrustProfile && v.trustProfileScore != null ? (
                    <ScoreBadge score={v.trustProfileScore} />
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-dashed">
                      {isNb ? "Ikke i Mynder" : "Not in Mynder"}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{dpaLabel(v.dpaType)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{v.country ?? "—"}</span>
                    {!v.hasTrustProfile && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-primary"
                      >
                        <Mail className="h-3 w-3" />
                        {isNb ? "Inviter" : "Invite"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                  {isNb ? "Ingen treff." : "No matches."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
