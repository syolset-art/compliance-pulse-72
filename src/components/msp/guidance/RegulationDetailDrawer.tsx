import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowRight,
  Check,
  FileText,
  Upload,
  Package,
  Sparkles,
  AlertCircle,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocumentStatus, type ServiceRef, type RegulationStatus } from "@/lib/maturityNextActions";
import { useBaselineDocuments } from "@/hooks/useBaselineDocuments";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import {
  toDeliverables,
  summarizePotential,
  formatPriceRange,
  formatHours,
  DELIVERABLE_KIND_LABEL,
  type DocumentDeliverable,
} from "@/lib/documentDeliverables";
import { GenerateDocumentDialog } from "./GenerateDocumentDialog";
import { MSPCreateOfferDialog } from "../MSPCreateOfferDialog";

interface CustomerProduct {
  key: string;
  title: string;
  activated: boolean;
  meta?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName?: string;
  industry?: string;
  businessDescription?: string;
  frameworkId: string;
  label: string;
  status: RegulationStatus;
  services: ServiceRef[];
  products: CustomerProduct[];
  onGoToProducts: () => void;
  onUpload: (frameworkId: string) => void;
}

const STATUS_LABEL: Record<RegulationStatus, string> = {
  active: "Aktivert",
  confirmed: "Bekreftet — ikke aktivert",
  recommended: "AI-anbefalt",
};

