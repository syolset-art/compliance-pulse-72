import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { frameworks, categories, type Framework } from "@/lib/frameworkDefinitions";
import { FrameworkDetailCard } from "@/components/regulations/FrameworkDetailCard";
import { ComplianceHistoryChart } from "@/components/regulations/ComplianceHistoryChart";
import { FrameworkRequirementsList } from "@/components/regulations/FrameworkRequirementsList";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { FrameworkActivationDialog } from "@/components/dialogs/FrameworkActivationDialog";
import { FrameworkPurchaseDialog } from "@/components/dialogs/FrameworkPurchaseDialog";
import { loadCountryScope, type CountryScope } from "@/components/regulations/countryScopeData";
import { LaraRegulationsHeader } from "@/components/regulations/LaraRegulationsHeader";
import { RegulationsWorkQueue } from "@/components/regulations/RegulationsWorkQueue";
import { FrameworkOverviewList } from "@/components/regulations/FrameworkOverviewList";
import { RegulationsViewSwitch, rememberRegulationsView } from "@/components/regulations/RegulationsViewSwitch";
import {
  buildRegulationsQueue,
  getFrameworkAgentStats,
  summarizeAgentWork,
  type RegulationQueueItem,
} from "@/lib/regulationsAgentQueue";
import { staggerEntranceClass } from "@/lib/animation";
import { cn } from "@/lib/utils";

interface SelectedFrameworkRow {
  id: string;
  framework_id: string;
  is_selected: boolean;
}

/**
 * Beta: agentisk versjon av regelverk-siden. Klassisk visning ligger på
 * /regulations og er fortsatt standard.
 */
