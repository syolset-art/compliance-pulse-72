import { useParams } from "react-router-dom";
import PublicTrustCenterLayout from "@/components/trust-center/PublicTrustCenterLayout";

export default function PublicTrustProfile() {
  const { assetId } = useParams<{ assetId: string }>();
  return <PublicTrustCenterLayout assetId={assetId} />;
}
