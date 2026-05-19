import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Database, Trash2, LayoutGrid, Rows3, Search } from "lucide-react";
import { MSPCustomerCard } from "@/components/msp/MSPCustomerCard";
import { AddMSPCustomerDialog } from "@/components/msp/AddMSPCustomerDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { seedDemoMSP, deleteDemoMSP } from "@/lib/demoSeedMSP";
import { toast } from "sonner";

type ViewMode = "cards" | "table";
type StatusFilter = "all" | "draft" | "onboarding" | "active" | "inactive";

function deriveStatusKey(c: any): "draft" | "invited" | "claimed" | "archived" {
  if (c.status === "inactive") return "archived";
  if (c.status === "onboarding") return "invited";
  if (c.status === "active" && c.onboarding_completed) return "claimed";
  return "draft";
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

export default function MSPDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
    return (customers as any[]).filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return [c.customer_name, c.industry, c.org_number, c.contact_email]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q));
    });
  }, [customers, search, statusFilter]);

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
                    <TableHead>Kunde</TableHead>
                    <TableHead>Bransje</TableHead>
                    <TableHead>Org.nr</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Modenhet</TableHead>
                    <TableHead>Siste aktivitet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c: any) => {
                    const sk = deriveStatusKey(c);
                    const score = c.compliance_score || 0;
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
                        <TableCell className="text-muted-foreground tabular-nums">{c.org_number || "—"}</TableCell>
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
        </div>

        <AddMSPCustomerDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />
      </main>
    </div>
  );
}
