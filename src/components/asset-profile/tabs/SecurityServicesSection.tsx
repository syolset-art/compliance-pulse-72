import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield, CheckCircle, XCircle, HelpCircle, Lock,
  ChevronDown, ChevronUp, Package, ListChecks, Lightbulb, Zap, CloudCog, ShoppingCart,
  Award, ExternalLink, RefreshCw, Clock, Send, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SECURITY_SERVICE_CATALOG,
  evaluateServiceCoverage,
  ServiceCoverageResult,
  AcronisModule,
  MSPProduct,
  SecurityServiceCategory,
  MSP_PARTNER_DIRECTORY,
  MSPPartnerInfo,
} from "@/lib/securityServiceCatalog";
import { ActivateServiceDialog } from "./ActivateAcronisServiceDialog";
import { RequestQuoteDialog } from "./RequestQuoteDialog";
import { format } from "date-fns";
import { nb, enUS } from "date-fns/locale";
import { useActivatedServices } from "@/hooks/useActivatedServices";
import { useTranslation } from "react-i18next";

type ActivatableProduct =
  | { type: "acronis"; product: AcronisModule }
  | { type: "msp-product"; product: MSPProduct };

interface ActivatedServiceInfo {
  activatedBy: string;
  activatedAt: Date;
}

interface SecurityServicesSectionProps {
  isSelfProfile?: boolean;
  assessmentResponses?: Record<string, string> | null;
}

function PartnerBanner({ partner, isOverride, onReset, isNb }: { partner: MSPPartnerInfo; isOverride?: boolean; onReset?: () => void; isNb: boolean }) {
  return (
    <div className="rounded-lg border border-warning/20 dark:border-warning bg-warning/10/50 dark:bg-amber-950/20 p-3 flex items-start gap-3">
      <div className="h-9 w-9 rounded-full bg-warning/10 dark:bg-warning/50 flex items-center justify-center shrink-0">
        <Award className="h-5 w-5 text-warning dark:text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{partner.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{isNb ? partner.description : partner.descriptionEn}</p>
        <div className="flex items-center gap-3 mt-1">
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {isNb ? `Besøk ${partner.name}` : `Visit ${partner.name}`} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {isOverride && onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> {isNb ? "Tilbakestill til standard" : "Reset to default"}
            </button>
          )}
        </div>
      </div>
      <Badge className="bg-warning/10 dark:bg-warning/50 text-warning dark:text-warning border-warning/20 dark:border-warning text-[13px] shrink-0">
        {isOverride ? (isNb ? "Valgt for tjeneste" : "Selected for service") : (isNb ? "MSP-partner" : "MSP partner")}
      </Badge>
    </div>
  );
}

function ActivationInfo({ info, isNb }: { info: ActivatedServiceInfo; isNb: boolean }) {
  return (
    <p className="text-[13px] text-muted-foreground mt-0.5">
      {isNb ? "Aktivert av" : "Activated by"} {info.activatedBy} — {format(info.activatedAt, "d. MMM yyyy", { locale: isNb ? nb : enUS })}
    </p>
  );
}

