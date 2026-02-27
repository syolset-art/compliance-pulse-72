import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield, CheckCircle, XCircle, HelpCircle, Lock,
  ChevronDown, ChevronUp, Package, ListChecks, Lightbulb, Zap, CloudCog, ShoppingCart,
  Award, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  SECURITY_SERVICE_CATALOG,
  evaluateServiceCoverage,
  ServiceCoverageResult,
  AcronisModule,
  MSPProduct,
  SecurityServiceCategory,
} from "@/lib/securityServiceCatalog";
import { ActivateServiceDialog } from "./ActivateAcronisServiceDialog";

type ActivatableProduct =
  | { type: "acronis"; product: AcronisModule }
  | { type: "msp-product"; product: MSPProduct };

interface SecurityServicesSectionProps {
  isSelfProfile?: boolean;
  assessmentResponses?: Record<string, string> | null;
}

function AcronisModuleCard({
  module,
  isActivated,
  onActivate,
}: {
  module: AcronisModule;
  isActivated: boolean;
  onActivate: () => void;
}) {
  const active = module.isActive || isActivated;

  return (
    <div className={cn(
      "rounded-md border px-3 py-2 flex items-center gap-3 transition-all",
      active
        ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20"
        : "border-border bg-background/50 hover:border-primary/30"
    )}>
      <CloudCog className={cn("h-4 w-4 shrink-0", active ? "text-green-600 dark:text-green-400" : "text-muted-foreground")} />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className="text-xs font-medium text-foreground truncate">{module.name}</p>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{module.acronisPackage}</Badge>
      </div>
      <div className="shrink-0">
        {active ? (
          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 text-[10px] gap-1">
            <CheckCircle className="h-3 w-3" /> Aktiv
          </Badge>
        ) : (
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={onActivate}>
            <Zap className="h-3 w-3" /> Aktiver
          </Button>
        )}
      </div>
    </div>
  );
}

function MSPProductCard({
  product,
  isActivated,
  onActivate,
}: {
  product: MSPProduct;
  isActivated: boolean;
  onActivate: () => void;
}) {
  return (
    <div className={cn(
      "rounded-md border px-3 py-2 flex items-center gap-3 transition-all",
      isActivated
        ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20"
        : "border-border/60 bg-background/50 hover:border-primary/30"
    )}>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
        <span className="text-[10px] text-muted-foreground shrink-0">{product.vendor}</span>
      </div>
      <div className="shrink-0">
        {isActivated ? (
          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 text-[10px] gap-1">
            <CheckCircle className="h-3 w-3" /> Bestilt
          </Badge>
        ) : (
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={onActivate}>
            <ShoppingCart className="h-3 w-3" /> Aktiver
          </Button>
        )}
      </div>
    </div>
  );
}

