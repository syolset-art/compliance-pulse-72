import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface QuarterActivity {
  label_no: string;
  label_en: string;
  route: string;
  done?: boolean;
}

const QUARTERS: { key: string; label_no: string; label_en: string; activities: QuarterActivity[] }[] = [
  {
    key: "q1",
    label_no: "Q1 (Jan–Mar)",
    label_en: "Q1 (Jan–Mar)",
    activities: [
      { label_no: "Gap-analyse per domene", label_en: "Gap analysis per domain", route: "/compliance-checklist" },
      { label_no: "Scope-definisjon", label_en: "Scope definition", route: "/regulations" },
      { label_no: "Rollefordeling", label_en: "Role assignment", route: "/company-settings" },
    ],
  },
  {
    key: "q2",
    label_no: "Q2 (Apr–Jun)",
    label_en: "Q2 (Apr–Jun)",
    activities: [
      { label_no: "Risikovurdering", label_en: "Risk assessment", route: "/tasks?view=readiness" },
      { label_no: "Policy-utvikling", label_en: "Policy development", route: "/compliance-checklist" },
      { label_no: "Leverandøravtaler (DPA)", label_en: "Vendor agreements (DPA)", route: "/assets" },
    ],
  },
  {
    key: "q3",
    label_no: "Q3 (Jul–Sep)",
    label_en: "Q3 (Jul–Sep)",
    activities: [
      { label_no: "Kontrollimplementering", label_en: "Control implementation", route: "/compliance-checklist" },
      { label_no: "Opplæring og bevisstgjøring", label_en: "Training and awareness", route: "/mynder-me" },
      { label_no: "Overvåking og avvik", label_en: "Monitoring and deviations", route: "/deviations" },
    ],
  },
  {
    key: "q4",
    label_no: "Q4 (Okt–Des)",
    label_en: "Q4 (Oct–Dec)",
    activities: [
      { label_no: "Internrevisjon", label_en: "Internal audit", route: "/tasks?view=readiness" },
      { label_no: "Ledelsesgjennomgang", label_en: "Management review", route: "/reports" },
      { label_no: "Kontinuerlig forbedring", label_en: "Continuous improvement", route: "/tasks" },
    ],
  },
];

export function ComplianceCalendarSection() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";

  const currentQuarter = Math.floor(new Date().getMonth() / 3);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {isNorwegian ? "Årskalender for compliance" : "Annual compliance calendar"}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUARTERS.map((q, qi) => (
            <div
              key={q.key}
              className={cn(
                "rounded-lg border p-3 space-y-2",
                qi === currentQuarter
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {isNorwegian ? q.label_no : q.label_en}
                </span>
                {qi === currentQuarter && (
                  <span className="text-[10px] font-medium bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {isNorwegian ? "Nå" : "Now"}
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {q.activities.map((a, ai) => (
                  <li key={ai}>
                    <button
                      onClick={() => navigate(a.route)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-1.5 w-full"
                    >
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0 opacity-30" />
                      {isNorwegian ? a.label_no : a.label_en}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
