import { useState, useEffect, useCallback, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Settings2, HelpCircle, Scale, Shield, CheckCircle2, BookOpen } from "lucide-react";
import { PageHelpDrawer } from "@/components/shared/PageHelpDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { frameworks, categories, type Framework } from "@/lib/frameworkDefinitions";
import { FrameworkChipSelector } from "@/components/regulations/FrameworkChipSelector";
import { FrameworkDetailCard } from "@/components/regulations/FrameworkDetailCard";
import { ComplianceHistoryChart } from "@/components/regulations/ComplianceHistoryChart";
import { FrameworkRequirementsList } from "@/components/regulations/FrameworkRequirementsList";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { FrameworkActivationDialog } from "@/components/dialogs/FrameworkActivationDialog";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";

interface SelectedFramework {
  id: string;
  framework_id: string;
  framework_name: string;
  category: string;
  is_mandatory: boolean;
  is_recommended: boolean;
  is_selected: boolean;
  notes: string | null;
}

// Deterministic demo statuses
function getDemoStats(frameworkId: string) {
  const reqs = getReqs(frameworkId);
  let met = 0, partial = 0, notMet = 0, auto = 0;
  reqs.forEach((req, i) => {
    const hash = (req.requirement_id.charCodeAt(req.requirement_id.length - 1) + i) % 10;
    if (hash < 3) met++;
    else if (hash === 3) partial++;
    else notMet++;
    if (req.agent_capability === "full") auto++;
  });
  return { met, partial, notMet, auto, manual: reqs.length - auto, total: reqs.length };
}

function getReqs(frameworkId: string): ComplianceRequirement[] {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main;
  return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
}