function ServiceDetailCard({
  result,
  activatedIds,
  onOpenDialog,
}: {
  result: ServiceCoverageResult;
  activatedIds: string[];
  onOpenDialog: (item: ActivatableProduct, service: SecurityServiceCategory) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { service, status } = result;
  const Icon = service.icon;
  const StatusIcon =
    status === "covered" ? CheckCircle :
    status === "missing" ? XCircle : HelpCircle;

  const activeAcronisCount = service.acronisModules.filter(
    (m) => m.isActive || activatedIds.includes(m.id)
  ).length;
  const activatedProductCount = service.mspProducts.filter(
    (p) => activatedIds.includes(p.id)
  ).length;
  const totalActivated = activeAcronisCount + activatedProductCount;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        status === "covered" && "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30",
        status === "missing" && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30",
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
          <p className="font-medium text-sm text-foreground">{service.name}</p>
          <p className="text-xs text-muted-foreground">{service.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalActivated > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
              <CheckCircle className="h-3 w-3" />
              {totalActivated} aktive
            </Badge>
          )}
          <Badge
            variant={status === "covered" ? "default" : status === "missing" ? "destructive" : "outline"}
            className="text-xs"
          >
            {status === "covered" ? "Implementert" : status === "missing" ? "Mangler" : "Ikke kartlagt"}
          </Badge>
          <StatusIcon className={cn(
            "h-5 w-5",
            status === "covered" && "text-green-600 dark:text-green-400",
            status === "missing" && "text-red-600 dark:text-red-400",
            status === "unknown" && "text-muted-foreground"
          )} />
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* Partner banner */}
          {service.mspPartner && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-3 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{service.mspPartner.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{service.mspPartner.description}</p>
                {service.mspPartner.website && (
                  <a
                    href={service.mspPartner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    Besøk {service.mspPartner.name} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 text-[10px] shrink-0">
                MSP-partner
              </Badge>
            </div>
          )}

          {/* Level 1: Actionable items */}
          {service.acronisModules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Acronis</p>
              {service.acronisModules.map((mod) => (
                <AcronisModuleCard
                  key={mod.id}
                  module={mod}
                  isActivated={activatedIds.includes(mod.id)}
                  onActivate={() => onOpenDialog({ type: "acronis", product: mod }, service)}
                />
              ))}
            </div>
          )}

          {service.mspProducts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Andre løsninger</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {service.mspProducts.map((product) => (
                  <MSPProductCard
                    key={product.id}
                    product={product}
                    isActivated={activatedIds.includes(product.id)}
                    onActivate={() => onOpenDialog({ type: "msp-product", product }, service)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CTA for missing/unknown */}
          {status !== "covered" && (
            <Button size="sm" className="w-full gap-2">
              <Shield className="h-4 w-4" />
              Kontakt MSP-partner for implementering
            </Button>
          )}

          {/* Level 2: Details collapsible */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
                <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180" />
                Vis detaljer
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              {/* MSP Recommendation */}
              <div className="flex gap-3">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground mb-0.5">Anbefaling fra MSP</p>
                  <p className="text-xs text-muted-foreground">{service.mspRecommendation}</p>
                </div>
              </div>

              {/* ISO Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">ISO 27001:</span>
                {service.linkedControls.map((ctrl) => (
                  <Badge key={ctrl} variant="outline" className="text-[10px] px-1.5 py-0">{ctrl}</Badge>
                ))}
              </div>

              {/* Implementation steps */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ListChecks className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-medium text-foreground">Implementeringssteg</p>
                </div>
                <ol className="space-y-1.5">
                  {service.implementationSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        status === "covered"
                          ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
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
  const [activatedIds, setActivatedIds] = useState<string[]>([]);
  const [dialogItem, setDialogItem] = useState<ActivatableProduct | null>(null);
  const [dialogService, setDialogService] = useState<SecurityServiceCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const results = evaluateServiceCoverage(assessmentResponses || null, isSelfProfile, activatedIds);
  const covered = results.filter((r) => r.status === "covered").length;
  const missing = results.filter((r) => r.status === "missing").length;
  const total = SECURITY_SERVICE_CATALOG.length;
  const pct = Math.round((covered / total) * 100);

  const totalAcronisModules = SECURITY_SERVICE_CATALOG.reduce((sum, s) => sum + s.acronisModules.length, 0);
  const activeAcronisModules = SECURITY_SERVICE_CATALOG.reduce(
    (sum, s) => sum + s.acronisModules.filter((m) => m.isActive || activatedIds.includes(m.id)).length, 0
  );

  const handleOpenDialog = (item: ActivatableProduct, service: SecurityServiceCategory) => {
    setDialogItem(item);
    setDialogService(service);
    setDialogOpen(true);
  };

  const handleActivate = (id: string) => {
    setActivatedIds((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Sikkerhetstjenester</CardTitle>
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
              ? "Oversikt over sikkerhetstjenester koblet til dine compliance-krav. Aktiver løsninger direkte — din MSP-partner håndterer oppsettet."
              : "Se hvilke sikkerhetstjenester som dekker relevante ISO 27001-kontroller"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">Sikkerhetsdekning</span>
                <span className="text-sm font-bold text-foreground">{covered}/{total} tjenester</span>
              </div>
              <Progress value={pct} className="h-2.5" />
            </div>
            <div className="flex gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-muted-foreground">{covered} implementert</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                <span className="text-muted-foreground">{missing} mangler</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{total - covered - missing} ikke kartlagt</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <CloudCog className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">{activeAcronisModules}/{totalAcronisModules} Acronis-moduler aktive</span>
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
            activatedIds={activatedIds}
            onOpenDialog={handleOpenDialog}
          />
        ))}
      </div>

      {/* Activation dialog */}
      <ActivateServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={dialogItem}
        service={dialogService}
        onActivate={handleActivate}
      />
    </div>
  );
}
