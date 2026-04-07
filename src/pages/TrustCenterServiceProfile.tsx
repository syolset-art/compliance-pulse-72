import { useParams } from "react-router-dom";
import TrustCenterProfile from "./TrustCenterProfile";

const TrustCenterServiceProfile = () => {
  const { id } = useParams<{ id: string }>();
  return <TrustCenterProfile assetId={id} />;
};

export default TrustCenterServiceProfile;
