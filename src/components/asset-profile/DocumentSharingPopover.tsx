import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { EyeOff, Users, Globe, X, Plus, Lock } from "lucide-react";
import { toast } from "sonner";

// Document types that are compliance-related and can be shared
const SHAREABLE_TYPES = ["penetration_test", "dpia", "soc2", "iso27001", "dpa"];

interface DocumentSharingPopoverProps {
  docId: string;
  assetId: string;
  documentType: string;
  visibility: string;
  sharedWithEmails: string[];
  isNb: boolean;
}

export function DocumentSharingPopover({
  docId,
  assetId,
  documentType,
  visibility,
  sharedWithEmails,
  isNb,
}: DocumentSharingPopoverProps) {
  const queryClient = useQueryClient();
  const isShareable = SHAREABLE_TYPES.includes(documentType);
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [localEmails, setLocalEmails] = useState<string[]>(sharedWithEmails || []);
  const [localMode, setLocalMode] = useState<string>(visibility || "private");

  const updateSharing = useMutation({
    mutationFn: async ({ mode, emails }: { mode: string; emails: string[] }) => {
      const { error } = await supabase
        .from("vendor_documents")
        .update({
          visibility: mode,
          shared_with_emails: emails,
        } as any)
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(isNb ? "Delingsinnstillinger oppdatert" : "Sharing settings updated");
      setOpen(false);
    },
  });

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (localEmails.includes(email)) return;
    setLocalEmails([...localEmails, email]);
    setEmailInput("");
  };

  const handleRemoveEmail = (email: string) => {
    setLocalEmails(localEmails.filter((e) => e !== email));
  };

  const handleSave = () => {
    updateSharing.mutate({
      mode: localMode,
      emails: localMode === "selected" ? localEmails : [],
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalMode(visibility || "private");
      setLocalEmails(sharedWithEmails || []);
      setEmailInput("");
    }
    setOpen(newOpen);
  };

  // Not shareable — show locked indicator
  if (!isShareable) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-[13px]">
        <Lock className="h-3 w-3" />
        <span>{isNb ? "Intern" : "Internal"}</span>
      </div>
    );
  }

  // Determine display label
  const getDisplayLabel = () => {
    if (visibility === "shared" || visibility === "network") {
      return {
        icon: <Globe className="h-3 w-3" />,
        label: isNb ? "Alle brukere" : "All users",
        variant: "default" as const,
      };
    }
    if (visibility === "selected" && sharedWithEmails?.length > 0) {
      return {
        icon: <Users className="h-3 w-3" />,
        label: `${sharedWithEmails.length} ${isNb ? "partnere" : "partners"}`,
        variant: "default" as const,
      };
    }
    return {
      icon: <EyeOff className="h-3 w-3" />,
      label: isNb ? "Privat" : "Private",
      variant: "outline" as const,
    };
  };

  const display = getDisplayLabel();

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={display.variant}
          size="sm"
          className="h-7 text-[13px] gap-1"
        >
          {display.icon}
          {display.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isNb ? "Delingsinnstillinger" : "Sharing settings"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNb
                ? "Velg hvem som kan se dette dokumentet"
                : "Choose who can view this document"}
            </p>
          </div>

          <RadioGroup value={localMode} onValueChange={setLocalMode} className="space-y-3">
            {/* Private */}
            <div className="flex items-start gap-3">
              <RadioGroupItem value="private" id="share-private" className="mt-0.5" />
              <Label htmlFor="share-private" className="cursor-pointer space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  {isNb ? "Privat" : "Private"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isNb ? "Kun synlig for din organisasjon" : "Only visible to your organization"}
                </p>
              </Label>
            </div>

            {/* Selected partners */}
            <div className="flex items-start gap-3">
              <RadioGroupItem value="selected" id="share-selected" className="mt-0.5" />
              <Label htmlFor="share-selected" className="cursor-pointer space-y-0.5 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {isNb ? "Utvalgte partnere" : "Selected partners"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isNb
                    ? "Del med spesifikke kontakter via e-post"
                    : "Share with specific contacts by email"}
                </p>
              </Label>
            </div>

            {/* Email input — only when selected mode */}
            {localMode === "selected" && (
              <div className="ml-7 space-y-2">
                <div className="flex gap-1.5">
                  <Input
                    type="email"
                    placeholder={isNb ? "partner@firma.no" : "partner@company.com"}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 shrink-0"
                    onClick={handleAddEmail}
                    disabled={!emailInput.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {localEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {localEmails.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="text-[13px] gap-1 pr-1"
                      >
                        {email}
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All users of this vendor */}
            <div className="flex items-start gap-3">
              <RadioGroupItem value="network" id="share-network" className="mt-0.5" />
              <Label htmlFor="share-network" className="cursor-pointer space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {isNb ? "Alle som bruker denne leverandøren" : "All users of this vendor"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isNb
                    ? "Synlig for alle i nettverket som bruker denne leverandøren"
                    : "Visible to everyone in the network using this vendor"}
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setOpen(false)}
          >
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleSave}
            disabled={updateSharing.isPending}
          >
            {isNb ? "Lagre" : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
