import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  Search,
  CheckCircle2,
  ShieldCheck,
  SlidersHorizontal,
  ExternalLink,
  FileText,
  Loader2,
  Info,
} from "lucide-react";
import { useDocumentHub } from "@/hooks/useDocumentHub";
import {
  MODULE_LABELS,
  STATUS_LABELS,
  TYPE_GROUP_LABELS,
  documentTypeLabel,
  formatFileSize,
  typeGroup,
  type HubDocument,
  type HubModule,
  type HubTypeGroup,
} from "@/lib/documentHub";



export default function DocumentHub() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);

  const { documents, scoreDocIds, activeFrameworkCount, frameworksForDoc, requirementsForDoc, isLoading } =
    useDocumentHub();

  const [search, setSearch] = useState("");
  const [modules, setModules] = useState<HubModule[]>([]);
  const [types, setTypes] = useState<HubTypeGroup[]>([]);
  const [uploader, setUploader] = useState<string | null>(null);
  const [onlyScore, setOnlyScore] = useState(false);
  const [selected, setSelected] = useState<HubDocument | null>(null);


  const toggle = <T,>(list: T[], set: (v: T[]) => void, value: T) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const uploaders = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => d.uploadedBy && set.add(d.uploadedBy));
    return [...set];
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (q && !`${d.name} ${d.fileName ?? ""} ${d.contextLabel ?? ""}`.toLowerCase().includes(q)) return false;
      if (modules.length && !modules.includes(d.module)) return false;
      if (types.length && !types.includes(typeGroup(d.documentType))) return false;
      if (uploader && d.uploadedBy !== uploader) return false;
      if (onlyScore && !scoreDocIds.has(d.id)) return false;
      return true;
    });
  }, [documents, search, modules, types, uploader, onlyScore, scoreDocIds]);

  const stats = useMemo(() => {
    const affectsScore = documents.filter((d) => scoreDocIds.has(d.id)).length;
    const attention = documents.filter((d) => d.status === "expired" || d.status === "expiring").length;
    const incomplete = documents.filter((d) => !d.uploadedBy || d.documentType === "other").length;
    return { total: documents.length, affectsScore, attention, incomplete };
  }, [documents, scoreDocIds]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [filtered]);


  const activeFilters =
    modules.length + types.length + (uploader ? 1 : 0) + (onlyScore ? 1 : 0);

  const pill = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-[13px] transition-colors",
      active
        ? "border-primary/40 bg-primary/10 text-primary font-medium"
        : "border-border text-muted-foreground hover:bg-muted/60",
    );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-20">
        <div className="container max-w-5xl mx-auto space-y-5">
          <header className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{L("Dokument hub", "Document hub")}</h1>
              <span className="text-sm font-medium text-muted-foreground">
                {stats.total} {L("dokumenter", "documents")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {L(
                "Alle dokumenter dere har lastet opp – samlet på tvers av moduler.",
                "Every document you have uploaded – collected across modules.",
              )}
            </p>
          </header>


          {/* Filterlinje */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={L("Søk i dokumenter…", "Search documents…")}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              <button className={pill(!onlyScore && activeFilters === 0)} onClick={() => {
                setModules([]); setTypes([]); setUploader(null); setOnlyScore(false);
              }}>
                {L("Alle", "All")}
              </button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className={pill(onlyScore)} onClick={() => setOnlyScore(!onlyScore)}>
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {L("Påvirker score", "Affects score")}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-[13px]">
                    {L(
                      "Viser kun dokumenter som er koblet som bevis til et krav i regelverk dere har aktivert.",
                      "Shows only documents linked as evidence to a requirement in your activated regulations.",
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {L("Filtre", "Filters")}
                    {activeFilters > 0 && (
                      <Badge className="ml-1 h-5 px-1.5 bg-primary/15 text-primary border-0">{activeFilters}</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 space-y-4">
                  <FilterGroup title={L("Modul", "Module")}>
                    {(Object.keys(MODULE_LABELS) as HubModule[]).map((m) => (
                      <button key={m} className={pill(modules.includes(m))} onClick={() => toggle(modules, setModules, m)}>
                        {MODULE_LABELS[m][isNb ? "nb" : "en"]}
                      </button>
                    ))}
                  </FilterGroup>
                  <FilterGroup title={L("Dokumenttype", "Document type")}>
                    {(Object.keys(TYPE_GROUP_LABELS) as HubTypeGroup[]).map((t) => (
                      <button key={t} className={pill(types.includes(t))} onClick={() => toggle(types, setTypes, t)}>
                        {TYPE_GROUP_LABELS[t][isNb ? "nb" : "en"]}
                      </button>
                    ))}
                  </FilterGroup>
                  {uploaders.length > 0 && (
                    <FilterGroup title={L("Lastet opp av", "Uploaded by")}>
                      {uploaders.map((u) => (
                        <button key={u} className={pill(uploader === u)} onClick={() => setUploader(uploader === u ? null : u)}>
                          {u}
                        </button>
                      ))}
                    </FilterGroup>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tabell */}

          {isLoading ? (
            <div className="flex items-center gap-2 py-16 justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {L("Henter dokumenter…", "Loading documents…")}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-1">
                <FolderOpen className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {documents.length === 0
                    ? L("Ingen dokumenter er lastet opp ennå.", "No documents uploaded yet.")
                    : L("Ingen dokumenter matcher filtrene.", "No documents match the filters.")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>{L("Dokument", "Document")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{L("Type", "Type")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {L("Modul", "Module")}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-[13px]">
                              {L(
                                "Viser hvilket Mynder-produkt eller -modul dokumentet tilhører.",
                                "Shows which Mynder product or module the document belongs to.",
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">{L("Lastet opp av", "Uploaded by")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{L("Dato", "Date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((doc) => (
                    <TableRow
                      key={doc.id}
                      onClick={() => setSelected(doc)}
                      className="cursor-pointer"
                    >
                      <TableCell className="py-2">
                        {scoreDocIds.has(doc.id) ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="font-medium text-sm text-foreground max-w-[200px] sm:max-w-xs truncate">
                          {doc.name}
                        </div>
                        {doc.contextLabel && (
                          <div className="text-[12px] text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                            {doc.contextLabel}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-2 text-[13px] text-muted-foreground">
                        {documentTypeLabel(doc.documentType, isNb)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2">
                        <Badge variant="outline" className="text-[12px] font-normal">
                          {MODULE_LABELS[doc.module][isNb ? "nb" : "en"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-[13px] text-muted-foreground">
                        {doc.uploadedBy || L("Ukjent", "Unknown")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-[13px] text-muted-foreground">
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString(isNb ? "nb-NO" : "en-GB")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <dl className="space-y-2">
                  <Row label={L("Type", "Type")} value={documentTypeLabel(selected.documentType, isNb)} />
                  <Row label={L("Modul", "Module")} value={MODULE_LABELS[selected.module][isNb ? "nb" : "en"]} />
                  {selected.contextLabel && <Row label={L("Kontekst", "Context")} value={selected.contextLabel} />}
                  <Row label={L("Status", "Status")} value={STATUS_LABELS[selected.status][isNb ? "nb" : "en"]} />
                  <Row label={L("Lastet opp av", "Uploaded by")} value={selected.uploadedBy || L("Ukjent", "Unknown")} />
                  {selected.createdAt && (
                    <Row
                      label={L("Dato", "Date")}
                      value={new Date(selected.createdAt).toLocaleDateString(isNb ? "nb-NO" : "en-GB")}
                    />
                  )}
                  {selected.validTo && (
                    <Row
                      label={L("Gyldig til", "Valid until")}
                      value={new Date(selected.validTo).toLocaleDateString(isNb ? "nb-NO" : "en-GB")}
                    />
                  )}
                  {selected.fileName && <Row label={L("Fil", "File")} value={selected.fileName} />}
                  {formatFileSize(selected.fileSize) && (
                    <Row label={L("Størrelse", "Size")} value={formatFileSize(selected.fileSize)!} />
                  )}
                </dl>

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className={cn("h-4 w-4", scoreDocIds.has(selected.id) ? "text-success" : "text-muted-foreground")}
                    />
                    <span className="font-medium">
                      {scoreDocIds.has(selected.id)
                        ? L("Påvirker score", "Affects score")
                        : L("Påvirker ikke score", "Does not affect score")}
                    </span>
                  </div>
                  {scoreDocIds.has(selected.id) ? (
                    <div className="space-y-1.5 text-[13px] text-muted-foreground">
                      <p>{L("Regelverk:", "Regulations:")} {frameworksForDoc(selected.id).join(", ") || "—"}</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {requirementsForDoc(selected.id).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">
                      {L(
                        "Dokumentet er ikke koblet til et dokumentkrav i de aktiverte regelverkene.",
                        "This document is not linked to a documentation requirement in your activated regulations.",
                      )}
                    </p>
                  )}
                </div>

                {selected.sourceRoute && (
                  <Button asChild variant="outline" className="w-full gap-2">
                    <Link to={selected.sourceRoute}>
                      <ExternalLink className="h-4 w-4" />
                      {L("Åpne der dokumentet ligger", "Open where the document lives")}
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}




function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground text-[13px]">{label}</dt>
      <dd className="text-[13px] text-foreground text-right break-words">{value}</dd>
    </div>
  );
}