const Regulations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFrameworks, setSelectedFrameworks] = useState<SelectedFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [activatedFramework, setActivatedFramework] = useState<Framework | null>(null);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightReqId, setHighlightReqId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [liveCounts, setLiveCounts] = useState<Record<string, { met: number; partial: number; notMet: number; auto: number; manual: number; total: number }>>({});
  const [helpOpen, setHelpOpen] = useState(false);

  // Fetch frameworks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("selected_frameworks")
          .select("*")
          .order("framework_name");
        if (error) throw error;
        setSelectedFrameworks(data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Feil ved lasting", description: "Kunne ikke laste regelverk", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Auto-initialize mandatory frameworks
  useEffect(() => {
    const init = async () => {
      if (loading || initializing) return;
      const mandatoryFrameworks = frameworks.filter((f) => f.isMandatory);
      const missing = mandatoryFrameworks.filter((mf) => !selectedFrameworks.some((sf) => sf.framework_id === mf.id));
      if (missing.length === 0) return;
      setInitializing(true);
      try {
        const inserts = missing.map((fw) => ({
          framework_id: fw.id,
          framework_name: fw.name,
          category: fw.category,
          is_mandatory: true,
          is_recommended: false,
          is_selected: true,
        }));
        const { error } = await supabase.from("selected_frameworks").insert(inserts);
        if (error) throw error;
        const { data } = await supabase.from("selected_frameworks").select("*").order("framework_name");
        setSelectedFrameworks(data || []);
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [loading, selectedFrameworks, initializing]);

  const isFrameworkActive = useCallback(
    (fwId: string) => {
      const s = selectedFrameworks.find((f) => f.framework_id === fwId);
      return s?.is_selected || s?.is_mandatory || false;
    },
    [selectedFrameworks]
  );

  const allActiveFrameworks = useMemo(
    () => frameworks.filter((fw) => isFrameworkActive(fw.id)),
    [isFrameworkActive]
  );

  const activeFrameworks = useMemo(
    () => categoryFilter ? allActiveFrameworks.filter((fw) => fw.category === categoryFilter) : allActiveFrameworks,
    [allActiveFrameworks, categoryFilter]
  );

  const activeFrameworkIds = useMemo(
    () => new Set(activeFrameworks.map((f) => f.id)),
    [activeFrameworks]
  );

  // Auto-select first active framework
  useEffect(() => {
    if (!selectedId && activeFrameworks.length > 0) {
      setSelectedId(activeFrameworks[0].id);
    }
  }, [activeFrameworks, selectedId]);

  const selectedFramework = useMemo(
    () => frameworks.find((f) => f.id === selectedId) || null,
    [selectedId]
  );

  const getChipStats = useCallback(
    (fwId: string) => {
      const live = liveCounts[fwId];
      if (live) return { met: live.met, total: live.total };
      const s = getDemoStats(fwId);
      return { met: s.met, total: s.total };
    },
    [liveCounts]
  );

  const currentCounts = useMemo(() => {
    if (!selectedId) return { met: 0, partial: 0, notMet: 0, auto: 0, manual: 0, total: 0 };
    return liveCounts[selectedId] || getDemoStats(selectedId);
  }, [selectedId, liveCounts]);

  const handleCountsChange = useCallback(
    (counts: { met: number; partial: number; notMet: number; auto: number; manual: number; total: number }) => {
      if (!selectedId) return;
      setLiveCounts((prev) => ({ ...prev, [selectedId]: counts }));
    },
    [selectedId]
  );

  const toggleFramework = async (frameworkId: string, currentlyActive: boolean) => {
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
        const fw = frameworks.find((f) => f.id === frameworkId);
        if (!fw) return;
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
      setSelectedFrameworks(data || []);

      if (!currentlyActive) {
        const fw = frameworks.find((f) => f.id === frameworkId);
        if (fw) {
          setActivatedFramework(fw);
          setShowActivationDialog(true);
        }
      } else {
        const fw = frameworks.find((f) => f.id === frameworkId);
        toast({
          title: fw?.isMandatory ? "⚠️ Obligatorisk regelverk deaktivert" : "Regelverk deaktivert",
          description: fw?.isMandatory
            ? `${fw.name} er lovpålagt, men er nå fjernet fra ditt scope.`
            : "Regelverket er fjernet fra listen din",
        });
      }
    } catch (error) {
      console.error("Error toggling framework:", error);
      toast({ title: "Feil", description: "Kunne ikke oppdatere regelverk", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
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
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  Regelverk og etterlevelse
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-base font-bold min-w-[2rem] h-8 px-2.5">
                    {allActiveFrameworks.length}
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Velg et regelverk for å se status og håndtere krav
                </p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setHelpOpen(true)}>
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Hvordan fungerer dette?</span>
              </Button>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setShowEditDialog(true)}>
              <Settings2 className="h-4 w-4" />
              Rediger aktive regelverk
            </Button>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={categoryFilter === null ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setCategoryFilter(null)}
            >
              Alle ({allActiveFrameworks.length})
            </Button>
            {categories.filter(c => allActiveFrameworks.some(fw => fw.category === c.id)).map((cat) => {
              const count = allActiveFrameworks.filter(fw => fw.category === cat.id).length;
              const CatIcon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={categoryFilter === cat.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                >
                  <CatIcon className="h-3.5 w-3.5" />
                  {cat.name} ({count})
                </Button>
              );
            })}
          </div>

          {/* Framework chip selector */}
          {activeFrameworks.length > 0 ? (
            <FrameworkChipSelector
              frameworks={activeFrameworks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              getStats={getChipStats}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              <p>Ingen regelverk er aktivert ennå.</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowEditDialog(true)}>
                Legg til regelverk
              </Button>
            </div>
          )}

          {/* Selected framework detail */}
          {selectedFramework && (
            <div className="mt-6 space-y-4">
              <FrameworkDetailCard framework={selectedFramework} counts={currentCounts} />
              <ComplianceHistoryChart frameworkId={selectedFramework.id} onEventClick={(reqId) => setHighlightReqId(reqId)} />
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

      {/* Edit frameworks sheet */}
      <EditActiveFrameworksDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        activeFrameworkIds={activeFrameworkIds}
        onToggle={toggleFramework}
        updatingId={updating}
      />

      {/* Framework activation dialog */}
      <FrameworkActivationDialog
        open={showActivationDialog}
        onOpenChange={setShowActivationDialog}
        framework={activatedFramework}
        onNavigate={(path) => navigate(path)}
        onOpenChat={(message) => {
          navigate("/", { state: { openChat: true, chatMessage: message } });
        }}
      />

      <PageHelpDrawer
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={Scale}
        title="Hva er Regelverk og etterlevelse?"
        description="Her administrerer du hvilke regelverk som gjelder for din virksomhet. Du kan aktivere og deaktivere rammeverk, se status på krav, og følge opp etterlevelse på tvers av alle aktive regelverk."
        itemsHeading="Hva kan du gjøre her?"
        items={[
          { icon: Shield, title: "Aktiver regelverk", description: "Velg hvilke rammeverk som er relevante — GDPR og ISO 27001 er inkludert gratis." },
          { icon: CheckCircle2, title: "Følg opp krav", description: "Se status på hvert enkelt krav og jobb systematisk mot full etterlevelse." },
          { icon: BookOpen, title: "Kategoriser og filtrer", description: "Filtrer etter Personvern, Informasjonssikkerhet, AI Governance eller Øvrige regelverk." },
        ]}
        whyTitle="Hvorfor er dette viktig?"
        whyDescription="Systematisk regelverk-styring sikrer at organisasjonen etterlever alle relevante lover og standarder. Det gir oversikt, reduserer risiko og bygger tillit hos kunder og partnere."
        stepsHeading="Kom i gang"
        steps={[
          { text: "Se gjennom obligatoriske regelverk som allerede er aktivert" },
          { text: "Aktiver frivillige regelverk som er relevante for din bransje" },
          { text: "Jobb med kravene i hvert regelverk for å øke etterlevelsen" },
        ]}
        laraSuggestion="Hvilke regelverk bør vi fokusere på basert på vår bransje?"
      />
    </div>
  );
};

export default Regulations;
