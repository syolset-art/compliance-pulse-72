import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Inbox, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InboundRequestsContent } from "@/components/customer-requests/InboundRequestsContent";
import { OutboundRequestsTab } from "@/components/customer-requests/OutboundRequestsTab";

const CustomerRequests = () => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [topTab, setTopTab] = useState("inbound");
  const [wizardOpen, setWizardOpen] = useState(false);

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
                    ? "Håndter innkommende og utgående meldinger"
                    : "Manage inbound and outbound messages"}
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => { setTopTab("outbound"); setWizardOpen(true); }}>
                <Plus className="h-4 w-4" />
                {isNb ? "Ny melding" : "New message"}
              </Button>
            </div>

            <Tabs value={topTab} onValueChange={setTopTab}>
              <TabsList>
                <TabsTrigger value="inbound" className="gap-1.5">
                  <Inbox className="h-4 w-4" />
                  {isNb ? "Innkommende" : "Inbound"}
                </TabsTrigger>
                <TabsTrigger value="outbound" className="gap-1.5">
                  <Send className="h-4 w-4" />
                  {isNb ? "Utgående" : "Outbound"}
                </TabsTrigger>
              </TabsList>

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
