import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";

import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Settings2, HelpCircle, Scale, Shield, CheckCircle2, BookOpen, FileText, RefreshCw, Layers, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { frameworks, categories, type Framework } from "@/lib/frameworkDefinitions";
import { FrameworkChipSelector } from "@/components/regulations/FrameworkChipSelector";
import { ActiveFrameworksSummary } from "@/components/regulations/ActiveFrameworksSummary";
import { FrameworkDetailCard } from "@/components/regulations/FrameworkDetailCard";
import { ComplianceHistoryChart } from "@/components/regulations/ComplianceHistoryChart";
import { FrameworkRequirementsList } from "@/components/regulations/FrameworkRequirementsList";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { RegulationsViewSwitch, rememberRegulationsView } from "@/components/regulations/RegulationsViewSwitch";


import { CountryScopeDialog } from "@/components/regulations/CountryScopeDialog";
import { loadCountryScope, saveCountryScope, SUPPORTED_COUNTRIES, getCountry, type CountryScope } from "@/components/regulations/countryScopeData";
import { FrameworkActivationDialog } from "@/components/dialogs/FrameworkActivationDialog";
import { FrameworkPurchaseDialog } from "@/components/dialogs/FrameworkPurchaseDialog";
import { BulkFrameworkActivationDialog } from "@/components/regulations/BulkFrameworkActivationDialog";
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedFrameworks, setSelectedFrameworks] = useState<SelectedFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [activatedFramework, setActivatedFramework] = useState<Framework | null>(null);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [purchaseFramework, setPurchaseFramework] = useState<Framework | null>(null);
  const [bulkFrameworks, setBulkFrameworks] = useState<Framework[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightReqId, setHighlightReqId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [liveCounts, setLiveCounts] = useState<Record<string, { met: number; partial: number; notMet: number; auto: number; manual: number; total: number }>>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [countryScope, setCountryScope] = useState<CountryScope>(() => loadCountryScope());
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  usePageHelpListener(setHelpOpen);

  // Husk at brukeren står i klassisk visning (brukes av Klassisk/Beta-bryteren).
  useEffect(() => {
    rememberRegulationsView("classic");
  }, []);



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
        toast({ title: "Feil ved lasting", description: "Kunne ikke laste regelverk og standarder", variant: "destructive" });
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
      // Active iff the row is explicitly selected. `is_mandatory` alone must NOT
      // force active status, otherwise the user can't deactivate a mandatory
      // framework from the prototype/edit dialog.
      return s?.is_selected === true;
    },
    [selectedFrameworks]
  );

  const allActiveFrameworks = useMemo(
    () => frameworks.filter((fw) => isFrameworkActive(fw.id)),
    [isFrameworkActive]
  );

  const activeFrameworks = useMemo(() => {
    let list = allActiveFrameworks;
    if (categoryFilter) list = list.filter((fw) => fw.category === categoryFilter);
    if (typeFilter) list = list.filter((fw) => fw.type === typeFilter);
    if (countryFilter) {
      const ids = new Set(getCountry(countryFilter)?.frameworkIds ?? []);
      list = list.filter((fw) => ids.has(fw.id));
    }
    return list;
  }, [allActiveFrameworks, categoryFilter, typeFilter, countryFilter]);

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
    const fw = frameworks.find((f) => f.id === frameworkId);
    if (!fw) return;

    // If activating, show purchase/confirm dialog first
    if (!currentlyActive) {
      setPurchaseFramework(fw);
      return;
    }

    // Deactivating — proceed directly
    await executeToggleFramework(frameworkId, currentlyActive);
  };

  const executeToggleFramework = async (frameworkId: string, currentlyActive: boolean) => {
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
          title: fw?.isMandatory ? "⚠️ Obligatorisk krav deaktivert" : "Krav deaktivert",
          description: fw?.isMandatory
            ? `${fw.name} er lovpålagt, men er nå fjernet fra ditt scope.`
            : "Kravet er fjernet fra listen din",
        });
      }
    } catch (error) {
      console.error("Error toggling framework:", error);
      toast({ title: "Feil", description: "Kunne ikke oppdatere krav", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const handleActivateMany = (ids: string[]) => {
    const list = ids
      .map((id) => frameworks.find((f) => f.id === id))
      .filter((f): f is Framework => !!f);
    if (list.length) setBulkFrameworks(list);
  };

  const handleBulkConfirm = async () => {
    const list = bulkFrameworks;
    setBulkFrameworks([]);
    for (const fw of list) {
      await executeToggleFramework(fw.id, false);
    }
    // Ikke vis aktiveringsdialog per regelverk ved samlet aktivering.
    setShowActivationDialog(false);
    setActivatedFramework(null);
    toast({
      title: `${list.length} regelverk aktivert`,
      description: list.map((f) => f.name).join(", "),
    });
  };

  const handlePurchaseConfirm = async () => {
    if (!purchaseFramework) return;
    const fw = purchaseFramework;
    setPurchaseFramework(null);
    await executeToggleFramework(fw.id, false);
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
        <div className="px-4 pt-8 pb-4 sm:p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {t("nav.regulations")}
                </h1>
                {allActiveFrameworks.length > 0 && (
                  <span
                    className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    title="Aktive regelverk og standarder"
                  >
                    {allActiveFrameworks.length} aktive
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Velg et regelverk eller en standard for å se status
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RegulationsViewSwitch current="classic" />
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEditDialog(true)}>
                <Settings2 className="h-4 w-4" />
                Endre regelverk
              </Button>
            </div>


          </div>


          {/* Active frameworks summary */}
          {allActiveFrameworks.length > 0 ? (
            <div className="space-y-4">
              <ActiveFrameworksSummary
                frameworks={allActiveFrameworks}
                getStats={getChipStats}
                expanded={summaryExpanded}
                onToggle={() => setSummaryExpanded((v) => !v)}
              />

              {summaryExpanded && (
                <>
                  {/* Category filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={categoryFilter === null && countryFilter === null && typeFilter === null ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => { setCategoryFilter(null); setCountryFilter(null); setTypeFilter(null); }}
                    >
                      Alle ({allActiveFrameworks.length})
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                          <Filter className="h-3.5 w-3.5" />
                          Kategori
                          {categoryFilter && (
                            <Badge variant="default" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[13px]">1</Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-2">
                        <div className="flex flex-col gap-1">
                          {categories.filter(c => allActiveFrameworks.some(fw => fw.category === c.id)).map((cat) => {
                            const count = allActiveFrameworks.filter(fw => fw.category === cat.id).length;
                            const CatIcon = cat.icon;
                            return (
                              <Button
                                key={cat.id}
                                variant={categoryFilter === cat.id ? "default" : "ghost"}
                                size="sm"
                                className="text-xs h-8 gap-1.5 justify-start"
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

                    {/* Country filter — only show countries the user has selected */}
                    {countryScope.countries.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                            <Filter className="h-3.5 w-3.5" />
                            Land
                            {countryFilter && (
                              <Badge variant="default" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[13px]">1</Badge>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-2">
                          <div className="flex flex-col gap-1">
                            {countryScope.countries.map((code) => {
                              const c = getCountry(code);
                              if (!c) return null;
                              const ids = new Set(c.frameworkIds);
                              const count = allActiveFrameworks.filter(fw => ids.has(fw.id)).length;
                              return (
                                <Button
                                  key={code}
                                  variant={countryFilter === code ? "default" : "ghost"}
                                  size="sm"
                                  className="text-xs h-8 gap-1.5 justify-start"
                                  onClick={() => setCountryFilter(countryFilter === code ? null : code)}
                                >
                                  <span aria-hidden>{c.flag}</span>
                                  {c.name} ({count})
                                </Button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* Type filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                          <Filter className="h-3.5 w-3.5" />
                          {t("regulationsPage.type")}
                          {typeFilter && (
                            <Badge variant="default" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[13px]">1</Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-2">
                        <div className="flex flex-col gap-1">
                          {[
                            { id: "regulation", label: t("regulationsPage.regulation") },
                            { id: "standard", label: t("regulationsPage.standard") },
                            { id: "guideline", label: t("regulationsPage.guideline") },
                            { id: "framework", label: t("regulationsPage.framework") },
                          ].map((type) => {
                            const count = allActiveFrameworks.filter((fw) => fw.type === type.id).length;
                            return (
                              <Button
                                key={type.id}
                                variant={typeFilter === type.id ? "default" : "ghost"}
                                size="sm"
                                className="text-xs h-8 gap-1.5 justify-start"
                                onClick={() => setTypeFilter(typeFilter === type.id ? null : type.id)}
                              >
                                {type.label} ({count})
                              </Button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Framework chip selector */}
                  <FrameworkChipSelector
                    frameworks={activeFrameworks}
                    selectedId={selectedId}
                    onSelect={(id) => { setSelectedId(id); setSummaryExpanded(false); }}
                    getStats={getChipStats}
                    hideSummary
                  />
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              <p>Ingen krav eller standarder er aktivert ennå.</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowEditDialog(true)}>
                Legg til krav
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

      {/* Country scope dialog */}
      <CountryScopeDialog
        open={countryDialogOpen}
        onOpenChange={setCountryDialogOpen}
        initialScope={countryScope}
        onApply={(scope, suggestedIds) => {
          setCountryScope(scope);
          saveCountryScope(scope);
          const notAlreadyActive = suggestedIds.filter((id) => !activeFrameworkIds.has(id));
          const names = notAlreadyActive
            .map((id) => frameworks.find((f) => f.id === id)?.name)
            .filter(Boolean) as string[];
          if (names.length > 0) {
            toast({
              title: `${names.length} foreslåtte regelverk`,
              description: names.slice(0, 4).join(", ") + (names.length > 4 ? ` +${names.length - 4} til` : ""),
            });
            setShowEditDialog(true);
          } else {
            toast({ title: "Land oppdatert", description: `${scope.countries.length} land valgt.` });
          }
        }}
      />

      {/* Edit frameworks sheet */}
      <EditActiveFrameworksDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        activeFrameworkIds={activeFrameworkIds}
        onToggle={toggleFramework}
        updatingId={updating}
        countryScope={countryScope}
        onEditCountries={() => setCountryDialogOpen(true)}
        onActivateMany={handleActivateMany}
      />

      {/* Samlet aktivering av flere regelverk */}
      <BulkFrameworkActivationDialog
        open={bulkFrameworks.length > 0}
        onOpenChange={(open) => { if (!open) setBulkFrameworks([]); }}
        frameworks={bulkFrameworks}
        onConfirm={handleBulkConfirm}
        isLoading={!!updating}
      />

      {/* Framework purchase dialog */}
      <FrameworkPurchaseDialog
        open={!!purchaseFramework}
        onOpenChange={(open) => { if (!open) setPurchaseFramework(null); }}
        framework={purchaseFramework}
        onConfirm={handlePurchaseConfirm}
        isLoading={!!updating}
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

      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={Scale}
        title="Regelverk og standarder"
        description="Her administrerer du hvilke regelverk og standarder som gjelder for din virksomhet. Du kan aktivere og deaktivere rammeverk, se status på krav, og følge opp etterlevelse."
        itemsHeading="Hva kan du gjøre her?"
        items={[
          { icon: Shield, title: "Aktiver regelverk og standarder", description: "Velg hvilke rammeverk som er relevante — GDPR og ISO 27001 er inkludert gratis." },
          { icon: CheckCircle2, title: "Følg opp krav", description: "Se status på hvert enkelt krav og jobb systematisk mot full etterlevelse." },
          { icon: BookOpen, title: "Kategoriser og filtrer", description: "Filtrer etter Personvern, Informasjonssikkerhet, AI Governance eller øvrige." },
        ]}
        whyTitle="Hvorfor er dette viktig?"
        whyDescription="Systematisk styring av regelverk og standarder sikrer at organisasjonen etterlever alle relevante lover og standarder. Det gir oversikt, reduserer risiko og bygger tillit hos kunder og partnere."
        stepsHeading="Kom i gang"
        steps={[
          { text: "Se gjennom obligatoriske regelverk som allerede er aktivert" },
          { text: "Aktiver frivillige standarder som er relevante for din bransje" },
          { text: "Jobb med kravene i hvert rammeverk for å øke etterlevelsen" },
        ]}
        actions={[
          { icon: Settings2, title: "Rediger aktive regelverk", description: "Legg til eller fjern regelverk og standarder fra ditt aktive scope.", onClick: () => setShowEditDialog(true) },
          { icon: FileText, title: "Eksporter etterlevelsesrapport", description: "Generer en PDF-rapport over status for alle aktive regelverk.", onClick: () => navigate("/reports/compliance") },
          { icon: RefreshCw, title: "Oppdater status", description: "Synkroniser status for alle regelverk med siste data.", onClick: () => { toast({ title: "Oppdaterer...", description: "Status synkroniseres." }); } },
          { icon: Layers, title: "Se alle kategorier", description: "Filtrer regelverk etter Personvern, Sikkerhet, AI eller annet.", onClick: () => setCategoryFilter(null) },
        ]}
        laraSuggestions={[
          { label: "Hvilke regelverk bør vi fokusere på?", message: "Hvilke regelverk og standarder bør vi fokusere på basert på vår bransje?" },
          { label: "Hjelp meg forstå GDPR-kravene", message: "Kan du forklare de viktigste GDPR-kravene for oss?" },
          { label: "Hva mangler vi for ISO 27001?", message: "Hva mangler vi for å oppnå ISO 27001-samsvar?" },
          { label: "Lag en etterlevelsesplan", message: "Hjelp meg med å lage en etterlevelsesplan for de neste 6 månedene." },
        ]}
        laraSuggestion="Hvilke regelverk bør vi fokusere på basert på vår bransje?"
        scoreTab={{
          label: "Score",
          understand: (
            <div className="space-y-4">
              <p>
                Scoren viser hvor mye du har dokumentert av etterlevelse av lover og regler.
                Jo flere kontrollpunkter du har besvart og bekreftet med dokumentasjon, jo høyere blir den.
              </p>
              <div className="rounded-lg border bg-card p-3 space-y-2">
                <p className="text-foreground font-medium">Slik beregnes scoren</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><span className="text-foreground font-medium">Besvarte kontrollpunkter</span> teller mest — særlig de som er bekreftet med dokumentasjon (Verifisert).</li>
                  <li><span className="text-foreground font-medium">Delvis dokumentert</span> teller halvt.</li>
                  <li><span className="text-foreground font-medium">Ikke besvart</span> trekker scoren ned.</li>
                  <li><span className="text-foreground font-medium">«Ikke relevant»</span> tas ut av grunnlaget og påvirker ikke scoren.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                <p className="text-foreground font-medium">Per kontrollområde</p>
                <p className="text-xs">
                  Hvert regelverk har en samlet score og en score per kontrollområde
                  (Styring, Drift og sikkerhet, Identitet og tilgang, Leverandører og økosystem, Personvern).
                  Slik ser du raskt hvor det største løftet ligger.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-success" /> Grønn ≥ 75% &nbsp;
                <span className="h-2 w-2 rounded-full bg-warning" /> Gul 50–74% &nbsp;
                <span className="h-2 w-2 rounded-full bg-destructive" /> Rød &lt; 50%
              </div>
            </div>
          ),
          actions: [
            { icon: CheckCircle2, title: "Svar ut et kontrollpunkt", description: "Gå til et aktivt regelverk og besvar neste åpne kontrollpunkt.", onClick: () => navigate("/regulations") },
            { icon: FileText, title: "Last opp et dokument", description: "Lara analyserer dokumentet og foreslår hvilke kontrollpunkter det dekker.", onClick: () => navigate("/documents") },
            { icon: RefreshCw, title: "Oppdater status", description: "Synkroniser scoren med siste svar og dokumentasjon.", onClick: () => { toast({ title: "Oppdaterer...", description: "Scoren beregnes på nytt." }); } },
          ],
          laraSuggestions: [
            { label: "Hvorfor er scoren min 72 %?", message: "Hvorfor er den samlede scoren min på regelverk akkurat det den er, og hva trekker mest ned?" },
            { label: "Vis hvilke kontrollpunkter som mangler dokumentasjon", message: "Vis meg hvilke kontrollpunkter som mangler dokumentasjon, sortert etter hvor mye de trekker ned scoren." },
            { label: "Hva betyr Verifisert?", message: "Hva skal til for at et kontrollpunkt regnes som Verifisert i scoren?" },
            { label: "Hvordan øker jeg scoren raskest?", message: "Foreslå de 3 tiltakene som vil løfte scoren min mest, basert på hva som mangler i dag." },
          ],
        }}
      />
    </div>
  );
};

export default Regulations;
