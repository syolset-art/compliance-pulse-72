import { RelationsTab } from "./RelationsTab";

interface VendorHistoryTabProps {
  assetId: string;
}

export const VendorHistoryTab = ({ assetId }: VendorHistoryTabProps) => {
  return <RelationsTab assetId={assetId} />;
};