import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles,
  Target,
  Brain,
  Bug,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MSPCreateOfferDialog } from "./MSPCreateOfferDialog";

interface Recommendation {
  id: string;
  icon: any;
  title: string;
  desc: string;
  urgent?: boolean;
  ctas: { label: string; variant: "default" | "outline"; deliveryVariant: "Full leveranse" | "Co-delivery" | "Tjeneste" }[];
}

interface OngoingItem {
  id: string;
  title: string;
  status: "pending" | "accepted";
  meta: string;
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "nis2",
    icon: Target,
    title: "NIS2-klargjøring",
    desc: "Kunden er omfattet av NIS2 og lite forberedt. Strukturert leveranse med gap-analyse, policyer og rapporteringsrutiner.",
    urgent: true,
    ctas: [
      { label: "Tilby full leveranse", variant: "default", deliveryVariant: "Full leveranse" },
      { label: "Tilby co-delivery", variant: "outline", deliveryVariant: "Co-delivery" },
    ],
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI Governance-rammeverk",
    desc: "Kunden har ikke startet på AI-styring. Kartlegging av AI-bruk, klassifisering og policy-oppsett.",
    ctas: [
      { label: "Tilby full leveranse", variant: "default", deliveryVariant: "Full leveranse" },
      { label: "Tilby co-delivery", variant: "outline", deliveryVariant: "Co-delivery" },
    ],
  },
  {
    id: "pentest",
    icon: Bug,
    title: "Penetrasjonstest",
    desc: "Årlig ekstern test av applikasjoner og infrastruktur. Underbygger ISO- og NIS2-arbeidet.",
    ctas: [
      { label: "Tilby leveranse", variant: "default", deliveryVariant: "Tjeneste" },
    ],
  },
];

const ONGOING: OngoingItem[] = [
  { id: "iso", title: "ISO 27001-klargjøring", status: "pending", meta: "Tilbud sendt 28. april · Avventer svar" },
  { id: "aware", title: "Awareness-program", status: "accepted", meta: "Akseptert 12. april · Oppstart 15. mai" },
];

export function MSPMaturityServiceMatrix() {
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [offerCtx, setOfferCtx] = useState<{
    open: boolean;
    serviceTitle?: string;
    variant?: "Full leveranse" | "Co-delivery" | "Tjeneste";
  }>({ open: false });

  const urgentCount = RECOMMENDATIONS.filter(r => r.urgent).length;

  return (
    <div className="space-y-5">
      {/* Lara recommendation banner */}
      {!dismissedBanner && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Lara har en anbefaling til deg</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Du har {RECOMMENDATIONS.length} tjenestemuligheter som matcher denne kundens behov
                {urgentCount > 0 && <>, hvorav {urgentCount} er tidskritisk</>}.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" className="h-8">Vis forslag</Button>
              <button
                type="button"
                onClick={() => setDismissedBanner(true)}
                className="text-xs text-muted-foreground hover:text-foreground px-2"
              >
                Ikke nå
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Recommended */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Anbefalt for denne kunden</h3>
        <div className="space-y-2">
          {RECOMMENDATIONS.map(r => {
            const Icon = r.icon;
            return (
              <Card key={r.id} className="p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{r.title}</span>
                      {r.urgent && (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                          Tidskritisk
                        </Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-snug">{r.desc}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {r.ctas.map(cta => (
                        <Button
                          key={cta.label}
                          size="sm"
                          variant={cta.variant}
                          className="h-8 text-xs"
                          onClick={() => setOfferCtx({ open: true, serviceTitle: r.title, variant: cta.deliveryVariant })}
                        >
                          {cta.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Ongoing */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Pågående med denne kunden</h3>
          <span className="text-xs text-muted-foreground">{ONGOING.length} aktive</span>
        </div>
        <div className="space-y-2">
          {ONGOING.map(o => {
            const isPending = o.status === "pending";
            return (
              <Card key={o.id} className="p-3 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isPending ? "bg-warning/10" : "bg-success/10"
                  )}>
                    {isPending
                      ? <Clock className="h-4 w-4 text-warning" />
                      : <CheckCircle2 className="h-4 w-4 text-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{o.title}</p>
                    <p className="text-[12px] text-muted-foreground">{o.meta}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    isPending ? "bg-warning/10 text-warning border-warning/30" : "bg-success/10 text-success border-success/30"
                  )}>
                    {isPending ? "Venter" : "Akseptert"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <MSPCreateOfferDialog
        open={offerCtx.open}
        onOpenChange={(o) => setOfferCtx(s => ({ ...s, open: o }))}
        serviceTitle={offerCtx.serviceTitle}
        variant={offerCtx.variant}
      />
    </div>
  );
}
