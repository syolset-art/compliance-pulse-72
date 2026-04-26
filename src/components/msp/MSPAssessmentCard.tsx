import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MSP_ASSESSMENT_QUESTIONS,
  getAssessmentGaps,
  type AssessmentResponse,
} from "@/lib/mspAssessmentQuestions";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MSPAssessmentCardProps {
  customerId: string;
  assessmentScore?: number;
}

const IMPACT_ICONS: Record<string, { label: string; route: string }> = {
  risk_module: { label: "Risikovurdering", route: "/tasks?view=readiness" },
  acronis_backup: { label: "Backup & Acronis", route: "/assets" },
  gdpr_checklist: { label: "GDPR-sjekkliste", route: "/compliance-checklist" },
  deviation_module: { label: "Avvikshåndtering", route: "/deviations" },
  vendor_management: { label: "Leverandørstyring", route: "/assets" },
  mynder_me_courses: { label: "Opplæring", route: "/mynder-me" },
};

export function MSPAssessmentCard({ customerId, assessmentScore }: MSPAssessmentCardProps) {
  const { data: assessments } = useQuery({
    queryKey: ["msp-customer-assessments", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customer_assessments" as any)
        .select("*")
        .eq("msp_customer_id", customerId);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  if (!assessments || assessments.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-6 text-center">
          <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Ingen compliance-kartlegging gjennomført ennå
          </p>
        </CardContent>
      </Card>
    );
  }

  const responses: AssessmentResponse[] = assessments.map((a: any) => ({
    question_key: a.question_key,
    answer: a.answer,
  }));

  const gaps = getAssessmentGaps(responses);
  const yesCount = responses.filter((r) => r.answer === "yes").length;
  const noCount = responses.filter((r) => r.answer === "no").length;
  const unsureCount = responses.filter((r) => r.answer === "unsure").length;
  const score = assessmentScore ?? Math.round((yesCount / MSP_ASSESSMENT_QUESTIONS.length) * 100);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Compliance-kartlegging</h3>
          </div>
          <Badge
            variant="outline"
            className={cn(
              score >= 80
                ? "border-status-closed/40 text-status-closed"
                : score >= 50
                ? "border-warning/40 text-warning"
                : "border-destructive/40 text-destructive"
            )}
          >
            {score}% dekket
          </Badge>
        </div>

        <Progress value={score} className="h-2" />

        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-status-closed dark:text-status-closed">
            <CheckCircle2 className="h-3.5 w-3.5" /> {yesCount} Ja
          </span>
          <span className="flex items-center gap-1 text-destructive dark:text-destructive">
            <XCircle className="h-3.5 w-3.5" /> {noCount} Nei
          </span>
          <span className="flex items-center gap-1 text-warning dark:text-warning">
            <HelpCircle className="h-3.5 w-3.5" /> {unsureCount} Usikker
          </span>
        </div>

        {gaps.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Identifiserte mangler
            </p>
            <div className="space-y-1.5">
              {gaps.map((gap) => {
                const impact = IMPACT_ICONS[gap.impact_area];
                return (
                  <div
                    key={gap.key}
                    className="flex items-center gap-2 text-sm p-2 rounded-md bg-destructive/5 border border-destructive/10"
                  >
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span className="flex-1 text-foreground">{gap.question_no}</span>
                    {impact && (
                      <Badge variant="secondary" className="text-[13px] shrink-0">
                        {impact.label}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