function AcronisModuleCard({
  module,
  activationInfo,
  isQuoteRequested,
  onRequestQuote,
  onActivate,
  isNb,
}: {
  module: AcronisModule;
  activationInfo: ActivatedServiceInfo | null;
  isQuoteRequested: boolean;
  onRequestQuote: () => void;
  onActivate: () => void;
  isNb: boolean;
}) {
  const active = module.isActive || !!activationInfo;

  return (
    <div className={cn(
      "rounded-md border px-3 py-2 transition-all",
      active
        ? "border-status-closed/20 dark:border-status-closed bg-status-closed/10/50 dark:bg-green-950/20"
        : isQuoteRequested
        ? "border-warning/20 dark:border-warning bg-warning/10/50 dark:bg-amber-950/20"
        : "border-border bg-background/50 hover:border-primary/30"
    )}>
      <div className="flex items-center gap-3">
        <CloudCog className={cn("h-4 w-4 shrink-0", active ? "text-status-closed dark:text-status-closed" : isQuoteRequested ? "text-warning dark:text-warning" : "text-muted-foreground")} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p className="text-xs font-medium text-foreground truncate">{module.name}</p>
          <Badge variant="outline" className="text-[13px] px-1.5 py-0 shrink-0">{module.acronisPackage}</Badge>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {active ? (
            <Badge className="bg-status-closed/10 dark:bg-status-closed/50 text-status-closed dark:text-status-closed border-status-closed/20 dark:border-status-closed text-[13px] gap-1">
              <CheckCircle className="h-3 w-3" /> {isNb ? "Aktiv" : "Active"}
            </Badge>
          ) : (
            <>
              {isQuoteRequested && (
                <Badge className="bg-warning/10 dark:bg-warning/50 text-warning dark:text-warning border-warning/20 dark:border-warning text-[13px] gap-1">
                  <Clock className="h-3 w-3" /> {isNb ? "Tilbud forespurt" : "Quote requested"}
                </Badge>
              )}
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={onRequestQuote}>
                <FileText className="h-3 w-3" /> {isNb ? "Be om tilbud" : "Request quote"}
              </Button>
              <Button size="sm" className="gap-1 text-xs h-7" onClick={onActivate}>
                <Zap className="h-3 w-3" /> {isNb ? "Aktiver" : "Activate"}
              </Button>
            </>
          )}
        </div>
      </div>
      {active && activationInfo && (
        <div className="ml-7">
          <ActivationInfo info={activationInfo} isNb={isNb} />
        </div>
      )}
    </div>
  );
}

function MSPProductCard({
  product,
  activationInfo,
  isQuoteRequested,
  onRequestQuote,
  onActivate,
  isNb,
}: {
  product: MSPProduct;
  activationInfo: ActivatedServiceInfo | null;
  isQuoteRequested: boolean;
  onRequestQuote: () => void;
  onActivate: () => void;
  isNb: boolean;
}) {
  const isActivated = !!activationInfo;

  return (
    <div className={cn(
      "rounded-md border px-3 py-2 transition-all",
      isActivated
        ? "border-status-closed/20 dark:border-status-closed bg-status-closed/10/50 dark:bg-green-950/20"
        : isQuoteRequested
        ? "border-warning/20 dark:border-warning bg-warning/10/50 dark:bg-amber-950/20"
        : "border-border/60 bg-background/50 hover:border-primary/30"
    )}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
          <span className="text-[13px] text-muted-foreground shrink-0">{product.vendor}</span>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {isActivated ? (
            <Badge className="bg-status-closed/10 dark:bg-status-closed/50 text-status-closed dark:text-status-closed border-status-closed/20 dark:border-status-closed text-[13px] gap-1">
              <CheckCircle className="h-3 w-3" /> {isNb ? "Aktiv" : "Active"}
            </Badge>
          ) : (
            <>
              {isQuoteRequested && (
                <Badge className="bg-warning/10 dark:bg-warning/50 text-warning dark:text-warning border-warning/20 dark:border-warning text-[13px] gap-1">
                  <Clock className="h-3 w-3" /> {isNb ? "Tilbud forespurt" : "Quote requested"}
                </Badge>
              )}
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={onRequestQuote}>
                <FileText className="h-3 w-3" /> {isNb ? "Be om tilbud" : "Request quote"}
              </Button>
              <Button size="sm" className="gap-1 text-xs h-7" onClick={onActivate}>
                <Zap className="h-3 w-3" /> {isNb ? "Aktiver" : "Activate"}
              </Button>
            </>
          )}
        </div>
      </div>
      {isActivated && activationInfo && (
        <div className="ml-0 mt-1">
          <ActivationInfo info={activationInfo} isNb={isNb} />
        </div>
      )}
    </div>
  );
}

