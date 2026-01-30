import { Users, UserPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationInfo {
  name: string;
  logo: string;
  bgColor: string;
  textColor: string;
  partnerName?: string;
}

interface CustomerTypeStepProps {
  integration: IntegrationInfo;
  onSelect: (type: "existing" | "new" | "demo") => void;
}

export function CustomerTypeStep({ integration, onSelect }: CustomerTypeStepProps) {
  const partnerName = integration.partnerName || "7 Security";
  
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
          <p className="font-medium">{integration.name}</p>
          <p className="text-xs text-muted-foreground">via {partnerName}</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-muted-foreground">
          Mynder fetches data from {integration.name.replace(" via 7 Security", "")} via {partnerName}. 
          You only need to provide your customer ID – no API key required.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Are you already a customer of {partnerName}?</p>

        {/* Existing customer */}
        <button
          onClick={() => onSelect("existing")}
          className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-primary/20">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Yes, I have a customer ID</p>
            <p className="text-sm text-muted-foreground mt-1">
              I am already a customer of {partnerName} and have a customer ID
            </p>
          </div>
        </button>

        {/* New customer */}
        <button
          onClick={() => onSelect("new")}
          className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-muted">
            <UserPlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">No, this is new to me</p>
            <p className="text-sm text-muted-foreground mt-1">
              I want to get access via the Mynder agreement
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 mt-2 inline-block">
              No additional cost
            </span>
          </div>
        </button>

        {/* Demo option */}
        <button
          onClick={() => onSelect("demo")}
          className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-muted/20 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-amber-500/20">
            <Sparkles className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Explore with demo data</p>
            <p className="text-sm text-muted-foreground mt-1">
              See how the integration works with sample data
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
