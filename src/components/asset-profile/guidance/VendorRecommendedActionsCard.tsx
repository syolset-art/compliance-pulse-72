import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FileText, ListChecks, ListPlus, Info, ArrowRight, Sparkles, ShieldCheck, BellRing, Users } from "lucide-react";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { cn } from "@/lib/utils";
import {
  CRITICALITY_STYLE,
  type VendorFrameworkAction,
} from "@/lib/vendorFrameworkSuggestions";
import {
  INTERVAL_LABEL,
  coversDocumentType,
  type AgenticTrustCenterState,
} from "@/lib/agenticTrustCenter";
import { toast } from "sonner";
import {
  NOT_REQUESTED_LABEL,
  SOURCING_METHOD_META,
  VENDOR_ARCHETYPES,
  archetypeByKey,
  readSourcingState,
  recommendSourcingMethod,
  writeSourcingState,
  type SourcingMethod,
  type VendorArchetype,
} from "@/lib/vendorSourcingMethod";

interface Props {
  /** Brukes til å lagre valgt innhentingsmetode per leverandør. */
  assetId: string;
  actions: VendorFrameworkAction[];
  onRequestDocumentation: (action: VendorFrameworkAction) => void;
  onCreateActivity: (action: VendorFrameworkAction) => void;
  onCreateVendorActivity: () => void;
  /** Agentisk Trust Center — status og handlinger. */
  trustCenter: AgenticTrustCenterState;
  onInviteTrustCenter: () => void;
  onOpenTrustCenter: () => void;
  onRemindTrustCenter: () => void;
}


/**
 * Anbefalte tiltak — kompakt dashbord-visning.
 * Kortet viser status for Agentisk Trust Profile. Hele listen med
 * handlinger åpnes i et arbeidsvindu slik at kortet ikke tar plass i profilen.
 */
