// ============= Full file contents =============

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";
import { MYNDER_PRODUCTS, type MynderProduct } from "@/lib/mynderProducts";
import { useFrameworkPackages } from "@/hooks/useFrameworkPackages";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { EXTRA_FRAMEWORK_PRICE_KR } from "@/lib/planConstants";
import { defaultFrameworkActivationHours } from "@/lib/activationHours";
import {
  getProductSetupFee,
  writeProductSetupFee,
  useProductSetupFee,
} from "@/lib/productSetupFees";

const fmt = (n: number) => n.toLocaleString("nb-NO");

// Rådgivningstimer ved regelverksaktivering deles med aktiveringsdialog og
// tilbud via src/lib/activationHours.ts (nøkkel msp.productSetupHours, id "frameworks").
const LS_SETUP_HOURS = "msp.productSetupHours";

function readFrameworkHours(): number {
  try {
    const raw = localStorage.getItem(LS_SETUP_HOURS);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return map["frameworks"] ?? 0;
  } catch {
    return 0;
  }
}

function writeFrameworkHours(hours: number) {
  try {
    const raw = localStorage.getItem(LS_SETUP_HOURS);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map["frameworks"] = hours;
    localStorage.setItem(LS_SETUP_HOURS, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

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
  frameworkHours: number;
  hourlyRate: number;
  onOpen: (product: MynderProduct) => void;
}

/** Hele raden er klikkbar — åpner etableringspris, eller info om rådgivningspakker for Regelverk. */
function ProductRow({ product, frameworkHours, hourlyRate, onOpen }: ProductRowProps) {
  const { packages } = useFrameworkPackages();
  const setupFee = useProductSetupFee(product.id, hourlyRate);
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

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      aria-label={
        isFrameworks
          ? `Åpne informasjon om ${product.name} og rådgivningspakker`
          : `Rediger etableringspris for ${product.name}`
      }
    >
      <div className="rounded-md bg-primary/10 p-2 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{product.name}</span>
          {isFrameworks && activeFrameworks > 0 && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {activeFrameworks} regelverk aktivert
            </Badge>
          )}
          {isFrameworks && frameworkHours > 0 && (
            <Badge variant="outline" className="text-[10px] font-normal">
              + {frameworkHours} t rådgivning ved aktivering
            </Badge>
          )}
          {!isFrameworks && setupFee && (
            <Badge variant="outline" className="text-[10px] font-normal">
              Etablering {fmt(setupFee.amountKr)} kr
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{meta?.description}</p>
      </div>
      <div className="text-right shrink-0 pt-1">
        <p className="text-sm font-semibold text-foreground tabular-nums">{priceLabel}</p>
        {!isFrameworks && setupFee && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            + {fmt(setupFee.amountKr)} kr engangs
          </p>
        )}
      </div>
      <ChevronRight
        className="h-4 w-4 text-muted-foreground shrink-0 self-center"
        aria-hidden="true"
      />
    </button>
  );
}

/**
 * Etableringskostnad — partnerens faste engangspris med beskrivelse av hva
 * den dekker. Pakken vises ved førstegangs aktivering av produktet hos en
 * kunde, aldri ved nivåendring.
 */
function SetupFeeEditor({
  productId,
  productName,
  currency,
}: {
  productId: string;
  productName: string;
  currency: string;
}) {
  const existing = getProductSetupFee(productId);
  const [amount, setAmount] = useState(existing ? String(existing.amountKr) : "");
  const [description, setDescription] = useState(existing?.description ?? "");

  const parsed = (() => {
    const n = Number(amount.trim().replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  })();

  // Lagre fortløpende — localStorage er kilden, ingen egen lagreknapp.
  useEffect(() => {
    if (parsed > 0) {
      writeProductSetupFee(productId, { amountKr: parsed, description });
    } else if (existing) {
      writeProductSetupFee(productId, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, description, productId]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Etableringskostnad</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Fast engangspris du fakturerer kunden for å komme i gang med {productName}. Pakken
          vises første gang du aktiverer produktet hos en kunde — ikke når du endrer nivå
          (f.eks. flere systemer eller leverandører).
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="h-8 w-28 text-sm tabular-nums"
          aria-label="Etableringskostnad i kroner"
        />
        <span className="text-xs text-muted-foreground">{currency} (engangs, eks. mva)</span>
      </div>
      {parsed > 0 && (
        <div className="space-y-1.5">
          <label
            htmlFor={`setup-desc-${productId}`}
            className="text-xs font-medium text-foreground"
          >
            Hva dekker etableringen? (valgfritt)
          </label>
          <Textarea
            id={`setup-desc-${productId}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="F.eks. oppsett, import av data og opplæring av teamet"
            rows={2}
            maxLength={500}
            className="text-sm"
          />
        </div>
      )}
      <div className="rounded-md bg-muted/50 px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Etableringskostnad per kunde</span>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {parsed > 0 ? `${fmt(parsed)} ${currency} (engangs)` : "Ingen"}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        La beløpet stå tomt for å fjerne etableringskostnaden.
      </p>
    </div>
  );
}

/** Lisenspris (fast fra Mynder) — skrivebeskyttet oversikt over nivåene. */
function LicensePriceSection({
  product,
  currency,
}: {
  product: MynderProduct;
  currency: string;
}) {
  return (
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
  );
}

/** Redigering av et vanlig produkt — lisenspris og etableringskostnad. */
function ProductEditSheet({
  product,
  open,
  onOpenChange,
  currency,
}: {
  product: MynderProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
}) {
  if (!product) return null;
  const meta = PRODUCT_META[product.id];
  const Icon = meta?.icon ?? LayoutGrid;

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
          <LicensePriceSection product={product} currency={currency} />

          <Separator />

          <SetupFeeEditor
            key={product.id}
            productId={product.id}
            productName={product.name}
            currency={currency}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Info-sheet for Regelverk — ingen fast etableringspris her. Brukeren lager
 * egne rådgivningspakker per regelverk i avsnittet «Regelverk og
 * rådgivningspakker» lenger ned på siden.
 */
function FrameworkAdvisorySheet({
  product,
  open,
  onOpenChange,
  frameworkHours,
  onFrameworkHoursChange,
  hourlyRate,
  currency,
}: {
  product: MynderProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frameworkHours: number;
  onFrameworkHoursChange: (hours: number) => void;
  hourlyRate: number;
  currency: string;
}) {
  const advisoryFee = frameworkHours > 0 ? Math.round(frameworkHours * hourlyRate) : 0;

  const scrollToPackages = () => {
    onOpenChange(false);
    // Vent til sheeten er lukket før vi scroller til avsnittet under.
    window.setTimeout(() => {
      document
        .getElementById("regelverk-pakker")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="rounded-md bg-primary/10 p-1.5">
              <Scale className="h-4 w-4 text-primary" />
            </span>
            {product.name}
          </SheetTitle>
          <SheetDescription>{PRODUCT_META.frameworks.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <LicensePriceSection product={product} currency={currency} />

          <Separator />

          {/* Rådgivningspakker — lages i avsnittet under, ingen fast etableringspris */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 shrink-0">
                <PackageOpen className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Lag egne rådgivningspakker
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Regelverk har ingen fast etableringspris. I stedet lager du dine egne
              rådgivningspakker per regelverk — med pakkens navn, AI-foreslåtte timer per
              krav og aktiveringspris. Det gjør du i avsnittet{" "}
              <span className="font-medium text-foreground">
                «Regelverk og rådgivningspakker»
              </span>{" "}
              lenger ned på siden.
            </p>
            <Button onClick={scrollToPackages} className="w-full gap-2">
              <ArrowDown className="h-4 w-4" />
              Gå til rådgivningspakker
            </Button>
          </Card>

          <Separator />

          {/* Rådgivning ved aktivering — timer som følger med når et regelverk slås på */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Rådgivning ved aktivering
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Legg til rådgivningstimer når du aktiverer et regelverk
                </p>
              </div>
              <Switch
                checked={frameworkHours > 0}
                onCheckedChange={(on) =>
                  onFrameworkHoursChange(on ? defaultFrameworkActivationHours() : 0)
                }
                aria-label="Legg til rådgivningstimer når du aktiverer et regelverk"
              />
            </div>
            {frameworkHours > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={frameworkHours}
                    onChange={(e) =>
                      onFrameworkHoursChange(
                        Math.max(0, Math.round((Number(e.target.value) || 0) * 10) / 10),
                      )
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
                    {fmt(advisoryFee)} {currency} (engangs)
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Timene følger automatisk med når regelverket slås på hos kunden, og kan tas
                  med i tilbudet. Du fakturerer dem som et engangsbeløp. Timeprisen endres
                  under Innstillinger.
                </p>
              </>
            )}
          </div>
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
              <li>
                Du kan legge til etableringskostnad per produkt — klikk på produktet i
                listen.
              </li>
            </ul>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Alle Mynder-produkter partneren kan selge — samme produkter som under
 * «Min organisasjon», med pris. Klikk på et produkt for å legge til
 * etableringskostnad (fast engangspris med beskrivelse). Regelverk åpner
 * i stedet info om rådgivningspakkene i avsnittet under.
 */
export function PartnerProductList() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<MynderProduct | null>(null);
  const [frameworkInfoOpen, setFrameworkInfoOpen] = useState(false);
  const [frameworkHours, setFrameworkHours] = useState<number>(readFrameworkHours);
  const [expanded, setExpanded] = useState(false);
  const { defaultHourlyRate, currency } = useServiceDefaults();
  const hourlyRate = defaultHourlyRate ?? 1500;

  useEffect(() => {
    writeFrameworkHours(frameworkHours);
  }, [frameworkHours]);

  // Regelverk skal ikke ha etableringspris — rydd bort eventuell eldre verdi.
  useEffect(() => {
    writeProductSetupFee("frameworks", null);
  }, []);

  const handleOpen = (product: MynderProduct) => {
    if (product.id === "frameworks") {
      setFrameworkInfoOpen(true);
    } else {
      setEditing(product);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-left group"
          aria-expanded={expanded}
          aria-controls="product-list"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              Lisensprodukter
            </h2>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Fast lisensinntekt per kunde. Klikk på et produkt for å legge til etableringskostnad.
            Regelverk og rådgivningspakker setter du opp i avsnittet under.
          </p>
        </button>
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
      {expanded && (
        <>
          <Card id="product-list" className="divide-y divide-border overflow-hidden">
            {MYNDER_PRODUCTS.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                frameworkHours={frameworkHours}
                hourlyRate={hourlyRate}
                onOpen={handleOpen}
              />
            ))}
          </Card>
        </>
      )}
      <ProductSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProductEditSheet
        product={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        currency={currency}
      />
      {MYNDER_PRODUCTS.find((p) => p.id === "frameworks") && (
        <FrameworkAdvisorySheet
          product={MYNDER_PRODUCTS.find((p) => p.id === "frameworks")!}
          open={frameworkInfoOpen}
          onOpenChange={setFrameworkInfoOpen}
          frameworkHours={frameworkHours}
          onFrameworkHoursChange={setFrameworkHours}
          hourlyRate={hourlyRate}
          currency={currency}
        />
      )}
    </section>
  );
}
