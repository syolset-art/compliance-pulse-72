import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: any;
  customers: any[];
  onSuccess: () => void;
}

export function AssignLicenseDialog({ open, onOpenChange, license, customers, onSuccess }: Props) {
  const [customerId, setCustomerId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!customerId || !license) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("msp_licenses" as any)
        .update({ assigned_customer_id: customerId, status: "assigned" } as any)
        .eq("id", license.id);
      if (error) throw error;
      toast.success("Lisens tildelt!");
      onSuccess();
      onOpenChange(false);
      setCustomerId("");
    } catch (e: any) {
      toast.error("Feil: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tildel lisens</DialogTitle>
          <DialogDescription>Lisensnøkkel: {license?.license_key}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>Velg kunde</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Velg en kunde..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleAssign} disabled={loading || !customerId}>
            {loading ? "Tildeler..." : "Tildel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