export function VendorRecommendedActionsCard({
  assetId,
  actions,
  onRequestDocumentation,
  onCreateActivity,
  onCreateVendorActivity,
  trustCenter,
  onInviteTrustCenter,
  onOpenTrustCenter,
  onRemindTrustCenter,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [workOpen, setWorkOpen] = useState(false);

  // Innhentingsmetode — Lara anbefaler ut fra mandat og offentlig fotavtrykk.
  const [sourcing, setSourcing] = useState(() => readSourcingState(assetId));
  const recommendation = recommendSourcingMethod(archetypeByKey(sourcing.archetype).signals);
  const primaryMethod = SOURCING_METHOD_META[recommendation.primary];

  const selectArchetype = (archetype: VendorArchetype) => {
    const next = { ...sourcing, archetype };
    setSourcing(next);
    writeSourcingState(assetId, next);
  };

  const startSourcing = (method: SourcingMethod) => {
    if (method === "vendor_agentic") {
      onInviteTrustCenter();
      return;
    }
    const next = { ...sourcing, method, startedAt: new Date().toISOString() };
    setSourcing(next);
    writeSourcingState(assetId, next);
    toast.success(
      method === "public_harvest"
        ? isNb
          ? "Lara kartlegger offentlige kilder"
          : "Lara is mapping public sources"
        : isNb
          ? "Forespørsel sendt på e-post"
          : "Email request sent",
    );
  };

  const criticalCount = actions.filter((a) => a.criticality === "kritisk").length;

  const hasTrustCenter = trustCenter.status !== "none";
  const delivered = trustCenter.deliveredCount ?? 0;
  const requested = trustCenter.requestedDocumentTypes.length;


  const trustCenterBlock = (
    <div
      className={cn(
        "rounded-lg border p-3",
        hasTrustCenter ? "border-success/30 bg-success/5" : "border-primary/25 bg-primary/5",
      )}
    >
      {hasTrustCenter ? (
        <>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground">
                {trustCenter.status === "active"
                  ? isNb
                    ? "Agentisk Trust Profile aktiv"
                    : "Agentic Trust Profile active"
                  : isNb
                    ? "Leverandøren er invitert til Agentisk Trust Profile"
                    : "Vendor invited to Agentic Trust Profile"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {delivered} {isNb ? "av" : "of"} {requested}{" "}
                {isNb ? "dokumenter levert" : "documents delivered"}
                {" · "}
                {isNb ? INTERVAL_LABEL[trustCenter.interval].nb : INTERVAL_LABEL[trustCenter.interval].en}
                {trustCenter.deliveryMethod === "mcp" && (
                  <span className="ml-1.5 inline-flex items-center rounded border border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                    MCP
                  </span>
                )}
              </p>
              {trustCenter.deliveryMethod === "mcp" && trustCenter.status === "invited" && (
                <p className="text-[11px] text-primary mt-0.5">
                  {isNb
                    ? "MCP-kobling er planlagt — leverandøren laster opp manuelt inntil videre."
                    : "MCP connection is planned — the vendor uploads manually for now."}
                </p>
              )}
              {trustCenter.contacts.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                  <Users className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {trustCenter.contacts.map((c) => c.name || c.email).join(", ")}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={onOpenTrustCenter}>
              {isNb ? "Åpne trust profile" : "Open trust profile"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onRemindTrustCenter}>
              <BellRing className="h-3 w-3 mr-1" />
              {isNb ? "Purr" : "Remind"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onInviteTrustCenter}>
              {isNb ? "Endre kontaktpersoner" : "Edit contacts"}
            </Button>
          </div>
        </>
      ) : sourcing.method ? (
        <>
          {/* Innhenting er i gang — vis metode og bevisnivå */}
          <p className="text-[13px] text-foreground leading-relaxed">
            {isNb
              ? SOURCING_METHOD_META[sourcing.method].label.nb
              : SOURCING_METHOD_META[sourcing.method].label.en}
            {" · "}
            {isNb
              ? SOURCING_METHOD_META[sourcing.method].evidenceLabel.nb
              : SOURCING_METHOD_META[sourcing.method].evidenceLabel.en}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onInviteTrustCenter}>
              <Sparkles className="h-3 w-3 mr-1" />
              {isNb ? "Inviter til Agentisk Trust Profile" : "Invite to Agentic Trust Profile"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCreateVendorActivity}>
              <ListPlus className="h-3 w-3 mr-1" />
              {isNb ? "Opprett aktivitet" : "Create activity"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[13px] text-foreground leading-relaxed">
            {isNb ? NOT_REQUESTED_LABEL.nb : NOT_REQUESTED_LABEL.en}
          </p>


          {/* Leverandør-arketype — styrer signalene Lara vurderer (prototype) */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground mr-0.5">
              {isNb ? "Leverandørtype:" : "Vendor type:"}
            </span>
            {VENDOR_ARCHETYPES.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => selectArchetype(a.key)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                  a.key === sourcing.archetype
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {a.name}
              </button>
            ))}
          </div>

          <div className="mt-2 rounded-md border border-border bg-background/60 p-2.5">
            <p className="text-[11px] text-muted-foreground">
              {isNb ? archetypeByKey(sourcing.archetype).hint.nb : archetypeByKey(sourcing.archetype).hint.en}
            </p>
            <p className="text-[12px] text-foreground mt-1 leading-relaxed">
              {isNb ? recommendation.rationale.nb : recommendation.rationale.en}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isNb ? "Bevisnivå: " : "Evidence level: "}
              {isNb ? primaryMethod.evidenceLabel.nb : primaryMethod.evidenceLabel.en}
              {" · "}
              {isNb ? primaryMethod.vendorEffortLabel.nb : primaryMethod.vendorEffortLabel.en}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => startSourcing(recommendation.primary)}>
              <Sparkles className="h-3 w-3 mr-1" />
              {isNb ? primaryMethod.cta.nb : primaryMethod.cta.en}
            </Button>
            {recommendation.alternative && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => startSourcing(recommendation.alternative!)}
              >
                {isNb
                  ? SOURCING_METHOD_META[recommendation.alternative].cta.nb
                  : SOURCING_METHOD_META[recommendation.alternative].cta.en}
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCreateVendorActivity}>
              <ListPlus className="h-3 w-3 mr-1" />
              {isNb ? "Opprett aktivitet" : "Create activity"}
            </Button>
          </div>

        </>
      )}
    </div>
  );

  return (
    <>
      <Card className="p-4 flex flex-col">
        <div className="flex items-center gap-2">
          <LaraAvatar size={24} />
          <h3 className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">
            {isNb ? "Anbefalte tiltak" : "Recommended actions"}
          </h3>
        </div>

        {/* Agentisk Trust Center — kontinuerlig oppdatert dokumentasjon */}
        <div className="mt-3">{trustCenterBlock}</div>

        {actions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-7 text-xs self-start"
            onClick={() => setWorkOpen(true)}
          >
            {isNb ? "Åpne arbeidsvindu" : "Open work panel"}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </Card>


      {/* Arbeidsvindu — full liste med handlinger */}
      <Sheet open={workOpen} onOpenChange={setWorkOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isNb ? "Anbefalte tiltak" : "Recommended actions"}</SheetTitle>
            <SheetDescription>
              {isNb
                ? `${actions.length} tiltak · ${criticalCount} kritiske — utledet av regelverkene leverandøren skal etterleve.`
                : `${actions.length} actions · ${criticalCount} critical — derived from the vendor's frameworks.`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4">{trustCenterBlock}</div>


          <div className="mt-4 space-y-2 pb-8">
            {actions.map((a) => {
              const crit = CRITICALITY_STYLE[a.criticality];
              return (
                <div
                  key={a.id}
                  className="rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground">
                        {isNb ? a.titleNb : a.titleEn}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isNb ? "Dekker" : "Covers"}: {a.requirement}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          crit.className,
                        )}
                      >
                        {isNb ? crit.nb : crit.en}
                      </span>
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0} className="text-muted-foreground cursor-help">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[280px] text-xs leading-relaxed">
                            {isNb ? a.reasonNb : a.reasonEn}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {a.documentType &&
                      (coversDocumentType(trustCenter, a.documentType) ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                          <ShieldCheck className="h-3 w-3" />
                          {isNb ? "Via Trust Profile" : "Via Trust Profile"}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => onRequestDocumentation(a)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {isNb ? "Be om dokumentasjon" : "Request documentation"}
                        </Button>
                      ))}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-primary"
                      onClick={() => onCreateActivity(a)}
                    >
                      <ListChecks className="h-3 w-3 mr-1" />
                      {isNb ? "Opprett aktivitet" : "Create activity"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
