import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  LayoutGrid,
  Truck,
  Boxes,
  Scale,
  AlertTriangle,
  Globe,
  Settings2,
  Handshake,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { MYNDER_PRODUCTS, type MynderProduct } from "@/lib/mynderProducts";
import { useFrameworkPackages } from "@/hooks/useFrameworkPackages";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { EXTRA_FRAMEWORK_PRICE_KR } from "@/lib/planConstants";
import {
  readProductSetupHours,
  defaultFrameworkActivationHours,
} from "@/lib/activationHours";

const fmt = (n: number) => n.toLocaleString("nb-NO");

// Oppstartskost per produkt lagres som timer (multipliseres med partnerens timepris).
// Nøkkelen deles med aktiveringsdialog og tilbud via src/lib/activationHours.ts.
const LS_SETUP_HOURS = "msp.productSetupHours";

const readSetupHours = readProductSetupHours;

const PRODUCT_META: Record<string, { icon: LucideIcon; description: string }> = {
  core: {
    icon: LayoutGrid,
    description: "Grunnmodulen. Oppgaver, avvik, samsvar, behandlingsprotokoll og dokumenter.",
  },
  vendors: {
    icon: Truck,
    description: "Leverandørstyring med risikovurdering, dokumentasjon og oppfølging.",
  },
  assets: {
    icon: Boxes,
    description: "Kartlegg og administrer systemer, data og andre eiendeler.",
  },
  frameworks: {
    icon: Scale,
    description:
      "Aktiver regelverk for kunden — og selg rådgivningstimer knyttet til kravene (se under).",
  },
  deviations: {
    icon: AlertTriangle,
    description: "Registrer, følg opp og rapporter avvik på ett sted.",
  },
  trust: {
    icon: Globe,
    description: "Del samsvar og dokumentasjon med kundenes kunder via et eget Trust Center.",
  },
};

interface ProductRowProps {
  product: MynderProduct;
  setupHours: number;
  hourlyRate: number;
  onEdit: (product: MynderProduct) => void;
}

function ProductRow({ product, setupHours, hourlyRate, onEdit }: ProductRowProps) {
  const { packages } = useFrameworkPackages();
  const meta = PRODUCT_META[product.id];
  const Icon = meta?.icon ?? LayoutGrid;

  const isFrameworks = product.id === "frameworks";
  const activeFrameworks = isFrameworks
    ? Object.values(packages).filter((p) => p.is_active).length
    : 0;

  const priceLabel = isFrameworks
    ? activeFrameworks > 0
      ? `${fmt(activeFrameworks * EXTRA_FRAMEWORK_PRICE_KR)} kr/mnd`
      : `${fmt(EXTRA_FRAMEWORK_PRICE_KR)} kr/mnd per regelverk`
    : product.fromPrice === 0
      ? "Inkludert"
      : `fra ${fmt(product.fromPrice)} kr/mnd`;

  const setupFee = setupHours > 0 ? setupHours * hourlyRate : 0;

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
      <div className="rounded-md bg-primary/10 p-2 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Produktnavnet åpner redigering (oppstartskost m.m.) */}
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
            aria-label={`Rediger ${product.name}`}
          >
            {product.name}
            <Pencil
              className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          </button>
          {isFrameworks && activeFrameworks > 0 && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {activeFrameworks} regelverk aktivert
            </Badge>
          )}
          {setupFee > 0 && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {isFrameworks
                ? `+ ${setupHours} t rådgivning ved aktivering`
                : `Oppstart ${fmt(setupFee)} kr`}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{meta?.description}</p>
      </div>
      <div className="text-right shrink-0 pt-1">
        <p className="text-sm font-semibold text-foreground tabular-nums">{priceLabel}</p>
        {setupFee > 0 && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            + {fmt(setupFee)} kr engangs
          </p>
        )}
      </div>
    </div>
  );
}

