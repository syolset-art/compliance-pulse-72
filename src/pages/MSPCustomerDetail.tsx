import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Building2, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusOverviewWidget } from "@/components/widgets/StatusOverviewWidget";
import { CriticalTasksWidget } from "@/components/widgets/CriticalTasksWidget";
import { DomainComplianceWidget } from "@/components/widgets/DomainComplianceWidget";
import { MSPAssessmentCard } from "@/components/msp/MSPAssessmentCard";
import { Wifi, Server } from "lucide-react";

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export default function MSPCustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Laster kundedata...</p>
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Kunde ikke funnet</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/msp-dashboard")}>
              Tilbake til partneroversikt
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const initials = customer.customer_name
    ?.split(" ")
    .map((w: string) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          {/* Back button */}
          <Button variant="ghost" onClick={() => navigate("/msp-dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tilbake til partneroversikt
          </Button>

          {/* Customer header */}
          <Card className="p-6">
            <div className="flex items-center gap-6">
              {customer.logo_url ? (
                <img src={customer.logo_url} alt={customer.customer_name} className="h-16 w-16 rounded-xl object-contain bg-muted p-2" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{initials}</span>
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">{customer.customer_name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  {customer.industry && <Badge variant="outline">{customer.industry}</Badge>}
                  {customer.employees && <Badge variant="outline">{customer.employees} ansatte</Badge>}
                <Badge variant="outline" className="border-primary/40 text-primary">
                    {customer.subscription_plan || "Gratis"}
                  </Badge>
                  {customer.active_frameworks?.map((fw: string) => (
                    <Badge key={fw} variant="secondary">{fw}</Badge>
                  ))}
                </div>
                {(customer.contact_person || customer.contact_email) && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {customer.contact_person && (
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{customer.contact_person}</span>
                    )}
                    {customer.contact_email && (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{customer.contact_email}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center">
                <span className={cn("text-4xl font-bold", getScoreColor(customer.compliance_score || 0))}>
                  {customer.compliance_score || 0}%
                </span>
                <p className="text-xs text-muted-foreground mt-1">Samsvar</p>
              </div>
            </div>
          </Card>

          {/* Assessment & Acronis row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MSPAssessmentCard
              customerId={customerId!}
              assessmentScore={customer.initial_assessment_score}
            />
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Acronis-status</h3>
              </div>
              {customer.has_acronis_integration ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-foreground">Tilkoblet</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {customer.acronis_device_count || 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">enheter beskyttet</span>
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Wifi className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Acronis ikke tilkoblet</p>
                  <p className="text-xs text-muted-foreground mt-1">Koble til for å importere enheter og backup-status</p>
                </div>
              )}
            </Card>
          </div>

          {/* Dashboard widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusOverviewWidget />
            <CriticalTasksWidget />
          </div>
          <DomainComplianceWidget />
        </div>
      </main>
    </div>
  );
}
