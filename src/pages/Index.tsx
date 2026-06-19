import { Navigate } from "react-router-dom";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import TrustCenterDashboard from "@/pages/TrustCenterDashboard";

/**
 * `/` rendrer alltid Trust Center-dashbordet. Mynder Core-dashbordet
 * ligger på `/dashboard-core` og vises som eget menypunkt i sidebar
 * kun når brukeren har aktivert Core eller et register.
 */
const Index = () => {
  const { mode } = useWorkspaceMode();
  if (mode === "partner") return <Navigate to="/msp-partner" replace />;
  return <TrustCenterDashboard />;
};

export default Index;