const RegulationsBeta = () => {
  const { toast } = useToast();
  const [selectedFrameworks, setSelectedFrameworks] = useState<SelectedFrameworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activatedFramework, setActivatedFramework] = useState<Framework | null>(null);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [purchaseFramework, setPurchaseFramework] = useState<Framework | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightReqId, setHighlightReqId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [liveCounts, setLiveCounts] = useState<
    Record<string, { met: number; partial: number; notMet: number; auto: number; manual: number; total: number }>
  >({});
  const [countryScope] = useState<CountryScope>(() => loadCountryScope());
  const detailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    rememberRegulationsView("beta");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from("selected_frameworks").select("*").order("framework_name");
        if (error) throw error;
        setSelectedFrameworks((data as SelectedFrameworkRow[]) || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Feil ved lasting",
          description: "Kunne ikke laste regelverk og standarder",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const isFrameworkActive = useCallback(
    (fwId: string) => selectedFrameworks.find((f) => f.framework_id === fwId)?.is_selected === true,
    [selectedFrameworks],
  );

  const allActiveFrameworks = useMemo(
    () => frameworks.filter((fw) => isFrameworkActive(fw.id)),
    [isFrameworkActive],
  );

  const visibleFrameworks = useMemo(
    () => (categoryFilter ? allActiveFrameworks.filter((fw) => fw.category === categoryFilter) : allActiveFrameworks),
    [allActiveFrameworks, categoryFilter],
  );

  const activeFrameworkIds = useMemo(
    () => new Set(allActiveFrameworks.map((f) => f.id)),
    [allActiveFrameworks],
  );

  useEffect(() => {
    if (!selectedId && visibleFrameworks.length > 0) setSelectedId(visibleFrameworks[0].id);
  }, [visibleFrameworks, selectedId]);

  const selectedFramework = useMemo(() => frameworks.find((f) => f.id === selectedId) || null, [selectedId]);

  const summary = useMemo(
    () => summarizeAgentWork(allActiveFrameworks.map((f) => f.id)),
    [allActiveFrameworks],
  );

  const overallPercent = useMemo(() => {
    let met = 0;
    let total = 0;
    allActiveFrameworks.forEach((fw) => {
      const s = getFrameworkAgentStats(fw.id);
      met += s.met;
      total += s.total;
    });
    return total > 0 ? Math.round((met / total) * 100) : 0;
  }, [allActiveFrameworks]);

  const queue = useMemo(() => buildRegulationsQueue(allActiveFrameworks), [allActiveFrameworks]);

  const currentCounts = useMemo(() => {
    if (!selectedId) return { met: 0, partial: 0, notMet: 0, auto: 0, manual: 0, total: 0 };
    const live = liveCounts[selectedId];
    if (live) return live;
    const s = getFrameworkAgentStats(selectedId);
    return {
      met: s.met,
      partial: 0,
      notMet: s.total - s.met,
      auto: s.agentFollowUp,
      manual: s.total - s.agentFollowUp,
      total: s.total,
    };
  }, [selectedId, liveCounts]);

  const handleCountsChange = useCallback(
    (counts: { met: number; partial: number; notMet: number; auto: number; manual: number; total: number }) => {
      if (!selectedId) return;
      setLiveCounts((prev) => ({ ...prev, [selectedId]: counts }));
    },
    [selectedId],
  );

  const openFramework = useCallback((frameworkId: string) => {
    setSelectedId(frameworkId);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const handleQueueOpen = useCallback(
    (item: RegulationQueueItem) => openFramework(item.frameworkId),
    [openFramework],
  );

  const executeToggleFramework = async (frameworkId: string, currentlyActive: boolean) => {
    const fw = frameworks.find((f) => f.id === frameworkId);
    if (!fw) return;
    const existing = selectedFrameworks.find((f) => f.framework_id === frameworkId);
    setUpdating(frameworkId);
    try {
      if (existing) {
        const { error } = await supabase
          .from("selected_frameworks")
          .update({ is_selected: !currentlyActive })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("selected_frameworks").insert({
          framework_id: fw.id,
          framework_name: fw.name,
          category: fw.category,
          is_mandatory: fw.isMandatory || false,
          is_recommended: fw.isRecommended || false,
          is_selected: true,
        });
        if (error) throw error;
      }
      const { data } = await supabase.from("selected_frameworks").select("*").order("framework_name");
      setSelectedFrameworks((data as SelectedFrameworkRow[]) || []);
      if (!currentlyActive) {
        setActivatedFramework(fw);
        setShowActivationDialog(true);
      } else {
        toast({ title: "Krav deaktivert", description: "Kravet er fjernet fra listen din" });
      }
    } catch (error) {
      console.error("Error toggling framework:", error);
      toast({ title: "Feil", description: "Kunne ikke oppdatere krav", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const toggleFramework = async (frameworkId: string, currentlyActive: boolean) => {
    const fw = frameworks.find((f) => f.id === frameworkId);
    if (!fw) return;
    if (!currentlyActive) {
      setPurchaseFramework(fw);
      return;
    }
    await executeToggleFramework(frameworkId, currentlyActive);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-muted-foreground">Laster...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="px-4 pt-8 pb-4 sm:p-6 max-w-4xl mx-auto space-y-4">
          {/* Tittelrad */}
          <div className={cn("flex items-start justify-between gap-3", staggerEntranceClass(0))}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Regelverk</h1>
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <span className="cursor-help rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        Beta
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[18rem]">
                      Ny agentisk visning under utprøving. Den klassiske visningen finnes fortsatt — bytt når du vil.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Lara holder oversikt over regelverkene dine. Her er det hun trenger deg til.
              </p>
            </div>
            <RegulationsViewSwitch current="beta" className="shrink-0" />
          </div>

          {allActiveFrameworks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
              <p>Ingen krav eller standarder er aktivert ennå.</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowEditDialog(true)}>
                Legg til krav
              </Button>
            </div>
          ) : (
            <>
              <LaraRegulationsHeader
                className={staggerEntranceClass(1)}
                frameworks={summary.frameworks}
                analysed={summary.analysed}
                confirmed={summary.confirmed}
                waitingYou={summary.waitingYou}
                percent={overallPercent}
                onReview={queue.length > 0 ? () => handleQueueOpen(queue[0]) : undefined}
                onEditFrameworks={() => setShowEditDialog(true)}
              />

              <RegulationsWorkQueue items={queue} onOpen={handleQueueOpen} />

              {/* Rolig regelverksliste */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Dine regelverk</h2>
                  {allActiveFrameworks.length > 3 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground">
                          <Filter className="h-3.5 w-3.5" />
                          {categoryFilter
                            ? categories.find((c) => c.id === categoryFilter)?.name ?? "Filtrer"
                            : "Filtrer"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-auto p-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant={categoryFilter === null ? "default" : "ghost"}
                            size="sm"
                            className="h-8 justify-start text-xs"
                            onClick={() => setCategoryFilter(null)}
                          >
                            Alle ({allActiveFrameworks.length})
                          </Button>
                          {categories
                            .filter((c) => allActiveFrameworks.some((fw) => fw.category === c.id))
                            .map((cat) => {
                              const count = allActiveFrameworks.filter((fw) => fw.category === cat.id).length;
                              const CatIcon = cat.icon;
                              return (
                                <Button
                                  key={cat.id}
                                  variant={categoryFilter === cat.id ? "default" : "ghost"}
                                  size="sm"
                                  className="h-8 justify-start gap-1.5 text-xs"
                                  onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                                >
                                  <CatIcon className="h-3.5 w-3.5" />
                                  {cat.name} ({count})
                                </Button>
                              );
                            })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <FrameworkOverviewList
                  frameworks={visibleFrameworks}
                  getStats={getFrameworkAgentStats}
                  selectedId={selectedId}
                  onSelect={openFramework}
                />
              </div>
            </>
          )}

          {/* Detalj for valgt regelverk */}
          {selectedFramework && (
            <div ref={detailRef} className="mt-6 space-y-4 scroll-mt-16">
              <FrameworkDetailCard framework={selectedFramework} counts={currentCounts} />

              <div className="rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((v) => !v)}
                  aria-expanded={historyOpen}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
                >
                  Hva har skjedd
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", historyOpen && "rotate-180")} />
                </button>
                {historyOpen && (
                  <div className="px-2 pb-3">
                    <ComplianceHistoryChart
                      frameworkId={selectedFramework.id}
                      onEventClick={(reqId) => setHighlightReqId(reqId)}
                    />
                  </div>
                )}
              </div>

              <FrameworkRequirementsList
                key={selectedFramework.id}
                frameworkId={selectedFramework.id}
                onCountsChange={handleCountsChange}
                highlightRequirementId={highlightReqId}
              />
            </div>
          )}
        </div>
      </main>

      <EditActiveFrameworksDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        activeFrameworkIds={activeFrameworkIds}
        onToggle={toggleFramework}
        updatingId={updating}
        countryScope={countryScope}
      />

      <FrameworkPurchaseDialog
        open={!!purchaseFramework}
        onOpenChange={(open) => !open && setPurchaseFramework(null)}
        framework={purchaseFramework}
        onConfirm={async () => {
          if (!purchaseFramework) return;
          const fw = purchaseFramework;
          setPurchaseFramework(null);
          await executeToggleFramework(fw.id, false);
        }}
      />

      <FrameworkActivationDialog
        open={showActivationDialog}
        onOpenChange={setShowActivationDialog}
        framework={activatedFramework}
      />
    </div>
  );
};

export default RegulationsBeta;
