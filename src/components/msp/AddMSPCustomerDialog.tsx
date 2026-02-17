import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface AddMSPCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const INDUSTRIES = [
  "Teknologi", "Helse", "Finans", "Offentlig", "Utdanning",
  "Energi", "Bygg og anlegg", "Transport", "Handel", "Annet",
];

const EMPLOYEE_RANGES = [
  "1-10", "11-50", "51-200", "201-500", "500+",
];

const SUBSCRIPTION_PLANS = ["Gratis", "Basis", "Premium"];

const COMPANY_ROLES = [
  "Daglig leder",
  "IT-sjef / CTO",
  "Administrasjonsleder",
  "Avdelingsleder",
  "Annet",
];

const COMPLIANCE_ROLES = [
  "Compliance-ansvarlig",
  "Personvernombud (DPO)",
  "Sikkerhetsansvarlig (CISO)",
  "AI Governance-ansvarlig",
  "Operativ bruker",
  "Ingen spesifikk rolle",
];

export function AddMSPCustomerDialog({ open, onOpenChange, onSuccess }: AddMSPCustomerDialogProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    org_number: "",
    industry: "",
    employees: "",
    contact_person: "",
    contact_email: "",
    contact_company_role: "",
    contact_compliance_role: "",
    subscription_plan: "Gratis",
  });

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Kundenavn er påkrevd");
      return;
    }
    if (!user?.id) {
      toast.error("Du må være logget inn");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("msp_customers" as any).insert({
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
      });

      if (error) throw error;

      toast.success("Kunde lagt til!");
      setForm({ customer_name: "", org_number: "", industry: "", employees: "", contact_person: "", contact_email: "", contact_company_role: "", contact_compliance_role: "", subscription_plan: "Gratis" });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til kunde</DialogTitle>
          <DialogDescription>Registrer en ny kunde i din partneroversikt.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Kundenavn *</Label>
            <Input
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              placeholder="Firmanavn AS"
            />
          </div>
          <div>
            <Label>Org.nummer</Label>
            <Input
              value={form.org_number}
              onChange={(e) => setForm({ ...form, org_number: e.target.value })}
              placeholder="123 456 789"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bransje</Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue placeholder="Velg bransje" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Antall ansatte</Label>
              <Select value={form.employees} onValueChange={(v) => setForm({ ...form, employees: v })}>
                <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_RANGES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Kontaktperson</Label>
            <Input
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              placeholder="Navn Navnesen"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rolle i selskapet</Label>
              <Select value={form.contact_company_role} onValueChange={(v) => setForm({ ...form, contact_company_role: v })}>
                <SelectTrigger><SelectValue placeholder="Velg rolle" /></SelectTrigger>
                <SelectContent>
                  {COMPANY_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Compliance-rolle</Label>
              <Select value={form.contact_compliance_role} onValueChange={(v) => setForm({ ...form, contact_compliance_role: v })}>
                <SelectTrigger><SelectValue placeholder="Velg rolle" /></SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Abonnement</Label>
            <Select value={form.subscription_plan} onValueChange={(v) => setForm({ ...form, subscription_plan: v })}>
              <SelectTrigger><SelectValue placeholder="Velg plan" /></SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_PLANS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>E-post</Label>
            <Input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="kontakt@firma.no"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Lagrer..." : "Legg til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
