import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getDiscountPercent, LICENSE_TIERS, formatKr, LicenseTier } from "@/lib/mspLicenseUtils";
import { Minus, Plus, Tag } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PurchaseLicensesDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const [selectedTierId, setSelectedTierId] = useState(LICENSE_TIERS[0].id);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const tier = LICENSE_TIERS.find((t) => t.id === selectedTierId) || LICENSE_TIERS[0];
  const discount = getDiscountPercent(quantity);
  const listTotal = quantity * tier.priceOre;
  const discountAmount = Math.round(listTotal * (discount / 100));
  const totalAfterDiscount = listTotal - discountAmount;
  const pricePerLicense = Math.round(tier.priceOre * (1 - discount / 100));

  const handlePurchase = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const now = new Date();
      const periodStart = now.toISOString().split("T")[0];
      const periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split("T")[0];

      const { data: purchase, error: purchaseError } = await supabase
        .from("msp_license_purchases" as any)
        .insert({
          msp_user_id: user.id,
          quantity,
          unit_price: tier.priceOre,
          discount_percent: discount,
          total_amount: totalAfterDiscount,
          period_start: periodStart,
          period_end: periodEnd,
          status: "active",
        } as any)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

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

      const invoiceNumber = `MYN-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      await supabase.from("msp_invoices" as any).insert({
        msp_user_id: user.id,
        invoice_number: invoiceNumber,
        amount: totalAfterDiscount,
        description: `${quantity}x ${tier.name}-lisens (${discount}% rabatt)`,
        due_date: dueDate,
        status: "pending",
      } as any);

      toast.success(`${quantity} ${tier.name}-lisenser kjøpt med ${discount}% rabatt!`);
      onSuccess();
      onOpenChange(false);
      setQuantity(1);
      setTermsAccepted(false);
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
          <DialogDescription>Velg lisenstype og antall for dine kunder</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Tier selector */}
          <div className="space-y-2">
            <Label>Lisenstype</Label>
            <RadioGroup value={selectedTierId} onValueChange={setSelectedTierId} className="grid grid-cols-2 gap-3">
              {LICENSE_TIERS.map((t) => (
                <label
                  key={t.id}
                  className={`relative flex flex-col rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                    selectedTierId === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <RadioGroupItem value={t.id} className="sr-only" />
                  <span className="font-semibold text-sm">{t.name}</span>
                  <span className="text-xs text-muted-foreground">Inntil {t.maxSystems} systemer</span>
                  <span className="text-sm font-medium mt-1">{t.priceKr.toLocaleString("nb-NO")} kr/år</span>
                  <span className="text-xs text-muted-foreground">+{t.extraSystemKr} kr/mnd per ekstra system</span>
                </label>
              ))}
            </RadioGroup>
          </div>

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
              <span className="text-muted-foreground">Listepris ({quantity}×{tier.priceKr.toLocaleString("nb-NO")} kr)</span>
              <span>{formatKr(listTotal)}</span>
            </div>
            <div className="flex justify-between text-status-closed">
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

          {/* Terms & conditions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Vilkår for lisenskjøp</Label>
            <ScrollArea className="h-40 rounded-lg border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground space-y-3 pr-3">
                <p>Vederlag for avtalte ytelser faktureres forskuddsvis pr kvartal og med 14 dagers forfall (om ønskelig månedlig). Første gang ved Oppstartsdato.</p>
                <p>Vederlag basert på medgått tid faktureres etterskuddsvis, med 14 dagers forfall.</p>
                <p>Fakturaer skal være spesifisert slik at Kunden enkelt kan kontrollere fakturaen i forhold til det avtalte vederlag. Fakturaer for løpende timer har detaljert spesifikasjon over påløpte timer. Utlegg angis særskilt.</p>
                <p className="font-medium text-foreground">Leverandøren kan regulere prisene i prisbilaget (og eventuelle andre priser) i samsvar med konsumprisindeksen 31. desember hvert år med virkning for neste kalenderår. Indeksen skal baseres på endringen i indeksen foregående kalenderår (siste kjente indeks benyttes).</p>
                <p>Priser kan justeres ved endringer i offentlige avgifter eller andre myndighetspålagte krav/regler/vedtak som innebærer kostnadsøkninger for Leverandør. Videre kan priser justeres ved andre forhold som medfører vesentlige endringer i kostnadsbildet utenfor Leverandørs kontroll. Prisjusteringer som nevnt i dette avsnittet varsles senest en måned før endringen trer i kraft, og skal ikke overstige dokumentert kostnadsøkning for Leverandør. På forespørsel skal dokumentasjonen kunne fremlegges.</p>
              </div>
            </ScrollArea>
            <div className="flex items-start gap-2">
              <Checkbox
                id="accept-terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="accept-terms" className="text-sm cursor-pointer leading-tight">
                Jeg har lest og godkjenner vilkårene for lisenskjøp
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setTermsAccepted(false); }}>Avbryt</Button>
          <Button onClick={handlePurchase} disabled={loading || !termsAccepted}>
            {loading ? "Behandler..." : "Bekreft kjøp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
