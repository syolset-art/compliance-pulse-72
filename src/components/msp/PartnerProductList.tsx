import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  type LucideIcon,
} from "lucide-react";
import { MYNDER_PRODUCTS, type MynderProduct } from "@/lib/mynderProducts";
import { useFrameworkPackages } from "@/hooks/useFrameworkPackages";
import { EXTRA_FRAMEWORK_PRICE_KR } from "@/lib/planConstants";

const fmt = (n: number) => n.toLocaleString("nb-NO");

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

function ProductRow({ product }: { product: MynderProduct }) {
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

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
      <div className="rounded-md bg-primary/10 p-2 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{product.name}</p>
          {isFrameworks && activeFrameworks > 0 && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {activeFrameworks} regelverk aktivert
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{meta?.description}</p>
      </div>
      <p className="text-sm font-semibold text-foreground tabular-nums shrink-0 pt-1">
        {priceLabel}
      </p>
    </div>
  );
}

/**
 * Alle Mynder-produkter partneren kan selge — samme produkter som under
 * «Min organisasjon», med pris og provisjon.
 */
export function PartnerProductList() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Produkter fra Mynder</h2>
        <p className="text-sm text-muted-foreground">
          Alt du kan selge videre til kundene dine, med fast provisjon.
        </p>
      </div>
      <Card className="divide-y divide-border overflow-hidden">
        {MYNDER_PRODUCTS.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </Card>
    </section>
  );
}
