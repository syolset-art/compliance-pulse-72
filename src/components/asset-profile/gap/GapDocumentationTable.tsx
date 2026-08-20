import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Upload, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveDocOrigin, docOriginLabel } from "@/lib/vendorDocumentSource";

export interface GapDocRow {
  requirement_id: string;
  name: string;
  status: "implemented" | "partial" | "missing" | "not_relevant";
  evidence?: string[];
  signal_key?: string;
}

interface GapDocumentationTableProps {
  rows: GapDocRow[];
  onRequestDocs?: (row: GapDocRow) => void;
  onUpload?: (row: GapDocRow) => void;
}

type DocFilter = "all" | "has" | "missing";

export function GapDocumentationTable({ rows, onRequestDocs, onUpload }: GapDocumentationTableProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [filter, setFilter] = useState<DocFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const has = rows.filter((r) => (r.evidence?.length ?? 0) > 0).length;
    return { all: rows.length, has, missing: rows.length - has };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const hasDocs = (r.evidence?.length ?? 0) > 0;
      if (filter === "has" && !hasDocs) return false;
      if (filter === "missing" && hasDocs) return false;
      if (q && !`${r.requirement_id} ${r.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filter, search]);

  const statusMeta = (status: GapDocRow["status"]) => {
    if (status === "implemented") return { label: isNb ? "Oppfylt" : "Met", cls: "text-success border-success/30 bg-success/5" };
    if (status === "partial") return { label: isNb ? "Delvis" : "Partial", cls: "text-warning border-warning/30 bg-warning/5" };
    if (status === "not_relevant") return { label: isNb ? "Ikke relevant" : "Not relevant", cls: "text-muted-foreground border-border bg-muted/30" };
    return { label: isNb ? "Mangler" : "Missing", cls: "text-destructive border-destructive/30 bg-destructive/5" };
  };

  const pills: { key: DocFilter; label: string; count: number }[] = [
    { key: "all", label: isNb ? "Alle" : "All", count: counts.all },
    { key: "has", label: isNb ? "Har dokumentasjon" : "Has documentation", count: counts.has },
    { key: "missing", label: isNb ? "Mangler dokumentasjon" : "Missing documentation", count: counts.missing },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {pills.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
              filter === p.key
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:bg-muted/50",
            )}
          >
            {p.label} <span className="tabular-nums opacity-70">{p.count}</span>
          </button>
        ))}
        <div className="relative ml-auto min-w-[180px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-8"
            placeholder={isNb ? "Søk i krav..." : "Search requirements..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isNb ? "Krav" : "Requirement"}</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>{isNb ? "Dokumentasjon" : "Documentation"}</TableHead>
                <TableHead className="w-[130px]">{isNb ? "Opprinnelse" : "Origin"}</TableHead>
                <TableHead className="w-[190px] text-right">{isNb ? "Handling" : "Action"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                    {isNb ? "Ingen krav matcher filteret" : "No requirements match the filter"}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => {
                const docs = r.evidence ?? [];
                const hasDocs = docs.length > 0;
                const meta = statusMeta(r.status);
                const origin = resolveDocOrigin(r.signal_key);
                return (
                  <TableRow key={r.requirement_id}>
                    <TableCell className="align-top">
                      <div className="text-sm font-medium leading-snug">{r.name}</div>
                      <div className="text-[12px] font-mono text-muted-foreground mt-0.5">{r.requirement_id}</div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant="outline" className={cn("h-5 px-1.5 text-[12px]", meta.cls)}>
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      {hasDocs ? (
                        <div className="space-y-1">
                          {docs.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-sm">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{d}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-destructive">{isNb ? "Mangler" : "Missing"}</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {hasDocs ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[12px]">
                          {docOriginLabel(origin, isNb)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onRequestDocs?.(r)}>
                          <Send className="h-3 w-3" />
                          {isNb ? "Be om" : "Request"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onUpload?.(r)}>
                          <Upload className="h-3 w-3" />
                          {isNb ? "Last opp" : "Upload"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
