import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Upload,
} from "lucide-react";
import { useDocumentHub } from "@/hooks/useDocumentHub";
import { UploadHubDocumentDialog } from "@/components/documents/UploadHubDocumentDialog";
import { DocumentActionButtons } from "@/components/agents/DocumentActionButtons";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuidingDocumentsTab } from "@/components/documents/GuidingDocumentsTab";
import { GoverningDocumentsTab } from "@/components/documents/GoverningDocumentsTab";
import {
  readDocGovernance,
  setDocGovernance,
  type DocGovernance,
} from "@/lib/documentGovernance";
import {
  DOC_CLASS_HELP,
  DOC_CLASS_LABELS,
  MODULE_LABELS,
  MODULE_ROUTES,
  STATUS_LABELS,
  TYPE_GROUP_LABELS,
  docClassFromType,
  documentTypeLabel,
  formatFileSize,
  typeGroup,
  type HubDocClass,
  type HubDocument,
  type HubModule,
  type HubTypeGroup,
} from "@/lib/documentHub";



export default function DocumentHub() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);
  const navigate = useNavigate();

  const {
    documents,
    scoreDocIds,
    activeFrameworks,
    frameworksForDoc,
    frameworkIdsForDoc,
    requirementsForDoc,
    isLoading,
  } = useDocumentHub();

  const [search, setSearch] = useState("");
  const [modules, setModules] = useState<HubModule[]>([]);
  const [types, setTypes] = useState<HubTypeGroup[]>([]);
  const [classes, setClasses] = useState<HubDocClass[]>([]);
  const [frameworkFilter, setFrameworkFilter] = useState<string[]>([]);
  const [uploader, setUploader] = useState<string | null>(null);
  const [onlyScore, setOnlyScore] = useState(false);
  const [onlyAttention, setOnlyAttention] = useState(false);
  const [selected, setSelected] = useState<HubDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preset, setPreset] = useState<{ name?: string; frameworkId?: string }>({});
  const [governance, setGovernance] = useState<Record<string, DocGovernance>>(() =>
    readDocGovernance(),
  );

  /** Klasse for et dokument: brukerens overstyring, ellers utledet fra typen. */
  const docClassOf = (doc: HubDocument): HubDocClass =>
    governance[doc.id]?.docClass ?? docClassFromType(doc.documentType);

  const updateGovernance = (docId: string, patch: DocGovernance) =>
    setGovernance(setDocGovernance(docId, patch));

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
      if (classes.length && !classes.includes(docClassOf(d))) return false;
      if (frameworkFilter.length) {
        const ids = frameworkIdsForDoc(d.id);
        if (!ids.some((id) => frameworkFilter.includes(id))) return false;
      }
      if (uploader && d.uploadedBy !== uploader) return false;
      if (onlyScore && !scoreDocIds.has(d.id)) return false;
      if (onlyAttention && d.status !== "expired" && d.status !== "expiring") return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    documents,
    search,
    modules,
    types,
    classes,
    frameworkFilter,
    uploader,
    onlyScore,
    onlyAttention,
    scoreDocIds,
    governance,
  ]);

  const stats = useMemo(() => {
    const affectsScore = documents.filter((d) => scoreDocIds.has(d.id)).length;
    const attention = documents.filter((d) => d.status === "expired" || d.status === "expiring").length;
    const governing = documents.filter((d) => docClassOf(d) === "governing").length;
    return { total: documents.length, affectsScore, attention, governing };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, scoreDocIds, governance]);

  const governingDocs = useMemo(
    () => documents.filter((d) => docClassOf(d) === "governing"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documents, governance],
  );

  const guidanceDocs = useMemo(
    () => documents.filter((d) => docClassOf(d) === "guidance"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documents, governance],
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [filtered]);


  const activeFilters =
    modules.length +
    types.length +
    classes.length +
    frameworkFilter.length +
    (uploader ? 1 : 0) +
    (onlyScore ? 1 : 0) +
    (onlyAttention ? 1 : 0);

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
              <FolderOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              <h1 className="text-2xl font-bold text-foreground">{L("Dokument hub", "Document hub")}</h1>
              <span className="text-sm font-medium text-muted-foreground">
                {stats.total} {L("dokumenter", "documents")}
              </span>
              <DocumentActionButtons
                className="ml-auto"
                uploadLabel={{ nb: "Last opp dokument", en: "Upload document" }}
                onUpload={() => {
                  setPreset({});
                  setUploadOpen(true);
                }}
              />

            </div>
            <p className="text-sm text-muted-foreground">
              {L(
                `${stats.total} dokumenter · ${stats.governing} styrende · ${stats.affectsScore} dekker aktiverte krav · ${stats.attention} krever oppfølging`,
                `${stats.total} documents · ${stats.governing} governing · ${stats.affectsScore} cover activated requirements · ${stats.attention} need attention`,
              )}
            </p>
          </header>

          <Tabs defaultValue="mine" className="space-y-5">
            <TabsList>
              <TabsTrigger value="mine">{L("Alle dokumenter", "All documents")}</TabsTrigger>
              <TabsTrigger value="governing">
                {L("Styrende dokumenter", "Governing documents")}
              </TabsTrigger>
              <TabsTrigger value="guiding">{L("Dokumentkrav", "Documentation requirements")}</TabsTrigger>
            </TabsList>

            <TabsContent value="governing" className="space-y-5">
              <GoverningDocumentsTab
                documents={governingDocs}
                governance={governance}
                onSelect={setSelected}
              />
            </TabsContent>

            <TabsContent value="guiding" className="space-y-5">
              <GuidingDocumentsTab
                frameworks={activeFrameworks}
                documents={documents}
                guidanceDocs={guidanceDocs}
                onUpload={({ name, frameworkId }) => {
                  setPreset({ name, frameworkId });
                  setUploadOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="mine" className="space-y-5">
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

              <button className={pill(activeFilters === 0)} onClick={() => {
                setModules([]); setTypes([]); setClasses([]); setFrameworkFilter([]);
                setUploader(null); setOnlyScore(false); setOnlyAttention(false);
              }}>
                {L("Alle", "All")}
              </button>

              <button className={pill(onlyAttention)} onClick={() => setOnlyAttention(!onlyAttention)}>
                {L("Krever oppfølging", "Needs attention")}
              </button>

              <button
                className={pill(classes.length === 1 && classes[0] === "unclassified")}
                onClick={() =>
                  setClasses(
                    classes.length === 1 && classes[0] === "unclassified" ? [] : ["unclassified"],
                  )
                }
              >
                {L("Ikke klassifisert", "Unclassified")}
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
                <PopoverContent align="end" className="w-80 space-y-4 max-h-[70vh] overflow-y-auto">
                  {activeFrameworks.length > 0 && (
                    <FilterGroup title={L("Regelverk", "Regulations")}>
                      {activeFrameworks.map((f) => (
                        <button
                          key={f.framework_id}
                          className={pill(frameworkFilter.includes(f.framework_id))}
                          onClick={() => toggle(frameworkFilter, setFrameworkFilter, f.framework_id)}
                        >
                          {f.framework_name}
                        </button>
                      ))}
                    </FilterGroup>
                  )}
                  <FilterGroup title={L("Dokumentklasse", "Document class")}>
                    {(Object.keys(DOC_CLASS_LABELS) as HubDocClass[]).map((c) => (
                      <button
                        key={c}
                        className={pill(classes.includes(c))}
                        onClick={() => toggle(classes, setClasses, c)}
                        title={DOC_CLASS_HELP[c][isNb ? "nb" : "en"]}
                      >
                        {DOC_CLASS_LABELS[c][isNb ? "nb" : "en"]}
                      </button>
                    ))}
                  </FilterGroup>
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
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table className="w-auto table-auto md:table-fixed md:w-full md:min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="md:w-[35%] md:sm:w-[40%]">{L("Dokument", "Document")}</TableHead>
                    <TableHead className="hidden md:table-cell md:w-[90px]">{L("Klasse", "Class")}</TableHead>
                    <TableHead className="hidden md:table-cell md:w-[120px]">{L("Analyse", "Analysis")}</TableHead>
                    <TableHead className="hidden lg:table-cell md:w-[110px]">{L("Type", "Type")}</TableHead>
                    <TableHead className="hidden lg:table-cell md:w-[110px]">
                      <div className="flex items-center gap-1.5">
                        {L("Modul", "Module")}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
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
                    <TableHead className="hidden sm:table-cell md:w-[90px]">{L("Status", "Status")}</TableHead>
                    <TableHead className="hidden xl:table-cell md:w-[110px]">{L("Registrert av", "Registered by")}</TableHead>
                    <TableHead className="w-[90px] text-right">{L("Dato", "Date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((doc) => (
                    <TableRow
                      key={doc.id}
                      onClick={() => setSelected(doc)}
                      className="cursor-pointer"
                    >
                      <TableCell className="py-2 whitespace-nowrap overflow-hidden">
                        <div className="font-medium text-sm text-foreground truncate">
                          {doc.name}
                        </div>
                        {doc.contextLabel && (
                          <div className="text-[12px] text-muted-foreground truncate">
                            {doc.contextLabel}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2 whitespace-nowrap overflow-hidden">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[12px] font-normal truncate max-w-[110px]",
                                    docClassOf(doc) === "governing" && "border-primary/40 bg-primary/10 text-primary",
                                    docClassOf(doc) === "unclassified" && "text-muted-foreground",
                                  )}
                                >
                                  {DOC_CLASS_LABELS[docClassOf(doc)][isNb ? "nb" : "en"]}
                                </Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-[13px]">
                              {DOC_CLASS_HELP[docClassOf(doc)][isNb ? "nb" : "en"]}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2 whitespace-nowrap overflow-hidden">
                        {scoreDocIds.has(doc.id) ? (
                          <Badge
                            variant="outline"
                            className="border-success bg-success/10 text-foreground text-[12px] font-normal gap-1 truncate max-w-[140px]"
                          >
                            <CheckCircle2 className="h-3 w-3 text-success shrink-0" aria-hidden="true" />
                            {L("Påvirker modenhet", "Affects maturity")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-border bg-muted text-foreground text-[12px] font-normal gap-1 truncate max-w-[140px]"
                          >
                            <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {L("Ikke analysert", "Not analysed")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 text-[13px] text-muted-foreground whitespace-nowrap overflow-hidden truncate">
                        {documentTypeLabel(doc.documentType, isNb)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 whitespace-nowrap overflow-hidden">
                        {(() => {
                          const href = doc.sourceRoute || MODULE_ROUTES[doc.module];
                          const label = MODULE_LABELS[doc.module][isNb ? "nb" : "en"];
                          if (!href) {
                            return (
                              <Badge variant="outline" className="text-[12px] font-normal truncate max-w-[110px]">
                                {label}
                              </Badge>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(href);
                              }}
                              className="inline-flex"
                              title={L(`Åpne ${label}`, `Open ${label}`)}
                            >
                              <Badge
                                variant="outline"
                                className="text-[12px] font-normal gap-1 hover:bg-muted hover:border-primary/40 transition-colors truncate max-w-[110px]"
                              >
                                {label}
                                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
                              </Badge>
                            </button>
                          );
                        })()}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "hidden sm:table-cell py-2 text-[13px] whitespace-nowrap overflow-hidden truncate",
                          doc.status === "expired" || doc.status === "expiring"
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {STATUS_LABELS[doc.status][isNb ? "nb" : "en"]}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell py-2 text-[13px] text-muted-foreground whitespace-nowrap overflow-hidden truncate">
                        {doc.uploadedBy || L("Ukjent", "Unknown")}
                      </TableCell>
                      <TableCell className="py-2 text-[13px] text-muted-foreground whitespace-nowrap overflow-hidden text-right">
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
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <UploadHubDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        frameworks={activeFrameworks}
        presetName={preset.name}
        presetFrameworkId={preset.frameworkId}
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">
                      {L("Dokumentklasse", "Document class")}
                    </Label>
                    <Select
                      value={docClassOf(selected)}
                      onValueChange={(v) => updateGovernance(selected.id, { docClass: v as HubDocClass })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(DOC_CLASS_LABELS) as HubDocClass[]).map((c) => (
                          <SelectItem key={c} value={c}>
                            {DOC_CLASS_LABELS[c][isNb ? "nb" : "en"]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[12px] text-muted-foreground">
                      {DOC_CLASS_HELP[docClassOf(selected)][isNb ? "nb" : "en"]}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] text-muted-foreground">
                        {L("Eier / ansvarlig", "Owner")}
                      </Label>
                      <Input
                        className="h-9 text-sm"
                        value={governance[selected.id]?.owner ?? ""}
                        placeholder={L("Navn", "Name")}
                        onChange={(e) => updateGovernance(selected.id, { owner: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] text-muted-foreground">
                        {L("Neste gjennomgang", "Next review")}
                      </Label>
                      <Input
                        type="date"
                        className="h-9 text-sm"
                        value={governance[selected.id]?.nextReview ?? ""}
                        onChange={(e) => updateGovernance(selected.id, { nextReview: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

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
