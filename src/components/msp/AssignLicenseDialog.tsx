import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  INDUSTRIES, EMPLOYEE_RANGES, SUBSCRIPTION_PLANS, COMPANY_ROLES, COMPLIANCE_ROLES,
} from "@/lib/mspCustomerConstants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: any;
  onSuccess: () => void;
}

export function AssignLicenseDialog({ open, onOpenChange, license, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    org_number: "",
    industry: "",
    employees: "",
    contact_person: "",
    contact_email: "",
    contact_company_role: "",
    contact_compliance_role: "",
    subscription_plan: "SMB",
  });

  const isValid = form.customer_name.trim().length > 0 && form.contact_email.trim().length > 0 && form.contact_email.includes("@");

  const handleAssign = async () => {
    if (!isValid || !license || !user?.id) return;
    setLoading(true);
    try {
      const { data: customer, error: customerError } = await supabase
        .from("msp_customers" as any)
        .insert({
          msp_user_id: user.id,
          customer_name: form.customer_name.trim(),
          org_number: form.org_number || null,
          industry: form.industry || null,
          employees: form.employees || null,
          contact_person: form.contact_person.trim() || null,
          contact_email: form.contact_email.trim(),
          contact_company_role: form.contact_company_role || null,
          contact_compliance_role: form.contact_compliance_role || null,
          status: "onboarding",
          subscription_plan: form.subscription_plan,
        } as any)
        .select()
        .single();

      if (customerError) throw customerError;

      const { error: licenseError } = await supabase
        .from("msp_licenses" as any)
        .update({ assigned_customer_id: (customer as any).id, status: "assigned" } as any)
        .eq("id", license.id);

      if (licenseError) throw licenseError;

      toast.success(`Lisens tildelt ${form.customer_name.trim()}. Onboarding-e-post sendes.`);
      onSuccess();
      onOpenChange(false);
      setForm({ customer_name: "", org_number: "", industry: "", employees: "", contact_person: "", contact_email: "", contact_company_role: "", contact_compliance_role: "", subscription_plan: "SMB" });
    } catch (e: any) {
      toast.error("Feil: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tildel lisens til ny kunde</DialogTitle>
          <DialogDescription>Lisensnøkkel: {license?.license_key}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Bedriftsnavn *</Label>
            <Input
              id="customer-name"
              placeholder="Firma AS"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-number">Org.nummer</Label>
            <Input
              id="org-number"
              placeholder="123 456 789"
              value={form.org_number}
              onChange={(e) => setForm({ ...form, org_number: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="contact-person">Kontaktperson</Label>
            <Input
              id="contact-person"
              placeholder="Ola Nordmann"
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="contact-email">E-post *</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="kontakt@firma.no"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground">Kunden mottar en e-post med invitasjon til onboarding</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleAssign} disabled={loading || !isValid}>
            {loading ? "Tildeler..." : "Tildel og inviter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
