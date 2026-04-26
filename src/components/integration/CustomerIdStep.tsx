import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Info, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const partnerName = integration.partnerName || "7 Security";

  // Auto-verify when user types (demo mode)
  useEffect(() => {
    if (!customerId.trim()) {
      setVerificationState("idle");
      setCustomerName(null);
      return;
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setVerificationState("verifying");

    // Auto-verify after short delay (simulating API call)
    debounceRef.current = setTimeout(() => {
      // For demo: accept any ID that starts with "7SEC-" or matches known patterns
      const isValid = customerId.startsWith("7SEC-") || customerId.length >= 5;
      
      if (isValid) {
        setVerificationState("success");
        setCustomerName("Demo Company AS");
      } else {
        setVerificationState("error");
        setErrorMessage("Customer ID not found. Try starting with '7SEC-'");
      }
    }, 600);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [customerId]);

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
          <p className="font-medium">Connect to {integration.name}</p>
          <p className="text-xs text-muted-foreground">Enter your customer ID for {partnerName}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-id">Customer ID</Label>
        <div className="relative">
          <Input
            id="customer-id"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="E.g. 7SEC-CUSTOMER-12345"
            className={cn(
              "pr-10",
              verificationState === "success" && "border-status-closed focus-visible:ring-status-closed",
              verificationState === "error" && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {verificationState === "verifying" && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
          {verificationState === "success" && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-status-closed" />
          )}
          {verificationState === "error" && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
          )}
        </div>
      </div>

      {/* Success state */}
      {verificationState === "success" && customerName && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-status-closed/10 border border-status-closed/30">
            <CheckCircle2 className="h-5 w-5 text-status-closed mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-status-closed">Customer verified</p>
              <p className="text-sm text-status-closed/80 mt-1">{customerName}</p>
            </div>
          </div>
          
          {/* Continue button */}
          <Button 
            className="w-full group" 
            onClick={handleContinue}
          >
            Fortsett
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}

      {/* Error state */}
      {verificationState === "error" && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-destructive">Customer ID not found</p>
            <p className="text-sm text-destructive/80 mt-1">{errorMessage}</p>
            <button 
              className="px-0 h-auto text-destructive mt-2 underline hover:no-underline text-sm"
              onClick={onNeedAccess}
            >
              Request access instead →
            </button>
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">Where do I find my customer ID?</p>
            <ul className="text-xs text-primary/80 mt-2 space-y-1 list-disc list-inside">
              <li>Check email from {partnerName}</li>
              <li>Check invoices or contracts</li>
              <li>Contact {partnerName} at support@7security.no</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo ID hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        <span>For testing: use <code className="px-1 py-0.5 bg-muted rounded">7SEC-DEMO-00001</code></span>
      </div>
    </div>
  );
}
