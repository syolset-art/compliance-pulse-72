import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, User, Mail, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { use7SecurityIntegration } from "@/hooks/use7SecurityIntegration";

interface IntegrationInfo {
  name: string;
  logo: string;
  bgColor: string;
  textColor: string;
  partnerName?: string;
}

interface RequestAccessStepProps {
  integration: IntegrationInfo;
  onRequestSent: (requestId: string) => void;
  onHaveCustomerId: () => void;
}

export function RequestAccessStep({ integration, onRequestSent, onHaveCustomerId }: RequestAccessStepProps) {
  const [formData, setFormData] = useState({
    orgNumber: "",
    contactName: "",
    contactEmail: ""
  });
  const [requestSent, setRequestSent] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  const { requestAccess, isLoading } = use7SecurityIntegration();
  const partnerName = integration.partnerName || "7 Security";

  const isValid = formData.orgNumber.length >= 9 && 
                  formData.contactName.length >= 2 && 
                  formData.contactEmail.includes("@");

  const handleSubmit = async () => {
    if (!isValid) return;
    
    const result = await requestAccess(formData);
    
    if (result.success && result.request_id) {
      setRequestId(result.request_id);
      setRequestSent(true);
      onRequestSent(result.request_id);
    }
  };

  if (requestSent) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Forespørsel sendt!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Referanse: {requestId}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <p className="text-sm font-medium">Hva skjer nå?</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">1</div>
              <span className="text-muted-foreground">{partnerName} behandler forespørselen</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">2</div>
              <span className="text-muted-foreground">Du mottar kunde-ID på e-post</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">3</div>
              <span className="text-muted-foreground">Kom tilbake hit og aktiver integrasjonen</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Vanligvis aktivert innen 24 timer</span>
        </div>
      </div>
    );
  }

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
          <p className="font-medium">Be om tilgang</p>
          <p className="text-xs text-muted-foreground">Via Mynder-avtalen med {partnerName}</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
        <p className="text-sm text-green-400">
          Som Mynder-kunde får du tilgang til {partnerName}s datahenting fra {integration.name.replace(" via 7 Security", "")} uten ekstra kostnad.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-number">
            <Building2 className="inline h-3.5 w-3.5 mr-1.5" />
            Organisasjonsnummer
          </Label>
          <Input
            id="org-number"
            value={formData.orgNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, orgNumber: e.target.value }))}
            placeholder="123 456 789"
            maxLength={11}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-name">
            <User className="inline h-3.5 w-3.5 mr-1.5" />
            Kontaktperson
          </Label>
          <Input
            id="contact-name"
            value={formData.contactName}
            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
            placeholder="Ola Nordmann"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-email">
            <Mail className="inline h-3.5 w-3.5 mr-1.5" />
            E-post
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
            placeholder="ola@bedrift.no"
          />
        </div>
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sender forespørsel...
          </>
        ) : (
          "Be om tilgang"
        )}
      </Button>

      <div className="text-center">
        <Button 
          variant="link" 
          className="text-xs text-muted-foreground"
          onClick={onHaveCustomerId}
        >
          Har du allerede kunde-ID? Klikk her
        </Button>
      </div>

      <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Vanligvis aktivert innen 24 timer</span>
      </div>
    </div>
  );
}