/** Redigering av ett produkt — oppstartskost som timer × partnerens timepris. */
function ProductEditSheet({
  product,
  open,
  onOpenChange,
  setupHours,
  onSetupHoursChange,
  hourlyRate,
  currency,
}: {
  product: MynderProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setupHours: number;
  onSetupHoursChange: (hours: number) => void;
  hourlyRate: number;
  currency: string;
}) {
  if (!product) return null;
  const meta = PRODUCT_META[product.id];
  const Icon = meta?.icon ?? LayoutGrid;
  const setupFee = setupHours > 0 ? Math.round(setupHours * hourlyRate) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="rounded-md bg-primary/10 p-1.5">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            {product.name}
          </SheetTitle>
          <SheetDescription>{meta?.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Lisenspris — fast fra Mynder */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Lisenspris</p>
            <div className="rounded-md border border-border divide-y divide-border">
              {product.tiers.map((t) => (
                <div key={t.label} className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-foreground">{t.label}</span>
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {t.isFree || t.priceKr === 0
                      ? "Inkludert"
                      : `${fmt(t.priceKr)} ${currency}/mnd`}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lisensprisen settes av Mynder og kan ikke endres. Du får fast provisjon på alt du
              selger.
            </p>
          </div>

          <Separator />

          {product.id === "frameworks" ? (
            /* Rådgivning ved aktivering — timer som følger med når et regelverk slås på */
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Rådgivning ved aktivering</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Legg til rådgivningstimer når du aktiverer et regelverk
                  </p>
                </div>
                <Switch
                  checked={setupHours > 0}
                  onCheckedChange={(on) =>
                    onSetupHoursChange(on ? defaultFrameworkActivationHours() : 0)
                  }
                  aria-label="Legg til rådgivningstimer når du aktiverer et regelverk"
                />
              </div>
              {setupHours > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={setupHours}
                      onChange={(e) =>
                        onSetupHoursChange(Math.max(0, Math.round((Number(e.target.value) || 0) * 10) / 10))
                      }
                      className="h-8 w-20 text-sm tabular-nums"
                      aria-label="Rådgivningstimer per aktivering"
                    />
                    <span className="text-xs text-muted-foreground">
                      timer × {fmt(hourlyRate)} {currency}/t
                    </span>
                  </div>
                  <div className="rounded-md bg-muted/50 px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Per aktivering</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {fmt(setupFee)} {currency} (engangs)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Timene følger automatisk med når regelverket slås på hos kunden, og kan tas med
                    i tilbudet. Du fakturerer dem som et engangsbeløp. Timeprisen endres under
                    Innstillinger.
                  </p>
                </>
              )}
            </div>
          ) : (
            /* Oppstartskost — partnerens eget engangsbeløp */
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Oppstartskost</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Engangsbeløp du fakturerer kunden for å komme i gang med {product.name}. Settes
                  som timer og prises med timeprisen din.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={setupHours}
                  onChange={(e) =>
                    onSetupHoursChange(Math.max(0, Math.round((Number(e.target.value) || 0) * 10) / 10))
                  }
                  className="h-8 w-20 text-sm tabular-nums"
                  aria-label="Oppstartskost i timer"
                />
                <span className="text-xs text-muted-foreground">
                  timer × {fmt(hourlyRate)} {currency}/t
                </span>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Oppstartskost per kunde</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {setupFee > 0 ? `${fmt(setupFee)} ${currency} (engangs)` : "Ingen"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sett til 0 timer for å fjerne oppstartskost. Timeprisen endres under Innstillinger.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Innstillinger for Mynder-produktene — partnerprogram og bonus. */
function ProductSettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Innstillinger – produkter fra Mynder</SheetTitle>
          <SheetDescription>
            Dine vilkår og bonus knyttet til videresalg av Mynder-produkter.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 shrink-0">
                <Handshake className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Partnerprogram</p>
                <p className="text-xs text-muted-foreground">
                  Fast provisjon på alt du selger av Mynder-produkter.
                </p>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">20&nbsp;%</p>
            </div>
            <Separator />
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>Provisjonen gjelder alle produkter i listen — også regelverk du aktiverer.</li>
              <li>Utbetales månedlig, basert på aktive abonnement hos kundene dine.</li>
              <li>Du kan legge til oppstartskost per produkt — klikk på produktnavnet i listen.</li>
            </ul>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Alle Mynder-produkter partneren kan selge — samme produkter som under
 * «Min organisasjon», med pris. Klikk på et produktnavn for å legge til
 * oppstartskost (timer × timepris).
 */
export function PartnerProductList() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<MynderProduct | null>(null);
  const [setupHoursMap, setSetupHoursMap] = useState<Record<string, number>>(readSetupHours);
  const { defaultHourlyRate, currency } = useServiceDefaults();
  const hourlyRate = defaultHourlyRate ?? 1500;

  useEffect(() => {
    localStorage.setItem(LS_SETUP_HOURS, JSON.stringify(setupHoursMap));
  }, [setupHoursMap]);

  const setProductHours = (productId: string, hours: number) =>
    setSetupHoursMap((prev) => ({ ...prev, [productId]: hours }));

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Produkter fra Mynder</h2>
          <p className="text-sm text-muted-foreground">
            Alt du kan selge videre til kundene dine, med fast provisjon. Klikk på et produkt for å
            legge til oppstartskost.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={() => setSettingsOpen(true)}
          aria-label="Innstillinger for produkter fra Mynder"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Innstillinger</span>
        </Button>
      </div>
      <Card className="divide-y divide-border overflow-hidden">
        {MYNDER_PRODUCTS.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            setupHours={setupHoursMap[p.id] ?? 0}
            hourlyRate={hourlyRate}
            onEdit={setEditing}
          />
        ))}
      </Card>
      <ProductSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProductEditSheet
        product={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        setupHours={editing ? (setupHoursMap[editing.id] ?? 0) : 0}
        onSetupHoursChange={(hours) => editing && setProductHours(editing.id, hours)}
        hourlyRate={hourlyRate}
        currency={currency}
      />
    </section>
  );
}
