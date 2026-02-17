import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getDiscountPercent, UNIT_PRICE_ORE, UNIT_PRICE_KR, formatKr } from "@/lib/mspLicenseUtils";
import { Minus, Plus, Tag } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PurchaseLicensesDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const discount = getDiscountPercent(quantity);
  const listTotal = quantity * UNIT_PRICE_ORE;
  const discountAmount = Math.round(listTotal * (discount / 100));
  const totalAfterDiscount = listTotal - discountAmount;
  const pricePerLicense = Math.round(UNIT_PRICE_ORE * (1 - discount / 100));

  const handlePurchase = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const now = new Date();
      const periodStart = now.toISOString().split("T")[0];
      const periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split("T")[0];

      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("msp_license_purchases" as any)
        .insert({
          msp_user_id: user.id,
          quantity,
          unit_price: UNIT_PRICE_ORE,
          discount_percent: discount,
          total_amount: totalAfterDiscount,
          period_start: periodStart,
          period_end: periodEnd,
          status: "active",
        } as any)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create individual licenses
      const licenses = Array.from({ length: quantity }, () => ({
        purchase_id: (purchase as any).id,
        msp_user_id: user.id,
        period_start: periodStart,
        period_end: periodEnd,
        status: "available",
      }));

      const { error: licensesError } = await supabase
        .from("msp_licenses" as any)
        .insert(licenses as any);

      if (licensesError) throw licensesError;

      // Create invoice
      const invoiceNumber = `MYN-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      await supabase.from("msp_invoices" as any).insert({
        msp_user_id: user.id,
        invoice_number: invoiceNumber,
        amount: totalAfterDiscount,
        description: `${quantity}x SMB-lisens (${discount}% rabatt)`,
        due_date: dueDate,
        status: "pending",
      } as any);

      toast.success(`${quantity} lisenser kjøpt med ${discount}% rabatt!`);
      onSuccess();
      onOpenChange(false);
      setQuantity(1);
    } catch (e: any) {
      toast.error("Feil ved kjøp: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kjøp lisenser</DialogTitle>
          <DialogDescription>SMB-lisens (inntil 20 systemer) – {UNIT_PRICE_KR.toLocaleString("nb-NO")} kr/år</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Quantity selector */}
          <div className="space-y-2">
            <Label>Antall lisenser</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {discount}% rabatt
              </Badge>
            </div>
          </div>

          {/* Discount tiers info */}
          <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
            <p className="font-medium text-muted-foreground">Rabattstruktur:</p>
            {[
              { range: "1–2 lisenser", pct: 20 },
              { range: "3 lisenser", pct: 30 },
              { range: "4 lisenser", pct: 40 },
              { range: "5+ lisenser", pct: 50 },
            ].map((t) => (
              <div key={t.pct} className={`flex justify-between ${discount === t.pct ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                <span>{t.range}</span>
                <span>{t.pct}%</span>
              </div>
            ))}
          </div>

          {/* Price summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Listepris ({quantity}×{UNIT_PRICE_KR.toLocaleString("nb-NO")} kr)</span>
              <span>{formatKr(listTotal)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Rabatt ({discount}%)</span>
              <span>-{formatKr(discountAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Totalt</span>
              <span>{formatKr(totalAfterDiscount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Pris per lisens</span>
              <span>{formatKr(pricePerLicense)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handlePurchase} disabled={loading}>
            {loading ? "Behandler..." : "Bekreft kjøp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
