import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Check,
  FileText,
  Upload,
  Package,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocumentStatus, type ServiceRef, type RegulationStatus } from "@/lib/maturityNextActions";
import { useBaselineDocuments } from "@/hooks/useBaselineDocuments";

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
  frameworkId,
  label,
  status,
  services,
  products,
  onGoToProducts,
  onUpload,
}: Props) {
  const { documents } = useBaselineDocuments(customerId);

  const docRows = useMemo(
    () => getDocumentStatus(frameworkId, documents.map((d) => d.fileName)),
    [frameworkId, documents],
  );

  const missing = docRows.filter((d) => !d.present);
  const present = docRows.filter((d) => d.present);

  return (
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
          {/* Dokumentstatus */}
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
                <ul className="divide-y divide-border rounded-md border border-border">
                  {[...missing, ...present].map((d) => (
                    <li
                      key={`${d.areaId}-${d.name}`}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          {d.present ? (
                            <Check className="h-3.5 w-3.5 text-success shrink-0" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                          )}
                          <span className="truncate">{d.name}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground ml-5 truncate">
                          {d.areaTitle} · {d.articleLabel}
                        </div>
                      </div>
                      {!d.present && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 shrink-0 text-xs text-muted-foreground hover:text-primary"
                          onClick={() => onUpload(frameworkId)}
                        >
                          Last opp
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
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
  );
}
