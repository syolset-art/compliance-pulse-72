import { useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmailOfferView } from "@/components/msp/customer-view/EmailOfferView";
import { PublicProfileView } from "@/components/msp/customer-view/PublicProfileView";
import { GrantAuthorityView } from "@/components/msp/customer-view/GrantAuthorityView";
import { HandoverEmailView } from "@/components/msp/customer-view/HandoverEmailView";
import { DeliveryReportView } from "@/components/msp/customer-view/DeliveryReportView";
import { Eye, Mail, ArrowRight } from "lucide-react";

type ViewTab = "email-offer" | "public-profile" | "grant-authority" | "handover" | "report" | "email-templates";

export default function MSPCustomerView() {
  const [tab, setTab] = useState<ViewTab>("email-offer");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <header className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Eye className="h-3.5 w-3.5" />
              Intern referansevisning
            </div>
            <h1 className="text-3xl font-bold text-foreground">Kundevisning</h1>
            <p className="text-base text-foreground/80 mt-1 leading-relaxed max-w-3xl">
              Slik ser tilbudet og leveransen ut fra kundens side. Bruk dette som referanse
              når du implementerer touchpoints — hver visning peker til riktig komponent og
              forklarer hva som trigger den.
            </p>
          </header>

          <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)} className="space-y-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="email-offer">1. Tilbud (e-post)</TabsTrigger>
              <TabsTrigger value="public-profile">2. Trust Profile (offentlig)</TabsTrigger>
              <TabsTrigger value="grant-authority">3. Gi fullmakt</TabsTrigger>
              <TabsTrigger value="handover">4. Overlevering (e-post)</TabsTrigger>
              <TabsTrigger value="report">5. Leveranserapport (PDF)</TabsTrigger>
              <TabsTrigger value="email-templates">6. E-postmaler</TabsTrigger>
            </TabsList>

            <TabsContent value="email-offer"><EmailOfferView /></TabsContent>
            <TabsContent value="public-profile"><PublicProfileView /></TabsContent>
            <TabsContent value="grant-authority"><GrantAuthorityView /></TabsContent>
            <TabsContent value="handover"><HandoverEmailView /></TabsContent>
            <TabsContent value="report"><DeliveryReportView /></TabsContent>
            <TabsContent value="email-templates">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground">E-postmaler</h2>
                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                      Gjenbrukbar layout med Mynder-logo, tydelig CTA og enhetlig footer. Brukes for
                      Tilbud, Trust Profile (leverandør) og Kunde Profile — på norsk og engelsk.
                    </p>
                  </div>
                </div>
                <Button asChild className="gap-2">
                  <Link to="/emails">
                    Åpne e-postmaler
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
