import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Key, Package, ShoppingCart, Tag, ChevronDown, UserPlus } from "lucide-react";
import { PurchaseLicensesDialog } from "./PurchaseLicensesDialog";
import { AssignLicenseDialog } from "./AssignLicenseDialog";
import { formatKr } from "@/lib/mspLicenseUtils";

export function MSPLicensesTab() {
  const { user } = useAuth();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [assignLicense, setAssignLicense] = useState<any>(null);

  const { data: purchases = [], refetch } = useQuery({
    queryKey: ["msp-license-purchases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_license_purchases" as any)
        .select("*")
        .order("purchased_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const { data: licenses = [], refetch: refetchLicenses } = useQuery({
    queryKey: ["msp-licenses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_licenses" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["msp-customers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .order("customer_name");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const totalLicenses = licenses.length;
  const assigned = licenses.filter((l: any) => l.status === "assigned").length;
  const available = licenses.filter((l: any) => l.status === "available").length;
  const avgDiscount = purchases.length > 0
    ? Math.round(purchases.reduce((s: number, p: any) => s + (p.discount_percent || 0), 0) / purchases.length)
    : 0;

  const customerMap = Object.fromEntries(customers.map((c: any) => [c.id, c.customer_name]));

  const handleRefresh = () => {
    refetch();
    refetchLicenses();
  };

  const statusLabel: Record<string, { text: string; variant: "default" | "secondary" | "destructive" }> = {
    active: { text: "Aktiv", variant: "default" },
    expired: { text: "Utløpt", variant: "destructive" },
    renewed: { text: "Fornyet", variant: "secondary" },
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Totalt lisenser" value={totalLicenses} icon={Key} />
        <MetricCard title="Tildelte" value={assigned} icon={Package} />
        <MetricCard title="Tilgjengelige" value={available} icon={ShoppingCart} />
        <MetricCard title="Gj.snitt rabatt" value={`${avgDiscount}%`} icon={Tag} />
      </div>

      {/* Buy button */}
      <div className="flex justify-end">
        <Button onClick={() => setPurchaseOpen(true)}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Kjøp lisenser
        </Button>
      </div>

      {/* Purchases table */}
      {purchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Key className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg">Ingen lisenser kjøpt ennå</p>
            <p className="text-sm mt-1">Klikk «Kjøp lisenser» for å komme i gang</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Dato</TableHead>
                <TableHead>Antall</TableHead>
                <TableHead>Rabatt</TableHead>
                <TableHead>Pris/lisens</TableHead>
                <TableHead>Totalt</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((p: any) => {
                const purchaseLicenses = licenses.filter((l: any) => l.purchase_id === p.id);
                const cfg = statusLabel[p.status] || statusLabel.active;
                const pricePerLicense = Math.round(p.unit_price * (1 - p.discount_percent / 100));

                return (
                  <Collapsible key={p.id} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell><ChevronDown className="h-4 w-4 text-muted-foreground" /></TableCell>
                          <TableCell>{new Date(p.purchased_at).toLocaleDateString("nb-NO")}</TableCell>
                          <TableCell>{p.quantity}</TableCell>
                          <TableCell><Badge variant="secondary">{p.discount_percent}%</Badge></TableCell>
                          <TableCell>{formatKr(pricePerLicense)}</TableCell>
                          <TableCell className="font-medium">{formatKr(p.total_amount)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(p.period_start).toLocaleDateString("nb-NO")} – {new Date(p.period_end).toLocaleDateString("nb-NO")}
                          </TableCell>
                          <TableCell><Badge variant={cfg.variant}>{cfg.text}</Badge></TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <tr>
                          <td colSpan={8} className="p-0">
                            <div className="bg-muted/30 px-8 py-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Individuelle lisenser</p>
                              <div className="space-y-1">
                                {purchaseLicenses.map((l: any) => (
                                  <div key={l.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-background">
                                    <code className="text-xs">{l.license_key}</code>
                                    {l.status === "assigned" ? (
                                      <Badge variant="outline">{customerMap[l.assigned_customer_id] || "Tildelt"}</Badge>
                                    ) : (
                                      <Button size="sm" variant="ghost" onClick={() => setAssignLicense(l)}>
                                        <UserPlus className="h-3 w-3 mr-1" />
                                        Tildel
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PurchaseLicensesDialog open={purchaseOpen} onOpenChange={setPurchaseOpen} onSuccess={handleRefresh} />
      {assignLicense && (
        <AssignLicenseDialog
          open={!!assignLicense}
          onOpenChange={(open) => !open && setAssignLicense(null)}
          license={assignLicense}
          customers={customers}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
