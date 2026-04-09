import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Inbox, Send, BookOpen, Network } from "lucide-react";
import { InboundRequestsContent } from "@/components/customer-requests/InboundRequestsContent";
import { OutboundRequestsTab } from "@/components/customer-requests/OutboundRequestsTab";
import { TemplateLibrary } from "@/components/customer-requests/TemplateLibrary";
import { NetworkTab } from "@/components/customer-requests/NetworkTab";

const CustomerRequests = () => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [topTab, setTopTab] = useState("inbound");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-11">
          <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isNb ? "Forespørsler" : "Requests"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isNb
                  ? "Håndter innkommende og utgående compliance-forespørsler"
                  : "Manage inbound and outbound compliance requests"}
              </p>
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
                <TabsTrigger value="network" className="gap-1.5">
                  <Network className="h-4 w-4" />
                  {isNb ? "Nettverk" : "Network"}
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {isNb ? "Dokumentmaler" : "Templates"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inbound" className="mt-6">
                <InboundRequestsContent />
              </TabsContent>

              <TabsContent value="outbound" className="mt-6">
                <OutboundRequestsTab />
              </TabsContent>

              <TabsContent value="network" className="mt-6">
                <NetworkTab />
              </TabsContent>

              <TabsContent value="templates" className="mt-6">
                <TemplateLibrary />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CustomerRequests;
