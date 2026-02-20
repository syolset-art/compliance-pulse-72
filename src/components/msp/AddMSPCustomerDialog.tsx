import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Key, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import {
  INDUSTRIES, EMPLOYEE_RANGES, SUBSCRIPTION_PLANS, COMPANY_ROLES, COMPLIANCE_ROLES,
} from "@/lib/mspCustomerConstants";
import { MSPAssessmentStep } from "./MSPAssessmentStep";
import {
  type AssessmentResponse,
  calculateAssessmentScore,
} from "@/lib/mspAssessmentQuestions";

interface AddMSPCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMSPCustomerDialog({ open, onOpenChange, onSuccess }: AddMSPCustomerDialogProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [assessmentResponses, setAssessmentResponses] = useState<AssessmentResponse[]>([]);
  const [form, setForm] = useState({
    customer_name: "",
    org_number: "",
    industry: "",
    employees: "",
    contact_person: "",
    contact_email: "",
    contact_company_role: "",
    contact_compliance_role: "",
    subscription_plan: "Basis",
  });

  // Fetch license info
  const { data: licenseInfo } = useQuery({
    queryKey: ["msp-license-info", user?.id],
    queryFn: async () => {
      const { count: totalCount } = await supabase
        .from("msp_licenses" as any)
        .select("*", { count: "exact", head: true })
        .eq("msp_user_id", user!.id);

      const { data: availableLicenses } = await supabase
        .from("msp_licenses" as any)
        .select("id")
        .eq("msp_user_id", user!.id)
        .eq("status", "available")
        .order("created_at", { ascending: true });

      const total = totalCount || 0;
      const available = availableLicenses?.length || 0;
      const assigned = total - available;

      return { total, available, assigned, firstAvailableId: (availableLicenses as any)?.[0]?.id || null };
    },
    enabled: !!user?.id && open,
  });

  const resetDialog = () => {
    setStep(1);
    setAssessmentResponses([]);
    setForm({ customer_name: "", org_number: "", industry: "", employees: "", contact_person: "", contact_email: "", contact_company_role: "", contact_compliance_role: "", subscription_plan: "Basis" });
  };

  const handleGoToStep2 = () => {
    if (!form.customer_name.trim()) {
      toast.error("Kundenavn er påkrevd");
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Du må være logget inn");
      return;
    }

    setSaving(true);
    try {
      const assessmentScore = calculateAssessmentScore(assessmentResponses);

      const { data: customer, error } = await supabase.from("msp_customers" as any).insert({
        msp_user_id: user.id,
        customer_name: form.customer_name.trim(),
        org_number: form.org_number || null,
        industry: form.industry || null,
        employees: form.employees || null,
        contact_person: form.contact_person || null,
        contact_email: form.contact_email || null,
        contact_company_role: form.contact_company_role || null,
        contact_compliance_role: form.contact_compliance_role || null,
        compliance_score: 0,
        status: "onboarding",
        active_frameworks: [],
        subscription_plan: form.subscription_plan,
        initial_assessment_score: assessmentScore,
      } as any).select().single();

      if (error) throw error;

      // Save assessment responses
      if (assessmentResponses.length > 0 && customer) {
        const rows = assessmentResponses.map((r) => ({
          msp_customer_id: (customer as any).id,
          question_key: r.question_key,
          answer: r.answer,
          notes: r.notes || null,
          assessed_by: user.email || null,
        }));
        await supabase.from("msp_customer_assessments" as any).insert(rows as any);
      }

      // Auto-assign first available license
      if (licenseInfo?.firstAvailableId && customer) {
        await supabase
          .from("msp_licenses" as any)
          .update({ assigned_customer_id: (customer as any).id, status: "assigned" } as any)
          .eq("id", licenseInfo.firstAvailableId);
      }

      toast.success("Kunde lagt til!");
      resetDialog();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Kunne ikke legge til kunde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetDialog(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Legg til kunde" : "Compliance-kartlegging"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Registrer en ny kunde i din partneroversikt."
              : "Kartlegg kundens compliance-status for å lage en tilpasset handlingsplan."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        {step === 1 && (
          <>
            {/* License info banner */}
            {licenseInfo && licenseInfo.total > 0 && (
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${licenseInfo.available > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
                {licenseInfo.available > 0 ? (
                  <>
                    <Key className="h-4 w-4 shrink-0" />
                    <span>Lisens {licenseInfo.assigned + 1} av {licenseInfo.total} vil bli tildelt denne kunden</span>
                    <Badge variant="secondary" className="ml-auto">{licenseInfo.available} ledig{licenseInfo.available !== 1 ? "e" : ""}</Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Ingen tilgjengelige lisenser. Kunden opprettes uten lisens.</span>
                  </>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Kundenavn *</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Firmanavn AS" />
              </div>
              <div>
                <Label>Org.nummer</Label>
                <Input value={form.org_number} onChange={(e) => setForm({ ...form, org_number: e.target.value })} placeholder="123 456 789" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bransje</Label>
                  <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                    <SelectTrigger><SelectValue placeholder="Velg bransje" /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Antall ansatte</Label>
                  <Select value={form.employees} onValueChange={(v) => setForm({ ...form, employees: v })}>
                    <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                    <SelectContent>{EMPLOYEE_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Kontaktperson</Label>
                <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Navn Navnesen" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rolle i selskapet</Label>
                  <Select value={form.contact_company_role} onValueChange={(v) => setForm({ ...form, contact_company_role: v })}>
                    <SelectTrigger><SelectValue placeholder="Velg rolle" /></SelectTrigger>
                    <SelectContent>{COMPANY_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Compliance-rolle</Label>
                  <Select value={form.contact_compliance_role} onValueChange={(v) => setForm({ ...form, contact_compliance_role: v })}>
                    <SelectTrigger><SelectValue placeholder="Velg rolle" /></SelectTrigger>
                    <SelectContent>{COMPLIANCE_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Abonnement</Label>
                <Select value={form.subscription_plan} onValueChange={(v) => setForm({ ...form, subscription_plan: v })}>
                  <SelectTrigger><SelectValue placeholder="Velg plan" /></SelectTrigger>
                  <SelectContent>{SUBSCRIPTION_PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>E-post</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="kontakt@firma.no" />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <MSPAssessmentStep
            responses={assessmentResponses}
            onChange={setAssessmentResponses}
          />
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Tilbake
            </Button>
          )}
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => { resetDialog(); onOpenChange(false); }}>Avbryt</Button>
              <Button onClick={handleGoToStep2} className="gap-1">
                Neste: Kartlegging <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleSave} disabled={saving}>
                Hopp over kartlegging
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Lagrer..." : "Legg til kunde"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
