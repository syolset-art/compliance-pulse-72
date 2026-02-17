import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: any;
  onSuccess: () => void;
}

export function AssignLicenseDialog({ open, onOpenChange, license, onSuccess }: Props) {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = customerName.trim().length > 0 && contactEmail.trim().length > 0 && contactEmail.includes("@");

  const handleAssign = async () => {
    if (!isValid || !license || !user?.id) return;
    setLoading(true);
    try {
      // Create customer record
      const { data: customer, error: customerError } = await supabase
        .from("msp_customers" as any)
        .insert({
          msp_user_id: user.id,
          customer_name: customerName.trim(),
          contact_person: contactPerson.trim() || null,
          contact_email: contactEmail.trim(),
          status: "onboarding",
          subscription_plan: "SMB",
        } as any)
        .select()
        .single();

      if (customerError) throw customerError;

      // Assign license to new customer
      const { error: licenseError } = await supabase
        .from("msp_licenses" as any)
        .update({ assigned_customer_id: (customer as any).id, status: "assigned" } as any)
        .eq("id", license.id);

      if (licenseError) throw licenseError;

      toast.success(`Lisens tildelt ${customerName.trim()}. Onboarding-e-post sendes.`);
      onSuccess();
      onOpenChange(false);
      setCustomerName("");
      setContactPerson("");
      setContactEmail("");
    } catch (e: any) {
      toast.error("Feil: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-person">Kontaktperson</Label>
            <Input
              id="contact-person"
              placeholder="Ola Nordmann"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">E-post *</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="kontakt@firma.no"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
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