export function RegulationDetailDrawer({
  open,
  onOpenChange,
  customerId,
  customerName,
  industry,
  businessDescription,
  frameworkId,
  label,
  status,
  services,
  products,
  onGoToProducts,
  onUpload,
}: Props) {
  const { documents } = useBaselineDocuments(customerId);
  const { defaultHourlyRate, currency } = useServiceDefaults();

  const [selected, setSelected] = useState<string[]>([]);
  const [draftDoc, setDraftDoc] = useState<DocumentDeliverable | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerDocs, setOfferDocs] = useState<DocumentDeliverable[]>([]);

  const docRows = useMemo(
    () => getDocumentStatus(frameworkId, documents.map((d) => d.fileName)),
    [frameworkId, documents],
  );

  const present = docRows.filter((d) => d.present);
  const missing = useMemo(
    () => toDeliverables(docRows.filter((d) => !d.present), defaultHourlyRate),
    [docRows, defaultHourlyRate],
  );

  const potential = useMemo(() => summarizePotential(missing), [missing]);
  const selectedDocs = missing.filter((d) => selected.includes(d.name));
  const selectedPotential = summarizePotential(selectedDocs);

  const toggle = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const openOffer = (docs: DocumentDeliverable[]) => {
    if (docs.length === 0) return;
    setOfferDocs(docs);
    setOfferOpen(true);
  };

  const offerTitle =
    offerDocs.length === 1
      ? offerDocs[0].name
      : `Dokumentasjonspakke – ${label}`;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-2">
            <SheetTitle className="text-base">{label} — detaljer</SheetTitle>
            <SheetDescription className="text-xs">
              Status:{" "}
              <span
                className={cn(
                  "font-medium",
                  status === "active" ? "text-success" : "text-foreground",
                )}
              >
                {STATUS_LABEL[status]}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-6">
            {/* Dokumentstatus som salgspotensial */}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dokumentasjon
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => onUpload(frameworkId)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Last opp
                </Button>
              </div>

              {docRows.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Ingen dokumentkrav kartlagt for dette regelverket ennå.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {present.length} av {docRows.length} anbefalte dokumenter er på plass.
                  </p>

                  {missing.length > 0 && (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Coins className="h-3.5 w-3.5 text-primary shrink-0" />
                          Salgspotensial
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {potential.count} dokumenter · {formatHours(potential.hours)} ·{" "}
                          {formatPriceRange(potential.price, currency)} eks. mva
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 shrink-0 text-xs"
                        onClick={() => openOffer(missing)}
                      >
                        Lag tilbud
                      </Button>
                    </div>
                  )}

                  <ul className="divide-y divide-border rounded-md border border-border">
                    {missing.map((d) => (
                      <li key={`${d.areaId}-${d.name}`} className="px-3 py-2.5 space-y-1.5">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`doc-${d.areaId}-${d.name}`}
                            checked={selected.includes(d.name)}
                            onCheckedChange={() => toggle(d.name)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <label
                              htmlFor={`doc-${d.areaId}-${d.name}`}
                              className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer"
                            >
                              <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                              <span className="truncate">{d.name}</span>
                            </label>
                            <div className="text-[11px] text-muted-foreground ml-5 truncate">
                              {d.areaTitle} · {d.articleLabel}
                            </div>
                            <div className="ml-5 mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge variant="secondary" className="text-[10px] font-normal">
                                {DELIVERABLE_KIND_LABEL[d.profile.kind]}
                              </Badge>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-[11px] tabular-nums text-muted-foreground">
                                      {formatHours(d.profile.hours)} ·{" "}
                                      <span className="font-medium text-foreground">
                                        {formatPriceRange(d.price, currency)}
                                      </span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-xs">
                                    {d.profile.note} Pris er estimat fra din timepris (
                                    {defaultHourlyRate.toLocaleString("nb-NO")} {currency}/t), eks.
                                    mva. Kan overstyres i tilbudet.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                        <div className="ml-7 flex flex-wrap gap-1.5">
                          {d.profile.laraDraft && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => setDraftDoc(d)}
                            >
                              <Sparkles className="h-3 w-3" />
                              Generer utkast
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => openOffer([d])}
                          >
                            Legg i tilbud
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => onUpload(frameworkId)}
                          >
                            Last opp
                          </Button>
                        </div>
                      </li>
                    ))}

                    {present.map((d) => (
                      <li
                        key={`${d.areaId}-${d.name}`}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Check className="h-3.5 w-3.5 text-success shrink-0" />
                            <span className="truncate">{d.name}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground ml-5 truncate">
                            {d.areaTitle} · {d.articleLabel}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {selectedDocs.length > 0 && (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                      <p className="text-xs text-foreground">
                        {selectedDocs.length} valgt ·{" "}
                        <span className="font-medium tabular-nums">
                          {formatPriceRange(selectedPotential.price, currency)}
                        </span>{" "}
                        eks. mva
                      </p>
                      <Button
                        size="sm"
                        className="h-7 shrink-0 text-xs"
                        onClick={() => openOffer(selectedDocs)}
                      >
                        Lag tilbud på utvalget
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>

            <Separator />

            {/* Produkter kunden har */}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Produkter kunden har
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={onGoToProducts}
                >
                  Se i Produkter
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <ul className="space-y-1.5">
                {products.map((p) => (
                  <li key={p.key} className="flex items-center gap-2 text-sm">
                    <Package
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        p.activated ? "text-success" : "text-muted-foreground",
                      )}
                    />
                    <span className={p.activated ? "text-foreground" : "text-muted-foreground"}>
                      {p.title}
                    </span>
                    {p.meta && (
                      <span className="text-[11px] text-muted-foreground truncate">· {p.meta}</span>
                    )}
                    {!p.activated && (
                      <Badge variant="outline" className="text-[10px] font-normal border-dashed">
                        Ikke aktivert
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <Separator />

            {/* Tjenester */}
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tjenester som dekker dette regelverket
              </h4>
              {services.length === 0 ? (
                <p className="text-xs text-muted-foreground">Ingen tjenester koblet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => (
                    <Badge
                      key={s.id}
                      variant={s.inCatalog ? "secondary" : "outline"}
                      className={cn(
                        "text-[11px] font-normal gap-1",
                        !s.inCatalog && "border-dashed text-muted-foreground",
                      )}
                    >
                      {s.inCatalog ? (
                        <FileText className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Stiplet ramme = forslag fra Mynders tjenestebibliotek, ikke lagt til i katalogen din.
              </p>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <GenerateDocumentDialog
        open={draftDoc !== null}
        onOpenChange={(o) => !o && setDraftDoc(null)}
        customerId={customerId}
        customerName={customerName}
        frameworkId={frameworkId}
        frameworkLabel={label}
        deliverable={draftDoc}
        currency={currency}
        industry={industry}
        businessDescription={businessDescription}
      />

      {offerOpen && (
        <MSPCreateOfferDialog
          open={offerOpen}
          onOpenChange={setOfferOpen}
          domainName={label}
          serviceTitle={offerTitle}
          customerId={customerId}
          customerName={customerName}
          hourlyRate={defaultHourlyRate}
          gapFrameworkId={frameworkId}
          offeredServiceNames={offerDocs.map((d) => d.name)}
          defaultMessage={`Vi har gjennomgått ${label}-kravene deres og ser at følgende dokumentasjon mangler. Vi kan levere den for dere.`}
          defaultTasks={offerDocs.map((d) => ({
            label: `${d.name} (${d.articleLabel})`,
            hours: Math.round((d.profile.hours.min + d.profile.hours.max) / 2),
            owner: "Partner" as const,
            note: d.profile.note,
          }))}
        />
      )}
    </>
  );
}
