import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ClipboardList, ArrowRight, Loader2 } from "lucide-react";
import { MSPAssessmentStep } from "@/components/msp/MSPAssessmentStep";
import type { AssessmentResponse } from "@/lib/mspAssessmentQuestions";
import { MSP_ASSESSMENT_QUESTIONS, calculateAssessmentScore } from "@/lib/mspAssessmentQuestions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  customerId: string;
  customerName: string;
  onCompleted?: () => void;
}

/**
 * Frivillig fordypning etter at kunden er opprettet — samme 15 spørsmål som
 * tidligere lå i onboarding, men nå separert ut som en dedikert kartlegging
 * på kundens profil. Skårer og lagres på msp_customers.
 */
export function ComplianceMappingCard({ customerId, customerName, onCompleted }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [saving, setSaving] = useState(false);

  const answered = responses.length;
  const total = MSP_ASSESSMENT_QUESTIONS.length;
  const done = answered === total;

  const handleSave = async () => {
    if (!user || !done) return;
    setSaving(true);
    try {
      const score = calculateAssessmentScore(responses);
      await supabase.from("msp_customer_assessments").insert(
        responses.map((r) => ({
          msp_customer_id: customerId,
          question_key: r.question_key,
          answer: r.answer,
          notes: r.notes || null,
          assessed_by: user.id,
        })) as any
      );
      await supabase
        .from("msp_customers")
        .update({ compliance_score: score } as any)
        .eq("id", customerId);
      toast.success("Kartlegging lagret");
      setOpen(false);
      onCompleted?.();
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke lagre kartlegging");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="p-4 flex items-center justify-between gap-4 border-border/60">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Compliance-kartlegging</p>
            <p className="text-xs text-muted-foreground">
              15 spørsmål om styring, drift, personvern og tredjeparter — presiserer Laras anbefalinger.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1 shrink-0">
          Start <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Compliance-kartlegging</SheetTitle>
            <SheetDescription>{customerName}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <MSPAssessmentStep responses={responses} onChange={setResponses} />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                {answered}/{total} besvart
              </p>
              <Button onClick={handleSave} disabled={!done || saving} size="sm">
                {saving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Lagrer...</>
                ) : (
                  "Lagre kartlegging"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
