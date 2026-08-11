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
import { FileText, ListChecks, Send, Info, ArrowRight, Sparkles, ShieldCheck, BellRing, Users } from "lucide-react";
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

interface Props {
  actions: VendorFrameworkAction[];
  onRequestDocumentation: (action: VendorFrameworkAction) => void;
  onCreateActivity: (action: VendorFrameworkAction) => void;
  onRequestAllMissing: () => void;
  /** Agentisk Trust Center — status og handlinger. */
  trustCenter: AgenticTrustCenterState;
  onInviteTrustCenter: () => void;
  onOpenTrustCenter: () => void;
  onRemindTrustCenter: () => void;
}


/**
 * Anbefalte tiltak — kompakt dashbord-visning.
 * Kortet viser bare nøkkeltall og de mest kritiske tiltakene. Hele listen med
 * handlinger åpnes i et arbeidsvindu slik at kortet ikke tar plass i profilen.
 */
export function VendorRecommendedActionsCard({
  actions,
  onRequestDocumentation,
  onCreateActivity,
  onRequestAllMissing,
  trustCenter,
  onInviteTrustCenter,
  onOpenTrustCenter,
  onRemindTrustCenter,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [workOpen, setWorkOpen] = useState(false);

  const criticalCount = actions.filter((a) => a.criticality === "kritisk").length;
  const docCount = actions.filter((a) => a.documentType).length;
  const top = actions.slice(0, 3);

  const hasTrustCenter = trustCenter.status !== "none";
  const delivered = trustCenter.deliveredCount ?? 0;
  const requested = trustCenter.requestedDocumentTypes.length;

  const stat = (value: number, labelNb: string, labelEn: string, tone?: string) => (
    <div className="min-w-0">
      <p className={cn("text-xl font-semibold leading-none", tone ?? "text-foreground")}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1 truncate">{isNb ? labelNb : labelEn}</p>
    </div>
  );

  /** Primær-CTA: kontinuerlig dokumentasjon via Agentisk Trust Center. */
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
                    ? "Agentisk Trust Center aktivt"
                    : "Agentic Trust Center active"
                  : isNb
                    ? "Leverandøren er invitert til Agentisk Trust Center"
                    : "Vendor invited to Agentic Trust Center"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {delivered} {isNb ? "av" : "of"} {requested}{" "}
                {isNb ? "dokumenter levert" : "documents delivered"}
                {" · "}
                {isNb ? INTERVAL_LABEL[trustCenter.interval].nb : INTERVAL_LABEL[trustCenter.interval].en}
              </p>
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
              {isNb ? "Åpne trust center" : "Open trust center"}
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
      ) : (
        <>
          <p className="text-[13px] text-foreground leading-relaxed">
            {isNb
              ? "Leverandøren mangler Agentisk Trust Center — dokumentasjon må etterspørres manuelt."
              : "This vendor has no Agentic Trust Center — documentation must be requested manually."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={onInviteTrustCenter}>
              <Sparkles className="h-3 w-3 mr-1" />
              {isNb ? "Inviter til Agentisk Trust Center" : "Invite to Agentic Trust Center"}
            </Button>
            {docCount > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onRequestAllMissing}>
                <Send className="h-3 w-3 mr-1" />
                {isNb ? "Be om alt" : "Request all"}
              </Button>
            )}
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

        {/* Nøkkeltall — dashbord, ikke liste */}
        <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          {stat(actions.length, "tiltak", "actions")}
          {stat(criticalCount, "kritiske", "critical", criticalCount > 0 ? "text-destructive" : undefined)}
          {stat(docCount, "mangler dok.", "missing docs")}
        </div>

        {/* Agentisk Trust Center — kontinuerlig oppdatert dokumentasjon */}
        <div className="mt-3">{trustCenterBlock}</div>

        {/* De viktigste tiltakene, én linje hver */}
        <ul className="mt-3 space-y-1.5">
          {actions.length === 0 && (
            <li className="text-xs text-muted-foreground">
              {isNb
                ? "Legg til et regelverk til venstre, så foreslår Lara tiltak her."
                : "Add a framework on the left and Lara will suggest actions here."}
            </li>
          )}
          {top.map((a) => (
            <li key={a.id} className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  a.criticality === "kritisk"
                    ? "bg-destructive"
                    : a.criticality === "hoy"
                      ? "bg-warning"
                      : "bg-muted-foreground/50",
                )}
              />
              <span className="text-[13px] text-foreground truncate flex-1 min-w-0">
                {isNb ? a.titleNb : a.titleEn}
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0">{a.requirement}</span>
            </li>
          ))}
        </ul>

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
                          {isNb ? "Via Trust Center" : "Via Trust Center"}
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
