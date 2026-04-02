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
    <>
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        {/* Status indicator dot + label */}
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              isPublished ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
          />
          <span className="text-xs font-medium text-foreground">
            {isPublished
              ? (isNb ? "Publisert" : "Published")
              : (isNb ? "Privat" : "Private")}
          </span>
        </div>

        <Switch
          checked={isPublished}
          onCheckedChange={setIsPublished}
          aria-label={isNb ? "Publiser Trust Profil" : "Publish Trust Profile"}
          className="scale-[0.8]"
        />

        {/* Separator */}
        <div className="h-4 w-px bg-border" />

        {/* Actions as icon buttons with tooltips */}
        <button
          onClick={() => setPreviewOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          title={isNb ? "Forhåndsvisning" : "Preview"}
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isNb ? "Forhåndsvis" : "Preview"}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title={isNb ? "Lagre endringer" : "Save changes"}
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {isSaving ? (isNb ? "Lagrer…" : "Saving…") : (isNb ? "Lagre" : "Save")}
          </span>
        </button>
      </div>

      {/* Expandable audience settings - only when published */}
      {isPublished && (
        <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3 space-y-3">
          <RadioGroup
            value={audience}
            onValueChange={setAudience}
            className="flex gap-4"
          >
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <RadioGroupItem value="all" id="audience-all" className="h-3.5 w-3.5" />
              {isNb ? "Alle kunder" : "All customers"}
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <RadioGroupItem value="selected" id="audience-selected" className="h-3.5 w-3.5" />
              {isNb ? "Utvalgte kunder" : "Selected customers"}
            </label>
          </RadioGroup>

          {audience === "selected" && (
            <div className="flex flex-wrap gap-2 pl-1">
              {customers.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  {isNb ? "Ingen kundeforespørsler funnet." : "No customer requests found."}
                </p>
              ) : (
                customers.map((name) => (
                  <label key={name} className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                    <Checkbox
                      checked={selectedCustomers.includes(name)}
                      onCheckedChange={() => toggleCustomer(name)}
                      className="h-3.5 w-3.5"
                    />
                    {name}
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <TrustProfilePreview open={previewOpen} onOpenChange={setPreviewOpen} assetId={assetId} />
    </>
  );
};
