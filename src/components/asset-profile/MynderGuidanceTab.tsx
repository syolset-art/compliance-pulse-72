import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { LaraRecommendationBanner } from "@/components/lara/LaraRecommendationBanner";
import { AssetMaturityByDomainCard } from "@/components/asset-profile/AssetMaturityByDomainCard";
import { VendorActivityTab } from "@/components/asset-profile/tabs/VendorActivityTab";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { RequestUpdateDialog } from "@/components/asset-profile/RequestUpdateDialog";
import { DocumentRequestsSection } from "@/components/asset-profile/tabs/DocumentRequestsSection";
import { VendorFrameworkCard } from "@/components/asset-profile/guidance/VendorFrameworkCard";
import { VendorRecommendedActionsCard } from "@/components/asset-profile/guidance/VendorRecommendedActionsCard";
import { InviteAgenticTrustCenterDialog } from "@/components/asset-profile/guidance/InviteAgenticTrustCenterDialog";
import { CreateVendorActivityDialog } from "@/components/asset-profile/guidance/CreateVendorActivityDialog";
import { RequestBaselineDialog } from "@/components/asset-profile/guidance/RequestBaselineDialog";
import {
  inferVendorSignals,
  readSourcingState,
  recommendSourcingMethod,
  writeSourcingState,
  SOURCING_METHOD_META,
  type SourcingMethod,
} from "@/lib/vendorSourcingMethod";
import {
  readTrustCenterState,
  writeTrustCenterState,
  trustCenterLink,
} from "@/lib/agenticTrustCenter";
import { AddFrameworkDialog } from "@/components/msp/guidance/AddFrameworkDialog";
import { MaturityHistoryChart } from "@/components/trust-controls/MaturityHistoryChart";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import type { LaraPlanTask } from "@/components/lara/types";
import {
  generateGuidanceForVendor,
  type SuggestedActivity,
} from "@/utils/vendorGuidanceData";
import {
  deriveVendorActions,
  deriveVendorFrameworks,
  fallbackActionFor,
  frameworkById,
  readFrameworkState,
  writeFrameworkState,
  type VendorFramework,
  type VendorFrameworkAction,
} from "@/lib/vendorFrameworkSuggestions";
import type { VendorActivity } from "@/utils/vendorActivityData";

interface Props {
  assetId: string;
  assetName?: string;
  baselinePercent?: number;
  enrichmentPercent?: number;
  externalActivities?: VendorActivity[];
  dismissedSuggestionIds: string[];
  onActivitySaved: (activity: VendorActivity, fromSuggestion?: SuggestedActivity) => void;
  /** Kontekst Lara bruker for å foreslå regelverk. */
  vendorType?: string | null;
  industry?: string | null;
  country?: string | null;
  criticality?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
}

