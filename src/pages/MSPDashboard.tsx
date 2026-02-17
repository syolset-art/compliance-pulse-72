import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MSPMetricsRow } from "@/components/msp/MSPMetricsRow";
import { MSPCustomerCard } from "@/components/msp/MSPCustomerCard";
import { AddMSPCustomerDialog } from "@/components/msp/AddMSPCustomerDialog";
import { MSPInvoicesTab } from "@/components/msp/MSPInvoicesTab";

export default function MSPDashboard() {
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const { data: customers = [], refetch } = useQuery({
    queryKey: ["msp-customers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Partneroversikt</h1>
              <p className="text-muted-foreground mt-1">Oversikt over dine kunder og deres compliance-status</p>
            </div>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til kunde
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="kunder" className="space-y-6">
            <TabsList>
              <TabsTrigger value="kunder">Kunder</TabsTrigger>
              <TabsTrigger value="fakturaer">Fakturaer</TabsTrigger>
            </TabsList>

            <TabsContent value="kunder" className="space-y-8">
              <MSPMetricsRow customers={customers} />

              {customers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg">Ingen kunder registrert ennå</p>
                  <p className="text-sm mt-1">Klikk «Legg til kunde» for å komme i gang</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {customers.map((c: any) => (
                    <MSPCustomerCard key={c.id} customer={c} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="fakturaer">
              <MSPInvoicesTab />
            </TabsContent>
          </Tabs>
        </div>

        <AddMSPCustomerDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />
      </main>
    </div>
  );
}
