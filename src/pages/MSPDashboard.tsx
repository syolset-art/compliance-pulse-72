import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Database, Trash2, LayoutGrid, Rows3, Search, ArrowUp, ArrowDown, ArrowUpDown, Megaphone, Users, Sparkles, ArrowRight } from "lucide-react";
import { MSPCustomerCard } from "@/components/msp/MSPCustomerCard";
import { AddMSPCustomerDialog } from "@/components/msp/AddMSPCustomerDialog";
import { CampaignWizardDialog } from "@/components/msp/CampaignWizardDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { seedDemoMSP, deleteDemoMSP } from "@/lib/demoSeedMSP";
import { CAMPAIGN_SEGMENTS, SEGMENT_CATEGORY_LABEL, DEMO_CAMPAIGN_CUSTOMERS, type CampaignSegment } from "@/lib/campaignSegments";
import { toast } from "sonner";

type ViewMode = "cards" | "table";
type StatusFilter = "all" | "draft" | "onboarding" | "active" | "inactive";

function deriveStatusKey(c: any): "draft" | "invited" | "claimed" | "archived" {
  if (c.status === "inactive") return "archived";
  if (c.onboarding_completed) return "claimed";
  if (c.status === "active") return "claimed";
  if (c.status === "onboarding") return "invited";
  return "draft";
}

// Derived criticality based on industry + size — purely presentational
const HIGH_CRIT_INDUSTRIES = new Set(["Energi", "Helse", "Finans"]);
const MED_CRIT_INDUSTRIES = new Set(["Teknologi", "Transport", "Utdanning"]);
function deriveCriticality(c: any): { key: "high" | "medium" | "low"; label: string; tone: string } {
  const ind = c.industry || "";
  const emp = c.employees || "";
  const big = /201|500|1000|\+/.test(emp);
  if (HIGH_CRIT_INDUSTRIES.has(ind) || big) return { key: "high", label: "Høy", tone: "bg-destructive/10 text-destructive border-destructive/20" };
  if (MED_CRIT_INDUSTRIES.has(ind)) return { key: "medium", label: "Medium", tone: "bg-warning/10 text-warning border-warning/20" };
  return { key: "low", label: "Lav", tone: "bg-muted text-muted-foreground border-border" };
}

// Suggested services Lara recommends based on gap, frameworks and industry
function deriveNeededServices(c: any): string[] {
  const services: string[] = [];
  const score = c.compliance_score || 0;
  const frameworks: string[] = c.active_frameworks || [];
  const ind = c.industry || "";

  if (score < 50) services.push("Compliance-grunnpakke");
  else if (score < 75) services.push("Modenhetsløft");

  if (!frameworks.includes("ISO 27001") && (HIGH_CRIT_INDUSTRIES.has(ind) || score >= 70)) {
    services.push("ISO 27001-forberedelse");
  }
  if (ind === "Helse") services.push("Pasientdata & DPIA");
  if (ind === "Finans") services.push("DORA-beredskap");
  if (ind === "Energi" || ind === "Transport") services.push("NIS2-vurdering");
  if (!frameworks.includes("GDPR")) services.push("GDPR-oppstart");
  if (score >= 80 && frameworks.includes("ISO 27001")) services.push("Sertifiseringsstøtte");

  return services.slice(0, 3);
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Utkast",
  invited: "Onboarding",
  claimed: "Aktiv",
  archived: "Inaktiv",
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-primary/10 text-primary border-primary/20",
  invited: "bg-warning/10 text-warning border-warning/20",
  claimed: "bg-success/10 text-success border-success/20",
  archived: "bg-muted text-muted-foreground border-border",
};

// Sort order for Status column: progression from draft to active to archived
const STATUS_ORDER: Record<string, number> = { draft: 0, invited: 1, claimed: 2, archived: 3 };

type SortKey = "customer_name" | "status" | "last_activity_at";
type SortDir = "asc" | "desc";