export function MynderGuidanceTab({
  assetId,
  assetName,
  baselinePercent,
  enrichmentPercent,
  externalActivities,
  dismissedSuggestionIds,
  onActivitySaved,
  vendorType,
  industry,
  country,
  criticality,
  contactPerson,
  contactEmail,
}: Props) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const isNb = i18n.language === "nb";

  const guidance = useMemo(() => generateGuidanceForVendor(assetId), [assetId]);
  const [locallyDismissed, setLocallyDismissed] = useState<string[]>([]);
  const [activePrefill, setActivePrefill] = useState<SuggestedActivity | null>(null);

  // ── Regelverk leverandøren skal etterleve ──

  const laraFrameworks = useMemo(
    () =>
      deriveVendorFrameworks({
        id: assetId,
        name: assetName,
        vendorType,
        industry,
        country,
        criticality,
      }),
    [assetId, assetName, vendorType, industry, country, criticality],
  );

  const [fwState, setFwState] = useState(() => readFrameworkState(assetId));
  useEffect(() => setFwState(readFrameworkState(assetId)), [assetId]);

  const updateFwState = (next: typeof fwState) => {
    setFwState(next);
    writeFrameworkState(assetId, next);
  };

  const frameworks: VendorFramework[] = useMemo(() => {
    const base = laraFrameworks.filter((f) => !fwState.removed.includes(f.id));
    const extra = fwState.added.filter((f) => !base.some((b) => b.id === f.id));
    return [...base, ...extra];
  }, [laraFrameworks, fwState]);

  const actions: VendorFrameworkAction[] = useMemo(() => {
    const known = frameworks.filter((f) => frameworkById(f.id));
    const unknown = frameworks.filter((f) => !frameworkById(f.id));
    return [...deriveVendorActions(known), ...unknown.map(fallbackActionFor)];
  }, [frameworks]);

  const [addFrameworkOpen, setAddFrameworkOpen] = useState(false);
  const [docRequestType, setDocRequestType] = useState<string | null>(null);

  // ── Agentisk Trust Center ──
  const [trustCenter, setTrustCenter] = useState(() => readTrustCenterState(assetId));
  useEffect(() => setTrustCenter(readTrustCenterState(assetId)), [assetId]);
  const [inviteTrustCenterOpen, setInviteTrustCenterOpen] = useState(false);
  const [createActivityOpen, setCreateActivityOpen] = useState(false);

  // ── Innhenting av grunnlag ──
  // Ny leverandør uten etterspurt grunnlag: første steg er å be om det.
  const [sourcing, setSourcing] = useState(() => readSourcingState(assetId));
  useEffect(() => setSourcing(readSourcingState(assetId)), [assetId]);
  const [requestBaselineOpen, setRequestBaselineOpen] = useState(false);
  const needsBaseline = !sourcing.method && trustCenter.status === "none";

  const updateSourcing = (next: typeof sourcing) => {
    setSourcing(next);
    writeSourcingState(assetId, next);
  };

  const startSourcing = (method: SourcingMethod) => {
    if (method === "vendor_agentic") {
      setInviteTrustCenterOpen(true);
      return;
    }
    updateSourcing({ ...sourcing, method, startedAt: new Date().toISOString() });
    toast({
      title:
        method === "public_harvest"
          ? isNb
            ? "Lara kartlegger offentlige kilder"
            : "Lara is mapping public sources"
          : isNb
            ? "Forespørsel sendt på e-post"
            : "Email request sent",
      description: isNb
        ? "Lara forbereder utkast til vurdering når grunnlaget kommer inn."
        : "Lara drafts the assessment once the evidence arrives.",
    });
  };

  // Laras utledning av leverandørtype — ingen manuell velger.
  const inferred = useMemo(
    () => inferVendorSignals({ name: assetName, vendorType, industry, country, criticality }),
    [assetName, vendorType, industry, country, criticality],
  );
  const baselineRecommendation = useMemo(
    () => recommendSourcingMethod(inferred.signals),
    [inferred],
  );
  const baselineTasks: LaraPlanTask[] = useMemo(() => {
    const method = SOURCING_METHOD_META[baselineRecommendation.primary];
    const name = assetName ?? (isNb ? "leverandøren" : "the vendor");
    return [
      {
        id: `baseline-${assetId}`,
        severity: "high",
        title: isNb ? `Vi mangler grunnlag fra ${name}` : `We are missing evidence from ${name}`,
        category: isNb ? inferred.segment.nb : inferred.segment.en,
        insight: isNb
          ? `${baselineRecommendation.rationale.nb} Lara forbereder utkast til vurdering automatisk når grunnlaget er hentet inn — du beslutter.`
          : `${baselineRecommendation.rationale.en} Lara drafts the assessment automatically once the evidence is in — you decide.`,
        primaryCtaLabelNb: method.cta.nb,
        primaryCtaLabelEn: method.cta.en,
        secondaryCtaLabelNb: "Se alle innhentingsmetoder",
        secondaryCtaLabelEn: "See all sourcing methods",
        readMoreCtaLabelNb: "Last opp dokumentasjon jeg allerede har",
        readMoreCtaLabelEn: "Upload documentation I already have",
      },
    ];
  }, [assetId, assetName, baselineRecommendation, inferred, isNb]);

  const openDocRequest = (action: VendorFrameworkAction) =>
    setDocRequestType(action.documentType ?? "general");



  const createActivityFromAction = (action: VendorFrameworkAction) => {
    setActivePrefill({
      id: `fw-${action.id}`,
      gapId: action.frameworkId,
      titleNb: action.titleNb,
      titleEn: action.titleEn,
      descriptionNb: action.reasonNb,
      descriptionEn: action.reasonEn,
      reasonNb: action.reasonNb,
      reasonEn: action.reasonEn,
      statusNoteNb: `Dekker ${action.requirement}`,
      statusNoteEn: `Covers ${action.requirement}`,
      status: "open",
      criticality: action.criticality,
      level: "taktisk",
      themeNb: action.frameworkLabel,
      themeEn: action.frameworkLabel,
      suggestedType: action.documentType ? "document" : "review",
      suggestedPhase: "ongoing",
    });
  };


  const [showActivityLog, setShowActivityLog] = useState(() => {
    try {
      return localStorage.getItem('mynder_show_activity_log') === 'true';
    } catch {
      return false;
    }
  });

  const toggleActivityLog = () => {
    const next = !showActivityLog;
    setShowActivityLog(next);
    try {
      localStorage.setItem('mynder_show_activity_log', String(next));
    } catch {}
  };

  const allDismissed = useMemo(
    () => [...dismissedSuggestionIds, ...locallyDismissed],
    [dismissedSuggestionIds, locallyDismissed]
  );

  const visibleSuggestions = useMemo(
    () => guidance.suggestions.filter(s => !allDismissed.includes(s.id)),
    [guidance.suggestions, allDismissed]
  );

  // Plan-tasks for Lara-banneret — beholdes som inngangspunkt til neste handling.
  const planTasks: LaraPlanTask[] = useMemo(() => {
    return visibleSuggestions.map(s => {
      const sev: LaraPlanTask["severity"] =
        s.criticality === "kritisk" ? "critical" :
        s.criticality === "hoy" ? "high" : "medium";
      return {
        id: s.id,
        severity: sev,
        title: isNb ? s.titleNb : s.titleEn,
        category: isNb ? s.themeNb : s.themeEn,
        insight: isNb ? s.statusNoteNb : s.statusNoteEn,
        primaryCtaLabelNb: "Opprett aktivitet",
        primaryCtaLabelEn: "Create activity",
      };
    });
  }, [visibleSuggestions, isNb]);

  const planCriticalCount = planTasks.filter(t => t.severity === "critical").length;

  const handleSubmit = (activity: VendorActivity) => {
    onActivitySaved(activity, activePrefill ?? undefined);
    setActivePrefill(null);
    if (activePrefill) {
      setLocallyDismissed(prev => [...prev, activePrefill.id]);
      toast({
        title: isNb ? "Aktivitet opprettet" : "Activity created",
        description: isNb ? "Lagt til i aktivitetsloggen under." : "Added to the activity log below.",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Ingen grunnlag etterspurt ennå — vises i samme Lara-banner som ellers */}
      {needsBaseline && (
        <LaraRecommendationBanner
          totalCount={1}
          criticalCount={0}
          tasks={baselineTasks}
          hideDismiss
          onPrimaryAction={() => startSourcing(baselineRecommendation.primary)}
          onSecondaryAction={() => setRequestBaselineOpen(true)}
          onReadMore={() => setDocRequestType("general")}
        />
      )}

      {/* Lara-anbefalingsbanner — samme komponent som dashbordet */}
      {!needsBaseline && planTasks.length > 0 && (
        <LaraRecommendationBanner
          totalCount={planTasks.length}
          criticalCount={planCriticalCount}
          tasks={planTasks}
          hideDismiss
          onPrimaryAction={(t) => {
            const s = visibleSuggestions.find(x => x.id === t.id);
            if (s) setActivePrefill(s);
          }}
        />
      )}

      {/* Regelverk + tiltak — Laras kobling mellom krav og handling */}
      <div className={needsBaseline ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
        <VendorFrameworkCard
          frameworks={frameworks}
          onAdd={() => setAddFrameworkOpen(true)}
          onRemove={(id) =>
            updateFwState({
              added: fwState.added.filter((f) => f.id !== id),
              removed: fwState.removed.includes(id) ? fwState.removed : [...fwState.removed, id],
            })
          }
        />
        {!needsBaseline && (
          <VendorRecommendedActionsCard
            assetId={assetId}
            signals={inferred.signals}
            segmentLabel={isNb ? inferred.segment.nb : inferred.segment.en}
            actions={actions}
            onRequestDocumentation={openDocRequest}
            onCreateActivity={createActivityFromAction}
            onCreateVendorActivity={() => setCreateActivityOpen(true)}
            trustCenter={trustCenter}
            onInviteTrustCenter={() => setInviteTrustCenterOpen(true)}
            onOpenTrustCenter={() => {
              const link = trustCenter.link ?? trustCenterLink(assetId);
              window.open(link, "_blank", "noopener");
            }}
            onRemindTrustCenter={() => {
              const next = { ...trustCenter, remindedAt: new Date().toISOString() };
              setTrustCenter(next);
              writeTrustCenterState(assetId, next);
              toast({
                title: isNb ? "Påminnelse sendt" : "Reminder sent",
                description: isNb
                  ? "Lara har purret kontaktpersonene hos leverandøren."
                  : "Lara reminded the vendor contacts.",
              });
            }}
          />
        )}

      </div>

      {/* Aktive dokumentasjonsforespørsler */}
      <DocumentRequestsSection assetId={assetId} />



      {/* Standard Trust Profile-blokk: modenhet per kontrollområde */}
      <AssetMaturityByDomainCard assetId={assetId} />

      {/* Tidslinje: aktiviteter over tid og påvirkning på modenhet */}
      <Card className="border-primary/20">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Modenhetsutvikling drevet av aktiviteter" : "Maturity driven by activities"}
              </h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {isNb
                  ? "Hver markør på linjen er en aktivitet fra loggen under. Tiltak hever modenhet, hendelser senker den."
                  : "Each marker on the line is an activity from the log below. Actions raise maturity, incidents lower it."}
              </p>
            </div>
          </div>

          <MaturityHistoryChart
            assetId={assetId}
            baselinePercent={baselinePercent ?? 40}
            enrichmentPercent={enrichmentPercent ?? 20}
          />

          <div className="flex items-center gap-2 pt-3 border-t border-border/60 text-[12px] text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            <span>
              {isNb
                ? "Se detaljer i aktivitetsloggen."
                : "See details in the activity log."}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Aktivitetslogg — skjult som standard, brukeren velger selv */}
      <div className="border rounded-lg bg-card">
        <button
          type="button"
          onClick={toggleActivityLog}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            {isNb ? "Aktivitetslogg" : "Activity log"}
          </div>
          {showActivityLog ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showActivityLog && (
          <div className="px-4 pb-4">
            <VendorActivityTab
              assetId={assetId}
              assetName={assetName ?? ""}
              baselinePercent={baselinePercent}
              enrichmentPercent={enrichmentPercent}
              externalActivities={externalActivities}
            />
          </div>
        )}
      </div>

      {/* Manuell aktivitetsdialog — åpnes fra Lara-banneret */}
      <RegisterActivityDialog
        assetId={assetId}
        open={!!activePrefill}
        onOpenChange={(o) => { if (!o) setActivePrefill(null); }}
        prefillFromGuidance={activePrefill ?? undefined}
        onSubmit={handleSubmit}
        hideTrigger
      />

      {/* Dokumentasjonsforespørsel — forhåndsvalgt type fra tiltaket */}
      <RequestUpdateDialog
        open={!!docRequestType}
        onOpenChange={(o) => { if (!o) setDocRequestType(null); }}
        assetId={assetId}
        assetName={assetName ?? ""}
        preselectedType={docRequestType ?? undefined}
        contactPerson={contactPerson ?? null}
        contactEmail={contactEmail ?? null}
      />

      {/* Opprett aktivitet — velg hvordan dokumentasjonen skaffes */}
      {/* Be om grunnlag — velg innhentingsmetode */}
      <RequestBaselineDialog
        open={requestBaselineOpen}
        onOpenChange={setRequestBaselineOpen}
        vendorName={assetName ?? (isNb ? "leverandøren" : "the vendor")}
        signals={inferred.signals}
        segmentLabel={isNb ? inferred.segment.nb : inferred.segment.en}
        onConfirm={startSourcing}
        onUploadExisting={() => setDocRequestType("general")}
      />

      <CreateVendorActivityDialog
        open={createActivityOpen}
        onOpenChange={setCreateActivityOpen}
        vendorName={assetName ?? ""}
        actions={actions}
        onRequestDocumentation={() => setDocRequestType("general")}
        onRegisterManualActivity={() => {
          const first = actions[0];
          if (first) createActivityFromAction(first);
        }}
        onInviteTrustProfile={() => setInviteTrustCenterOpen(true)}
      />

      {/* Agentisk Trust Center — kontinuerlig oppdatert dokumentasjon fra leverandøren */}
      <InviteAgenticTrustCenterDialog
        open={inviteTrustCenterOpen}
        onOpenChange={setInviteTrustCenterOpen}
        assetId={assetId}
        vendorName={assetName ?? ""}
        actions={actions}
        contactPerson={contactPerson ?? null}
        contactEmail={contactEmail ?? null}
        onSaved={setTrustCenter}
      />



      {/* Legg til eget regelverk, standard eller retningslinje */}
      <AddFrameworkDialog
        open={addFrameworkOpen}
        onOpenChange={setAddFrameworkOpen}
        activatedLabels={[]}
        existingIds={frameworks.map((f) => f.id)}
        onAdd={(item) => {
          const id = item.frameworkId ?? item.id;
          updateFwState({
            added: [
              ...fwState.added,
              {
                id,
                label: item.label,
                confidence: "medium",
                reasonNb: "Lagt til av deg — ikke foreslått av Lara.",
                reasonEn: "Added by you — not suggested by Lara.",
                manual: true,
              },
            ],
            removed: fwState.removed.filter((r) => r !== id),
          });
        }}
      />
    </div>

  );
}
