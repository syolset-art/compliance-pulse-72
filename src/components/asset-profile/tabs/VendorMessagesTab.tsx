import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Inbox, Send, Plus } from "lucide-react";
import { UnifiedInboxContent } from "@/components/customer-requests/UnifiedInboxContent";
import { OutboundRequestsTab } from "@/components/customer-requests/OutboundRequestsTab";

interface VendorMessagesTabProps {
  assetId: string;
  assetName: string;
}

export function VendorMessagesTab({ assetId, assetName }: VendorMessagesTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [tab, setTab] = useState("inbox");
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isNb
            ? `Meldinger utvekslet mellom deg og ${assetName}.`
            : `Messages exchanged between you and ${assetName}.`}
        </p>
        <Button size="sm" onClick={() => { setTab("outbound"); setWizardOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          {isNb ? "Ny melding" : "New message"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="h-4 w-4" />
            {isNb ? "Innboks" : "Inbox"}
          </TabsTrigger>
          <TabsTrigger value="outbound" className="gap-1.5">
            <Send className="h-4 w-4" />
            {isNb ? "Utgående" : "Outbound"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <UnifiedInboxContent
            assetId={assetId}
            vendorName={assetName}
            emptyMessage={isNb ? `Ingen meldinger fra ${assetName} ennå` : `No messages from ${assetName} yet`}
          />
        </TabsContent>

        <TabsContent value="outbound" className="mt-4">
          <OutboundRequestsTab
            assetId={assetId}
            vendorName={assetName}
            hideRetentionNote
            wizardOpen={wizardOpen}
            onWizardOpenChange={setWizardOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
