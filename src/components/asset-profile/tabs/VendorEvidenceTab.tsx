import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { DocumentsTab } from "./DocumentsTab";
import { ApprovalSuccessDialog } from "@/components/ApprovalSuccessDialog";
import { InboxPreviewDialog } from "./InboxPreviewDialog";
import { useVendorInbox } from "@/hooks/useVendorInbox";
import { useState } from "react";

interface VendorEvidenceTabProps {
  assetId: string;
  assetName: string;
  vendorName?: string;
}

export const VendorEvidenceTab = ({ assetId, assetName, vendorName }: VendorEvidenceTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const uploadTriggerRef = useRef<(() => void) | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const { inboxItems, approve, reject, approvedItem, clearApprovedItem } = useVendorInbox({ assetId, assetName });

  return (
    <div className="space-y-6">
      <DocumentsTab
        assetId={assetId}
        assetName={assetName}
        vendorName={vendorName}
        onUploadTriggerReady={(trigger) => { uploadTriggerRef.current = trigger; }}
        inboxItems={inboxItems}
        onApproveInbox={(item) => approve(item)}
        onRejectInbox={(itemId) => reject(itemId)}
        onPreviewInbox={(item) => setPreviewItem(item)}
      />

      <ApprovalSuccessDialog data={approvedItem} onClose={clearApprovedItem} />
      <InboxPreviewDialog
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        item={previewItem}
        assetName={assetName}
        isNb={isNb}
        onApprove={() => { approve(previewItem); setPreviewItem(null); }}
        onReject={() => { reject(previewItem?.id); setPreviewItem(null); }}
      />
    </div>
  );
};
