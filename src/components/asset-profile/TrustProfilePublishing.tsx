import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { TrustProfilePreview } from "./TrustProfilePreview";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, Save, Lock, Globe } from "lucide-react";
import { toast } from "sonner";

interface TrustProfilePublishingProps {
  assetId: string;
  publishMode: string;
  publishToCustomers: string[];
}

export const TrustProfilePublishing = ({
  assetId,
  publishMode: initialMode,
  publishToCustomers: initialCustomers,
}: TrustProfilePublishingProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [isPublished, setIsPublished] = useState(initialMode !== "private");
  const [audience, setAudience] = useState<string>(
    initialMode === "all" ? "all" : "selected"
  );
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(
    initialCustomers || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setIsPublished(initialMode !== "private");
    setAudience(initialMode === "all" ? "all" : "selected");
    setSelectedCustomers(initialCustomers || []);
  }, [initialMode, initialCustomers]);

  // Fetch unique customer names from customer_compliance_requests
  const { data: customers = [] } = useQuery({
    queryKey: ["publishing-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_compliance_requests")
        .select("customer_name")
        .order("customer_name");
      if (error) throw error;
      const unique = [...new Set(data?.map((r) => r.customer_name) || [])];
      return unique;
    },
  });

  const toggleCustomer = (name: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const mode = !isPublished ? "private" : audience;
    const { error } = await supabase
      .from("assets")
      .update({
        publish_mode: mode,
        publish_to_customers: mode === "selected" ? selectedCustomers : [],
      } as any)
      .eq("id", assetId);

    setIsSaving(false);
    if (error) {
      toast.error(isNb ? "Kunne ikke lagre endringer" : "Could not save changes");
    } else {
      toast.success(isNb ? "Publiseringsinnstillinger lagret" : "Publishing settings saved");
    }
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Trust Profile</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isNb ? "Administrer din Trust Profil og velg hvem som kan se den." : "Manage your Trust Profile and choose who can view it."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status banner */}
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 ${
            isPublished
              ? "border-primary/20 bg-primary/5"
              : "border-border bg-muted/30"
          }`}
          role="status"
          aria-live="polite"
        >
          {isPublished ? (
            <Globe className="h-5 w-5 text-primary shrink-0" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {isPublished
                ? (isNb ? "Profilen er publisert" : "Profile is published")
                : (isNb ? "Profilen er privat" : "Profile is private")}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPublished
                ? (isNb ? "Profilen er synlig for valgte kunder." : "The profile is visible to selected customers.")
                : (isNb ? "Ingen kunder kan se profilen din ennå." : "No customers can see your profile yet.")}
            </p>
          </div>
          <div className="shrink-0">
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
              aria-label={isNb ? "Publiser Trust Profil" : "Publish Trust Profile"}
            />
          </div>
        </div>

        {/* Audience settings */}
        {isPublished && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium mb-2">
              {isNb ? "Publiseringsinnstillinger" : "Publishing settings"}
            </legend>

            <RadioGroup
              value={audience}
              onValueChange={setAudience}
              className="space-y-3"
            >
              <label
                className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors focus-within:ring-2 focus-within:ring-primary"
              >
                <RadioGroupItem value="all" id="audience-all" className="mt-0.5" />
                <div>
                  <span className="text-sm font-medium">{isNb ? "Alle kunder" : "All customers"}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isNb ? "Profilen deles med alle som ber om innsyn" : "Profile is shared with anyone who requests access"}
                  </p>
                </div>
              </label>

              <label
                className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors focus-within:ring-2 focus-within:ring-primary"
              >
                <RadioGroupItem
                  value="selected"
                  id="audience-selected"
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{isNb ? "Utvalgte kunder" : "Selected customers"}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isNb ? "Velg hvilke kunder som får tilgang" : "Choose which customers get access"}
                  </p>
                </div>
              </label>
            </RadioGroup>

            {/* Customer checklist */}
            {audience === "selected" && (
              <div
                className="ml-8 space-y-2 border-l-2 border-border pl-4"
                role="group"
                aria-label={isNb ? "Velg kunder" : "Select customers"}
              >
                {customers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Ingen kundeforespørsler funnet.
                  </p>
                ) : (
                  customers.map((name) => (
                    <label
                      key={name}
                      className="flex items-center gap-2.5 py-1.5 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedCustomers.includes(name)}
                        onCheckedChange={() => toggleCustomer(name)}
                        aria-label={`Gi tilgang til ${name}`}
                      />
                      <span className="text-sm">{name}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </fieldset>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" aria-label="Forhåndsvis Trust Profil" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1.5" />
            Vis Trust Profil
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            aria-label="Lagre publiseringsinnstillinger"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? "Lagrer..." : "Lagre endringer"}
          </Button>
        </div>
      </CardContent>

      <TrustProfilePreview open={previewOpen} onOpenChange={setPreviewOpen} assetId={assetId} />
    </Card>
  );
};
