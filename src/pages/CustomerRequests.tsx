import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Inbox, Send, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InboundRequestsContent } from "@/components/customer-requests/InboundRequestsContent";
import { OutboundRequestsTab } from "@/components/customer-requests/OutboundRequestsTab";
import { LaraInboxContent } from "@/components/customer-requests/LaraInboxContent";

const CustomerRequests = () => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "lara";
  const [topTab, setTopTab] = useState(initialTab);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== topTab) setTopTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (v: string) => {
    setTopTab(v);
    setSearchParams((prev) => { prev.set("tab", v); return prev; }, { replace: true });
  };

  // Tellinger til badge på fanene
  const { data: laraCount = 0 } = useQuery({
    queryKey: ["lara-inbox-pending-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("lara_inbox")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "auto_matched"]);
      return count || 0;
    },
    refetchInterval: 15000,
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isNb ? "Meldinger" : "Messages"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isNb
                    ? "Lara-innboks, innkommende og utgående meldinger"
                    : "Lara inbox, inbound and outbound messages"}
                </p>
              </div>
              {topTab === "outbound" && (
                <Button size="sm" className="gap-1.5" onClick={() => setWizardOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {isNb ? "Ny melding" : "New message"}
                </Button>
              )}
            </div>

            <Tabs value={topTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="lara" className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  {isNb ? "Lara-innboks" : "Lara inbox"}
                  {laraCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">{laraCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="inbound" className="gap-1.5">
                  <Inbox className="h-4 w-4" />
                  {isNb ? "Innkommende" : "Inbound"}
                </TabsTrigger>
                <TabsTrigger value="outbound" className="gap-1.5">
                  <Send className="h-4 w-4" />
                  {isNb ? "Utgående" : "Outbound"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lara" className="mt-6">
                <LaraInboxContent />
              </TabsContent>

              <TabsContent value="inbound" className="mt-6">
                <InboundRequestsContent />
              </TabsContent>

              <TabsContent value="outbound" className="mt-6">
                <OutboundRequestsTab wizardOpen={wizardOpen} onWizardOpenChange={setWizardOpen} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CustomerRequests;