export default function MSPDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"customers" | "campaigns">("customers");
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("customer_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const queryClient = useQueryClient();

  const { data: customers = [], refetch } = useQuery({
    queryKey: ["msp-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (customers as any[]).filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return [c.customer_name, c.industry, c.org_number, c.contact_email]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q));
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "customer_name") {
        return (a.customer_name || "").localeCompare(b.customer_name || "", "nb") * dir;
      }
      if (sortKey === "status") {
        const ao = STATUS_ORDER[deriveStatusKey(a)] ?? 99;
        const bo = STATUS_ORDER[deriveStatusKey(b)] ?? 99;
        return (ao - bo) * dir;
      }
      // last_activity_at — nulls always sorted last
      const at = a.last_activity_at ? new Date(a.last_activity_at).getTime() : null;
      const bt = b.last_activity_at ? new Date(b.last_activity_at).getTime() : null;
      if (at === null && bt === null) return 0;
      if (at === null) return 1;
      if (bt === null) return -1;
      return (at - bt) * dir;
    });
    return sorted;
  }, [customers, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const handleSeed = async () => {
    try {
      await seedDemoMSP();
      queryClient.invalidateQueries({ queryKey: ["msp-customers"] });
      queryClient.invalidateQueries({ queryKey: ["msp-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["msp-purchases"] });
      toast.success("Demo-data lastet inn");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke laste demo-data");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDemoMSP();
      queryClient.invalidateQueries({ queryKey: ["msp-customers"] });
      queryClient.invalidateQueries({ queryKey: ["msp-licenses"] });
      queryClient.invalidateQueries({ queryKey: ["msp-purchases"] });
      toast.success("Demo-data slettet");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke slette demo-data");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Kunder <span className="text-muted-foreground font-normal">({filtered.length}{filtered.length !== customers.length ? ` av ${customers.length}` : ""})</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSeed}><Database className="h-4 w-4 mr-2" />Last inn demo-data</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Slett demo-data</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til kunde
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "customers" | "campaigns")} className="w-full">
            <TabsList className="bg-muted/30 border border-border rounded-xl p-1 h-auto gap-0.5">
              <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5 text-sm gap-1.5">
                <Users className="h-3.5 w-3.5" /> Kunder
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5 text-sm gap-1.5">
                <Megaphone className="h-3.5 w-3.5" /> Aktuelle kampanjer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="mt-5 space-y-5">
              {/* Toolbar: search + filter + view toggle */}
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Søk på navn, bransje, org.nr eller e-post"
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Alle statuser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statuser</SelectItem>
                    <SelectItem value="draft">Utkast</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
                <div className="inline-flex rounded-md border border-border bg-background overflow-hidden md:ml-auto">
                  <button
                    type="button"
                    onClick={() => setView("cards")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                      view === "cards" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                    aria-pressed={view === "cards"}
                  >
                    <LayoutGrid className="h-4 w-4" /> Kort
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 text-sm border-l border-border transition-colors",
                      view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                    aria-pressed={view === "table"}
                  >
                    <Rows3 className="h-4 w-4" /> Tabell
                  </button>
                </div>
              </div>

              {customers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg">Ingen kunder registrert ennå</p>
                  <p className="text-sm mt-1">Klikk «Legg til kunde» for å komme i gang</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-sm">Ingen kunder matcher søket eller filteret</p>
                </div>
              ) : view === "cards" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filtered.map((c: any) => (
                    <MSPCustomerCard key={c.id} customer={c} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <button type="button" onClick={() => toggleSort("customer_name")} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                            Kunde <SortIcon k="customer_name" />
                          </button>
                        </TableHead>
                        <TableHead>Bransje</TableHead>
                        <TableHead>Kritikalitet</TableHead>
                        <TableHead>Tjenester kunden trenger</TableHead>
                        <TableHead>
                          <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                            Status <SortIcon k="status" />
                          </button>
                        </TableHead>
                        <TableHead className="text-right">Modenhet</TableHead>
                        <TableHead>
                          <button type="button" onClick={() => toggleSort("last_activity_at")} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                            Siste aktivitet <SortIcon k="last_activity_at" />
                          </button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c: any) => {
                        const sk = deriveStatusKey(c);
                        const score = c.compliance_score || 0;
                        const crit = deriveCriticality(c);
                        const services = deriveNeededServices(c);
                        const last = c.last_activity_at
                          ? new Date(c.last_activity_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })
                          : "—";
                        return (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/msp-dashboard/${c.id}`)}
                          >
                            <TableCell className="font-medium">{c.customer_name}</TableCell>
                            <TableCell className="text-muted-foreground">{c.industry || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("font-normal", crit.tone)}>
                                {crit.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {services.length === 0 ? (
                                <span className="text-muted-foreground text-sm">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-[280px]">
                                  {services.map((s) => (
                                    <Badge key={s} variant="outline" className="font-normal bg-primary/5 text-primary border-primary/20 text-[11px]">
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("font-normal", STATUS_TONE[sk])}>
                                {STATUS_LABEL[sk]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {score > 0 ? `${score}%` : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{last}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="campaigns" className="mt-5 space-y-5">
              {(() => {
                const pool = DEMO_CAMPAIGN_CUSTOMERS;
                const segmentsWithMatches = CAMPAIGN_SEGMENTS
                  .map((s) => ({ segment: s, matches: pool.filter((c) => s.predicate(c)) }))
                  .filter((x) => x.matches.length > 0)
                  .sort((a, b) => b.matches.length - a.matches.length);

                const byCategory = segmentsWithMatches.reduce<Record<string, typeof segmentsWithMatches>>((acc, item) => {
                  (acc[item.segment.category] ??= []).push(item);
                  return acc;
                }, {});

                return (
                  <>
                    <Card className="p-4 border-primary/20 bg-primary/5 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Lara fant {segmentsWithMatches.length} aktuelle kampanjer</p>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                          Basert på kundeporteføljen — gap, modenhet, tjenester og aktivitet. Klikk en kampanje for å starte utsendelsen.
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setCampaignOpen(true)} className="gap-1.5 shrink-0">
                        <Megaphone className="h-3.5 w-3.5" /> Ny kampanje
                      </Button>
                    </Card>

                    {Object.entries(byCategory).map(([cat, items]) => (
                      <div key={cat} className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {SEGMENT_CATEGORY_LABEL[cat as CampaignSegment["category"]]}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {items.map(({ segment, matches }) => (
                            <button
                              key={segment.id}
                              type="button"
                              onClick={() => setCampaignOpen(true)}
                              className="text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4 group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {segment.label}
                                  </p>
                                  <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
                                    {segment.description}
                                  </p>
                                </div>
                                <Badge variant="outline" className="font-normal shrink-0 bg-primary/5 text-primary border-primary/20 tabular-nums">
                                  {matches.length}
                                </Badge>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {matches.slice(0, 3).map((m) => m.name).join(", ")}
                                  {matches.length > 3 && ` +${matches.length - 3}`}
                                </p>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {segmentsWithMatches.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <p className="text-sm">Ingen aktuelle kampanjer akkurat nå.</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>


        <AddMSPCustomerDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />
        <CampaignWizardDialog
          open={campaignOpen}
          onOpenChange={setCampaignOpen}
          onSend={(draft) => {
            setCampaignOpen(false);
            toast.success("Kampanje sendt", {
              description: `"${draft.name || "Uten navn"}" sendt til ${draft.recipients.length} kunder.`,
            });
          }}
        />
      </main>
    </div>
  );
}
