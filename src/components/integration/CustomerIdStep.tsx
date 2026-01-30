import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { use7SecurityIntegration } from "@/hooks/use7SecurityIntegration";

interface IntegrationInfo {
  name: string;
  logo: string;
  bgColor: string;
  textColor: string;
  partnerName?: string;
}

interface CustomerIdStepProps {
  integration: IntegrationInfo;
  onVerified: (customerId: string, customerName?: string) => void;
  onNeedAccess: () => void;
}

export function CustomerIdStep({ integration, onVerified, onNeedAccess }: CustomerIdStepProps) {
  const [customerId, setCustomerId] = useState("");
  const [verificationState, setVerificationState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { verifyCustomer, isLoading } = use7SecurityIntegration();
  const partnerName = integration.partnerName || "7 Security";

  const handleVerify = async () => {
    if (!customerId.trim()) return;
    
    setVerificationState("verifying");
    setErrorMessage(null);
    
    const result = await verifyCustomer(customerId.trim());
    
    if (result.success && result.verified) {
      setVerificationState("success");
      setCustomerName(result.customer_name || null);
    } else {
      setVerificationState("error");
      setErrorMessage(result.message);
    }
  };

  const handleContinue = () => {
    if (verificationState === "success") {
      onVerified(customerId, customerName || undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", integration.bgColor)}>
          {integration.logo.length <= 2 ? (
            <span className={cn("font-bold text-sm", integration.textColor)}>{integration.logo}</span>
          ) : (
            <span className="text-lg">{integration.logo}</span>
          )}
        </div>
        <div>
          <p className="font-medium">Koble til {integration.name}</p>
          <p className="text-xs text-muted-foreground">Oppgi din kunde-ID hos {partnerName}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-id">Kunde-ID</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="customer-id"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (verificationState !== "idle") {
                  setVerificationState("idle");
                }
              }}
              placeholder="F.eks. 7SEC-KUNDE-12345"
              className={cn(
                "pr-10",
                verificationState === "success" && "border-green-500 focus-visible:ring-green-500",
                verificationState === "error" && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {verificationState === "success" && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
            )}
            {verificationState === "error" && (
              <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
            )}
          </div>
          <Button 
            onClick={handleVerify}
            disabled={!customerId.trim() || isLoading}
            variant={verificationState === "success" ? "outline" : "default"}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : verificationState === "success" ? (
              "Verifisert"
            ) : (
              "Verifiser"
            )}
          </Button>
        </div>
      </div>

      {/* Success state */}
      {verificationState === "success" && customerName && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-green-400">Kunde verifisert</p>
            <p className="text-sm text-green-400/80 mt-1">{customerName}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {verificationState === "error" && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-400">Kunde-ID ikke funnet</p>
            <p className="text-sm text-red-400/80 mt-1">{errorMessage}</p>
            <Button 
              variant="link" 
              className="px-0 h-auto text-red-400 mt-2"
              onClick={onNeedAccess}
            >
              Be om tilgang i stedet →
            </Button>
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Hvor finner jeg kunde-ID?</p>
            <ul className="text-xs text-blue-300/80 mt-2 space-y-1 list-disc list-inside">
              <li>Sjekk e-post fra {partnerName}</li>
              <li>Se i fakturaer eller kontrakter</li>
              <li>Kontakt {partnerName} på support@7security.no</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo ID hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        <span>For testing: bruk <code className="px-1 py-0.5 bg-muted rounded">7SEC-DEMO-00001</code></span>
      </div>
    </div>
  );
}
