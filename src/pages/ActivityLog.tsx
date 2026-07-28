import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Activity, Search, User, Bot, Cog, Building2, Sparkles, Filter,
} from "lucide-react";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import {
  getActivityEvents,
  formatRelative,
  CATEGORY_LABELS,
  type ActivityCategory,
  type ActorType,
} from "@/lib/activityLogData";

const ACTOR_ICON: Record<ActorType, typeof User> = {
  customer_user: User,
  partner_user: Building2,
  ai: Sparkles,
  system: Cog,
};

const ACTOR_LABEL: Record<ActorType, string> = {
  customer_user: "Kunde",
  partner_user: "Partner",
  ai: "Lara",
  system: "System",
};

export default function ActivityLog() {
  const navigate = useNavigate();
  const { mode } = useWorkspaceMode();
  const isPartner = mode === "partner";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | ActivityCategory>("all");
  const [customer, setCustomer] = useState<string>("all");

  const events = useMemo(() => getActivityEvents(mode), [mode]);

  const customers = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.customerName && set.add(e.customerName));
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (isPartner && customer !== "all" && e.customerName !== customer) return false;
      if (!q) return true;
      return (
        e.action.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q) ||
        (e.resource ?? "").toLowerCase().includes(q) ||
        (e.customerName ?? "").toLowerCase().includes(q)
      );
    });
  }, [events, search, category, customer, isPartner]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 pt-11">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold text-foreground">Aktivitetslogg</h1>
                <Badge
                  variant="outline"
                  className={
                    isPartner
                      ? "border-primary/40 text-primary bg-primary/5"
                      : "text-muted-foreground"
                  }
                >
                  {isPartner ? "Partner-visning" : "Egen virksomhet"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {isPartner
                  ? "Hendelser på tvers av dine kunder og partnerens egne handlinger."
                  : "Hva som har skjedd i din virksomhet – hvem gjorde hva, når."}
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-3 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i hendelser…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>

              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger className="h-9 w-[180px]">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kategorier</SelectItem>
                  {(Object.keys(CATEGORY_LABELS) as ActivityCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {CATEGORY_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isPartner && customers.length > 0 && (
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger className="h-9 w-[200px]">
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="Kunde" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle kunder</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  Ingen hendelser matcher filteret.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((e) => {
                    const Icon = ACTOR_ICON[e.actorType];
                    return (
                      <li
                        key={e.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            e.actorType === "ai"
                              ? "bg-primary/10 text-primary"
                              : e.actorType === "partner_user"
                              ? "bg-primary/10 text-primary"
                              : e.actorType === "system"
                              ? "bg-muted text-muted-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">
                              {e.actorName}
                            </span>
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              {ACTOR_LABEL[e.actorType]}
                            </span>
                            {isPartner && e.customerName && (
                              <Badge variant="secondary" className="text-[11px] py-0 px-1.5">
                                {e.customerName}
                              </Badge>
                            )}
                            {isPartner && e.scope === "partner-internal" && (
                              <Badge
                                variant="outline"
                                className="text-[11px] py-0 px-1.5 border-primary/30 text-primary"
                              >
                                Hos partner
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground mt-0.5">
                            {e.action}
                            {e.resource && (
                              <>
                                {" · "}
                                <span className="text-muted-foreground">{e.resource}</span>
                              </>
                            )}
                          </p>
                          {e.meta && (
                            <p className="text-xs text-muted-foreground mt-0.5">{e.meta}</p>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                          {formatRelative(e.createdAt)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <p className="text-[11px] text-muted-foreground text-center">
            <Activity className="inline h-3 w-3 mr-1 -mt-0.5" />
            Bytter du workspace via bryteren øverst, oppdateres loggen automatisk.
          </p>
        </div>
      </main>
    </div>
  );
}