function ServiceDetailCard({
  result,
  activatedServices,
  quoteRequestedIds,
  onOpenQuoteDialog,
  onOpenActivateDialog,
  effectivePartner,
  globalPartnerId,
  serviceOverrideId,
  onSetOverride,
  onClearOverride,
  isNb,
}: {
  result: ServiceCoverageResult;
  activatedServices: Record<string, ActivatedServiceInfo>;
  quoteRequestedIds: string[];
  onOpenQuoteDialog: (item: ActivatableProduct, service: SecurityServiceCategory) => void;
  onOpenActivateDialog: (item: ActivatableProduct, service: SecurityServiceCategory) => void;
  effectivePartner: MSPPartnerInfo | null;
  globalPartnerId: string | null;
  serviceOverrideId: string | undefined;
  onSetOverride: (serviceId: string, partnerId: string) => void;
  onClearOverride: (serviceId: string) => void;
  isNb: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showOverrideSelect, setShowOverrideSelect] = useState(false);
  const { service, status } = result;
  const Icon = service.icon;
  const StatusIcon =
    status === "covered" ? CheckCircle :
    status === "missing" ? XCircle : HelpCircle;

  const activeAcronisCount = service.acronisModules.filter(
    (m) => m.isActive || !!activatedServices[m.id]
  ).length;
  const activatedProductCount = service.mspProducts.filter(
    (p) => !!activatedServices[p.id]
  ).length;
  const totalActivated = activeAcronisCount + activatedProductCount;

  const isOverride = !!serviceOverrideId;

  const sName = isNb ? service.name : service.nameEn;
  const sDesc = isNb ? service.description : service.descriptionEn;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        status === "covered" && "border-status-closed/20 dark:border-status-closed bg-status-closed/10 dark:bg-green-950/30",
        status === "missing" && "border-destructive/20 dark:border-destructive bg-destructive/10 dark:bg-red-950/30",
        status === "unknown" && "border-muted bg-muted/30"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0", service.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{sName}</p>
          <p className="text-xs text-muted-foreground">{sDesc}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalActivated > 0 && (
            <Badge variant="outline" className="text-[13px] gap-1 text-status-closed dark:text-status-closed border-status-closed/20 dark:border-status-closed">
              <CheckCircle className="h-3 w-3" />
              {totalActivated} {isNb ? "aktive" : "active"}
            </Badge>
          )}
          <Badge
            variant={status === "covered" ? "default" : status === "missing" ? "destructive" : "outline"}
            className="text-xs"
          >
            {status === "covered" ? (isNb ? "Implementert" : "Implemented") : status === "missing" ? (isNb ? "Mangler" : "Missing") : (isNb ? "Ikke kartlagt" : "Not assessed")}
          </Badge>
          <StatusIcon className={cn(
            "h-5 w-5",
            status === "covered" && "text-status-closed dark:text-status-closed",
            status === "missing" && "text-destructive dark:text-destructive",
            status === "unknown" && "text-muted-foreground"
          )} />
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* Partner banner */}
          {effectivePartner && (
            <PartnerBanner
              partner={effectivePartner}
              isOverride={isOverride}
              onReset={isOverride ? () => onClearOverride(service.id) : undefined}
              isNb={isNb}
            />
          )}

          {/* Override partner link */}
          {globalPartnerId && !showOverrideSelect && !serviceOverrideId && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowOverrideSelect(true); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> {isNb ? "Bruk annen partner for denne tjenesten" : "Use different partner for this service"}
            </button>
          )}

          {/* Override select */}
          {showOverrideSelect && (
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(val) => {
                  onSetOverride(service.id, val);
                  setShowOverrideSelect(false);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-56">
                  <SelectValue placeholder={isNb ? "Velg partner..." : "Select partner..."} />
                </SelectTrigger>
                <SelectContent>
                  {MSP_PARTNER_DIRECTORY.filter((p) => p.id !== globalPartnerId).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        {p.name}
                        {p.specialties.includes(service.id) && (
                          <Badge variant="outline" className="text-[13px] px-1 py-0 ml-1">{isNb ? "Anbefalt" : "Recommended"}</Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowOverrideSelect(false)}>
                {isNb ? "Avbryt" : "Cancel"}
              </Button>
            </div>
          )}

          {/* Level 1: Actionable items */}
          {service.acronisModules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Acronis</p>
              {service.acronisModules.map((mod) => (
                <AcronisModuleCard
                  key={mod.id}
                  module={mod}
                  activationInfo={activatedServices[mod.id] || null}
                  isQuoteRequested={quoteRequestedIds.includes(mod.id)}
                  onRequestQuote={() => onOpenQuoteDialog({ type: "acronis", product: mod }, service)}
                  onActivate={() => onOpenActivateDialog({ type: "acronis", product: mod }, service)}
                  isNb={isNb}
                />
              ))}
            </div>
          )}

          {service.mspProducts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">{isNb ? "Andre løsninger" : "Other solutions"}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {service.mspProducts.map((product) => (
                  <MSPProductCard
                    key={product.id}
                    product={product}
                    activationInfo={activatedServices[product.id] || null}
                    isQuoteRequested={quoteRequestedIds.includes(product.id)}
                    onRequestQuote={() => onOpenQuoteDialog({ type: "msp-product", product }, service)}
                    onActivate={() => onOpenActivateDialog({ type: "msp-product", product }, service)}
                    isNb={isNb}
                  />
                ))}
              </div>
            </div>
          )}


          {/* Level 2: Details collapsible */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
                <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180" />
                {isNb ? "Vis detaljer" : "Show details"}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              {/* MSP Recommendation */}
              <div className="flex gap-3">
                <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground mb-0.5">{isNb ? "Anbefaling fra MSP" : "MSP recommendation"}</p>
                  <p className="text-xs text-muted-foreground">{isNb ? service.mspRecommendation : service.mspRecommendationEn}</p>
                </div>
              </div>

              {/* ISO Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">ISO 27001:</span>
                {service.linkedControls.map((ctrl) => (
                  <Badge key={ctrl} variant="outline" className="text-[13px] px-1.5 py-0">{ctrl}</Badge>
                ))}
              </div>

              {/* Implementation steps */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ListChecks className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-medium text-foreground">{isNb ? "Implementeringssteg" : "Implementation steps"}</p>
                </div>
                <ol className="space-y-1.5">
                  {(isNb ? service.implementationSteps : service.implementationStepsEn).map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                        status === "covered"
                          ? "bg-status-closed/10 dark:bg-status-closed/50 text-status-closed dark:text-status-closed"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {status === "covered" ? "✓" : i + 1}
                      </span>
                      <span className={cn(
                        "text-xs",
                        status === "covered" ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

export function SecurityServicesSection({ isSelfProfile, assessmentResponses }: SecurityServicesSectionProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { activateService: globalActivate, activatedServices: globalActivated } = useActivatedServices();
  const [activatedServices, setActivatedServices] = useState<Record<string, ActivatedServiceInfo>>(() => {
    const seeded: Record<string, ActivatedServiceInfo> = {};
    for (const [id, entry] of Object.entries(globalActivated)) {
      seeded[id] = { activatedBy: entry.activatedBy, activatedAt: new Date(entry.activatedAt) };
    }
    return seeded;
  });
  const [quoteRequestedIds, setQuoteRequestedIds] = useState<string[]>([]);
  
  const [quoteDialogItem, setQuoteDialogItem] = useState<ActivatableProduct | null>(null);
  const [quoteDialogService, setQuoteDialogService] = useState<SecurityServiceCategory | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  
  const [activateDialogItem, setActivateDialogItem] = useState<ActivatableProduct | null>(null);
  const [activateDialogService, setActivateDialogService] = useState<SecurityServiceCategory | null>(null);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [servicePartnerOverrides, setServicePartnerOverrides] = useState<Record<string, string>>({});

  const activatedIds = Object.keys(activatedServices);
  const results = evaluateServiceCoverage(assessmentResponses || null, isSelfProfile, activatedIds);
  const covered = results.filter((r) => r.status === "covered").length;
  const missing = results.filter((r) => r.status === "missing").length;
  const total = SECURITY_SERVICE_CATALOG.length;
  const pct = Math.round((covered / total) * 100);

  const totalAcronisModules = SECURITY_SERVICE_CATALOG.reduce((sum, s) => sum + s.acronisModules.length, 0);
  const activeAcronisModules = SECURITY_SERVICE_CATALOG.reduce(
    (sum, s) => sum + s.acronisModules.filter((m) => m.isActive || !!activatedServices[m.id]).length, 0
  );

  const selectedPartner = MSP_PARTNER_DIRECTORY.find((p) => p.id === selectedPartnerId) || null;

  const getEffectivePartner = (serviceId: string): MSPPartnerInfo | null => {
    const overrideId = servicePartnerOverrides[serviceId];
    if (overrideId) return MSP_PARTNER_DIRECTORY.find((p) => p.id === overrideId) || null;
    return selectedPartner;
  };

  const handleOpenQuoteDialog = (item: ActivatableProduct, service: SecurityServiceCategory) => {
    setQuoteDialogItem(item);
    setQuoteDialogService(service);
    setQuoteDialogOpen(true);
  };

  const handleOpenActivateDialog = (item: ActivatableProduct, service: SecurityServiceCategory) => {
    setActivateDialogItem(item);
    setActivateDialogService(service);
    setActivateDialogOpen(true);
  };

  const handleQuoteRequested = (id: string) => {
    setQuoteRequestedIds((prev) => [...prev, id]);
  };

  const handleActivate = (id: string, activatedBy: string) => {
    setActivatedServices((prev) => ({
      ...prev,
      [id]: { activatedBy, activatedAt: new Date() },
    }));
    globalActivate(id, activatedBy);
  };

  const handleSetOverride = (serviceId: string, partnerId: string) => {
    setServicePartnerOverrides((prev) => ({ ...prev, [serviceId]: partnerId }));
  };

  const handleClearOverride = (serviceId: string) => {
    setServicePartnerOverrides((prev) => {
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{isNb ? "Sikkerhetstjenester" : "Security Services"}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isSelfProfile && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Lock className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isSelfProfile
              ? (isNb
                ? "Oversikt over sikkerhetstjenester koblet til dine compliance-krav. Be om tilbud fra din MSP-partner og godkjenn via innboksen."
                : "Overview of security services linked to your compliance requirements. Request quotes from your MSP partner and approve via inbox.")
              : (isNb
                ? "Se hvilke sikkerhetstjenester som dekker relevante ISO 27001-kontroller"
                : "See which security services cover relevant ISO 27001 controls")}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Global partner selector */}
            {isSelfProfile && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-warning dark:text-warning" />
                  <span className="text-sm font-medium text-foreground">{isNb ? "MSP-partner" : "MSP partner"}</span>
                </div>
                <Select
                  value={selectedPartnerId || ""}
                  onValueChange={(val) => setSelectedPartnerId(val || null)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={isNb ? "Velg din MSP-partner..." : "Select your MSP partner..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {MSP_PARTNER_DIRECTORY.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPartner && (
                  <p className="text-xs text-muted-foreground">{isNb ? selectedPartner.description : selectedPartner.descriptionEn}</p>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{isNb ? "Sikkerhetsdekning" : "Security coverage"}</span>
                <span className="text-sm font-bold text-foreground">{covered}/{total} {isNb ? "tjenester" : "services"}</span>
              </div>
              <Progress value={pct} className="h-2.5" />
            </div>
            <div className="flex gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-status-closed dark:text-status-closed" />
                <span className="text-muted-foreground">{covered} {isNb ? "implementert" : "implemented"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-destructive dark:text-destructive" />
                <span className="text-muted-foreground">{missing} {isNb ? "mangler" : "missing"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{total - covered - missing} {isNb ? "ikke kartlagt" : "not assessed"}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <CloudCog className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">{activeAcronisModules}/{totalAcronisModules} {isNb ? "Acronis-moduler aktive" : "Acronis modules active"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service cards */}
      <div className="space-y-3">
        {results.map((result) => (
          <ServiceDetailCard
            key={result.service.id}
            result={result}
            activatedServices={activatedServices}
            quoteRequestedIds={quoteRequestedIds}
            onOpenQuoteDialog={handleOpenQuoteDialog}
            onOpenActivateDialog={handleOpenActivateDialog}
            effectivePartner={getEffectivePartner(result.service.id)}
            globalPartnerId={selectedPartnerId}
            serviceOverrideId={servicePartnerOverrides[result.service.id]}
            onSetOverride={handleSetOverride}
            onClearOverride={handleClearOverride}
            isNb={isNb}
          />
        ))}
      </div>

      {/* Quote request dialog */}
      <RequestQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        item={quoteDialogItem}
        service={quoteDialogService}
        effectivePartner={quoteDialogService ? getEffectivePartner(quoteDialogService.id) : null}
        onQuoteRequested={handleQuoteRequested}
      />

      {/* Activate service dialog */}
      <ActivateServiceDialog
        open={activateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        item={activateDialogItem}
        service={activateDialogService}
        effectivePartner={activateDialogService ? getEffectivePartner(activateDialogService.id) : null}
        onActivate={handleActivate}
      />
    </div>
  );
}
