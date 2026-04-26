import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Check, Info, Building2, User, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PerformerRole } from "./PerformerSelectStep";

interface InvitePerformerFormProps {
  integrationName: string;
  performerRole: PerformerRole;
  onInviteSent: (data: InviteData) => void;
  onCancel: () => void;
}

export interface InviteData {
  email: string;
  name: string;
  organizationName: string;
  role: PerformerRole;
}

const roleLabels: Record<PerformerRole, string> = {
  owner: "Owner",
  it_provider: "IT provider",
  accountant: "Accountant",
  internal_it: "Internal IT manager",
};

export function InvitePerformerForm({
  integrationName,
  performerRole,
  onInviteSent,
  onCancel,
}: InvitePerformerFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    organizationName: "",
  });
  const [copied, setCopied] = useState(false);

  const roleLabel = roleLabels[performerRole];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      toast.error("Please fill in email and name");
      return;
    }
    onInviteSent({
      ...formData,
      role: performerRole,
    });
  };

  const generateInviteText = () => {
    return `Hi ${formData.name || "[Name]"},

We use Mynder for compliance overview and want to connect to ${integrationName} for automatic asset import.

To set up the connection, we need an API key with read access.

Instructions:
1. Log in to ${integrationName} Management Console
2. Go to Settings → API Access
3. Create new API key with read access
4. Click on the invitation link below to enter the key

Thank you for your help!`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateInviteText());
      setCopied(true);
      toast.success("Text copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy text");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="p-2 rounded-lg bg-primary/20">
          {performerRole === "accountant" ? (
            <Building2 className="h-5 w-5 text-primary" />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium">Invite {roleLabel.toLowerCase()}</p>
          <p className="text-xs text-muted-foreground">
            Send invitation to set up {integrationName}
          </p>
        </div>
      </div>

      {performerRole !== "internal_it" && (
        <div className="space-y-2">
          <Label htmlFor="organizationName">Company name</Label>
          <Input
            id="organizationName"
            value={formData.organizationName}
            onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
            placeholder={performerRole === "accountant" ? "E.g. Accounting Ltd" : "E.g. IT Partner Ltd"}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="contact@company.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Contact person (name) *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="John Doe"
          required
        />
      </div>

      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">What happens next?</p>
            <ol className="text-xs text-primary/80 mt-2 space-y-1 list-decimal list-inside">
              <li>We send an email with invitation link</li>
              <li>{roleLabel} logs in and adds API key</li>
              <li>You get notified when integration is ready</li>
              <li>Everything is documented for audit</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Preview / Copy section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">Email preview</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="p-3 max-h-[120px] overflow-y-auto">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
            {generateInviteText()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.email || !formData.name}>
          <Send className="h-4 w-4 mr-2" />
          Send invitation
        </Button>
      </div>
    </form>
  );
}
