import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import TrustCenterProfile from "./TrustCenterProfile";

export default function MSPCustomerTrustProfile() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const { data: customer } = useQuery({
    queryKey: ["msp-customer", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!customerId,
  });

  // Find matching asset by customer name
  const { data: matchedAsset, isLoading } = useQuery({
    queryKey: ["msp-customer-asset", customer?.customer_name],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("*")
        .or(`asset_type.eq.vendor,asset_type.eq.self`)
        .ilike("name", `%${customer.customer_name}%`)
        .limit(1)
        .single();
      return data;
    },
    enabled: !!customer?.customer_name,
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        {/* Partner banner */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-3">
          <div className="container max-w-4xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/msp-dashboard/${customerId}`)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </Button>
            <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Partnervisning — {customer?.customer_name || "Kunde"}
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : matchedAsset ? (
          <TrustCenterProfile assetId={matchedAsset.id} readOnly />
        ) : (
          <div className="container max-w-4xl mx-auto py-8 px-4 md:px-8">
            <Card className="p-8 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Ingen Trust Profile funnet</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Det finnes ingen registrert Trust Profile for {customer?.customer_name || "denne kunden"} ennå.
                Kunden må opprette sin profil via onboarding, eller du kan opprette en på deres vegne.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => navigate(`/msp-dashboard/${customerId}`)}>
                  Tilbake
                </Button>
                <Button onClick={() => navigate("/trust-engine")}>
                  Åpne Trust Engine
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
