import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount, generateInvoicePdf } from "./generateInvoicePdf";

export function MSPInvoicesTab() {
  const { user } = useAuth();

  const { data: invoices = [] } = useQuery({
    queryKey: ["msp-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_invoices" as any)
        .select("*")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const statusConfig: Record<string, { label: string; variant: "action" | "warning" | "destructive" }> = {
    paid: { label: "Betalt", variant: "action" },
    pending: { label: "Ubetalt", variant: "warning" },
    overdue: { label: "Forfalt", variant: "destructive" },
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-lg">Ingen fakturaer ennå</p>
        <p className="text-sm mt-1">Fakturaer vises her når du kjøper lisenser</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fakturanr.</TableHead>
            <TableHead>Beskrivelse</TableHead>
            <TableHead>Beløp</TableHead>
            <TableHead>Dato</TableHead>
            <TableHead>Forfallsdato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Last ned</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv: any) => {
            const cfg = statusConfig[inv.status] || statusConfig.pending;
            return (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                <TableCell>{inv.description || "-"}</TableCell>
                <TableCell>{formatAmount(inv.amount)}</TableCell>
                <TableCell>{new Date(inv.issued_at).toLocaleDateString("nb-NO")}</TableCell>
                <TableCell>{new Date(inv.due_date).toLocaleDateString("nb-NO")}</TableCell>
                <TableCell>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => generateInvoicePdf(inv)}
                    title="Last ned PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
