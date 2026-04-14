import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Globe } from "lucide-react";
import TrustCenterProfile from "./TrustCenterProfile";

export default function PublicTrustProfile() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Trust Engine banner */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/trust-engine")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake til søk
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">Mynder Trust Engine</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs gap-1.5 border-primary/30 text-primary">
            <Globe className="h-3 w-3" />
            Open Database
          </Badge>
        </div>
      </header>

      {/* Profile content — no sidebar */}
      <div className="pt-2">
        <TrustCenterProfile assetId={assetId} readOnly />
      </div>
    </div>
  );
}
