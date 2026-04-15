import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { TrustProfilePreview } from "./TrustProfilePreview";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Save, Lock, Globe, Link2, Code2, Copy, Check, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface TrustProfilePublishingProps {
  assetId: string;
  assetName?: string;
  orgNumber?: string;
  publishMode: string;
  publishToCustomers: string[];
}

export const TrustProfilePublishing = ({
  assetId,
  assetName = "",
  orgNumber = "",
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<"shield" | "minimal" | "banner">("shield");

  useEffect(() => {
    setIsPublished(initialMode !== "private");
    setAudience(initialMode === "all" ? "all" : "selected");
    setSelectedCustomers(initialCustomers || []);
  }, [initialMode, initialCustomers]);

  const slug = useMemo(() => {
    const base = assetName
      .toLowerCase()
      .replace(/[^a-z0-9æøå\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
    const suffix = orgNumber ? `-${orgNumber.replace(/\s/g, "").slice(-4)}` : "";
    return `${base}${suffix}`;
  }, [assetName, orgNumber]);

  const publicUrl = `trust.mynder.com/${slug}`;

  const { data: customers = [] } = useQuery({
    queryKey: ["publishing-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_compliance_requests")
        .select("customer_name")
        .order("customer_name");
      if (error) throw error;
      return [...new Set(data?.map((r) => r.customer_name) || [])];
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopiedLink(true);
    toast.success(isNb ? "Lenke kopiert" : "Link copied");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const badgeSnippets = {
    shield: `<a href="https://${publicUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:8px;border:1px solid #e2e2e2;font-family:system-ui,sans-serif;font-size:13px;color:#333;text-decoration:none;background:#fff;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A3184" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Verified by Mynder</a>`,
    minimal: `<a href="https://${publicUrl}" target="_blank" rel="noopener" style="font-family:system-ui,sans-serif;font-size:12px;color:#666;text-decoration:none;">🛡️ Trust Profile on Mynder</a>`,
    banner: `<a href="https://${publicUrl}" target="_blank" rel="noopener" style="display:block;padding:12px 20px;border-radius:10px;background:linear-gradient(135deg,#5A3184 0%,#7c4daa 100%);font-family:system-ui,sans-serif;font-size:14px;color:#fff;text-decoration:none;text-align:center;">🔒 View our Trust Profile on Mynder</a>`,
  };

  const handleCopyBadge = (type: string) => {
    navigator.clipboard.writeText(badgeSnippets[type as keyof typeof badgeSnippets]);
    setCopiedBadge(type);
    toast.success(isNb ? "Badge-kode kopiert" : "Badge code copied");
    setTimeout(() => setCopiedBadge(null), 2000);
  };

  return (
    <>
      {/* Top bar: status + actions */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${isPublished ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
          <span className="text-xs font-medium text-foreground">
            {isPublished ? (isNb ? "Publisert" : "Published") : (isNb ? "Privat" : "Private")}
          </span>
        </div>
        <Switch checked={isPublished} onCheckedChange={setIsPublished} className="scale-[0.8]" />
        <div className="h-4 w-px bg-border" />
        <button onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors" title={isNb ? "Forhåndsvisning" : "Preview"}>
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isNb ? "Forhåndsvis" : "Preview"}</span>
        </button>
        <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title={isNb ? "Lagre endringer" : "Save changes"}>
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isSaving ? (isNb ? "Lagrer…" : "Saving…") : (isNb ? "Lagre" : "Save")}</span>
        </button>
      </div>

      {/* Share & Publish panel — only when published */}
      {isPublished && (
        <div className="mt-2 rounded-xl border border-border bg-card/30 overflow-hidden">
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-9 px-2">
              <TabsTrigger value="link" className="text-[13px] gap-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 pb-2">
                <Link2 className="h-3 w-3" />
                {isNb ? "Del lenke" : "Share Link"}
              </TabsTrigger>
              <TabsTrigger value="badge" className="text-[13px] gap-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 pb-2">
                <Code2 className="h-3 w-3" />
                {isNb ? "Nettside-badge" : "Website Badge"}
              </TabsTrigger>
              <TabsTrigger value="audience" className="text-[13px] gap-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 pb-2">
                <Share2 className="h-3 w-3" />
                {isNb ? "Målgruppe" : "Audience"}
              </TabsTrigger>
            </TabsList>

            {/* --- Share Link Tab --- */}
            <TabsContent value="link" className="p-4 space-y-3 mt-0">
              <div>
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  {isNb ? "Din offentlige Trust Center-lenke" : "Your public Trust Center link"}
                </p>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {isNb
                    ? "Din unike adresse — som en LinkedIn-profil for virksomhetens sikkerhet."
                    : "Your unique address — like a LinkedIn profile for your organization's security."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <code className="text-xs text-foreground font-mono">{publicUrl}</code>
                </div>
                <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs shrink-0" onClick={handleCopyLink}>
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? (isNb ? "Kopiert" : "Copied") : (isNb ? "Kopier" : "Copy")}
                </Button>
              </div>
              <p className="text-[13px] text-muted-foreground">
                {isNb ? "Del denne lenken med kunder og partnere." : "Share this link with customers and partners."}
              </p>
            </TabsContent>

            {/* --- Website Badge Tab --- */}
            <TabsContent value="badge" className="p-4 space-y-4 mt-0">
              <div>
                <p className="text-xs font-medium text-foreground">
                  {isNb ? "Velg en badge for nettsiden din" : "Choose a badge for your website"}
                </p>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {isNb
                    ? "Legg til en badge på nettsiden din som lenker direkte til din Trust Profile."
                    : "Add a badge to your website that links directly to your Trust Profile."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Shield badge */}
                <button
                  onClick={() => setSelectedBadge("shield")}
                  className={`relative rounded-lg border p-4 text-center transition-all hover:border-primary/40 ${selectedBadge === "shield" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"}`}
                >
                  <div className="flex justify-center mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Verified by Mynder
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground">{isNb ? "Skjold" : "Shield"}</p>
                </button>

                {/* Minimal badge */}
                <button
                  onClick={() => setSelectedBadge("minimal")}
                  className={`relative rounded-lg border p-4 text-center transition-all hover:border-primary/40 ${selectedBadge === "minimal" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"}`}
                >
                  <div className="flex justify-center mb-2">
                    <span className="text-xs text-muted-foreground">🛡️ Trust Profile on Mynder</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground">{isNb ? "Minimal" : "Minimal"}</p>
                </button>

                {/* Banner badge */}
                <button
                  onClick={() => setSelectedBadge("banner")}
                  className={`relative rounded-lg border p-4 text-center transition-all hover:border-primary/40 ${selectedBadge === "banner" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"}`}
                >
                  <div className="flex justify-center mb-2">
                    <span className="inline-block px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium">
                      🔒 View our Trust Profile
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground">Banner</p>
                </button>
              </div>

              {/* Code snippet */}
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-muted-foreground">
                  {isNb ? "Kopier HTML-kode:" : "Copy HTML code:"}
                </p>
                <div className="relative rounded-lg border border-border bg-muted/30 p-3 overflow-x-auto">
                  <pre className="text-[13px] text-muted-foreground font-mono whitespace-pre-wrap break-all leading-relaxed">
                    {badgeSnippets[selectedBadge]}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1.5 right-1.5 h-7 w-7 p-0"
                    onClick={() => handleCopyBadge(selectedBadge)}
                  >
                    {copiedBadge === selectedBadge ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* --- Audience Tab --- */}
            <TabsContent value="audience" className="p-4 space-y-3 mt-0">
              <RadioGroup value={audience} onValueChange={setAudience} className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <RadioGroupItem value="all" className="h-3.5 w-3.5" />
                  {isNb ? "Alle kunder" : "All customers"}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <RadioGroupItem value="selected" className="h-3.5 w-3.5" />
                  {isNb ? "Utvalgte kunder" : "Selected customers"}
                </label>
              </RadioGroup>

              {audience === "selected" && (
                <div className="flex flex-wrap gap-2 pl-1">
                  {customers.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">
                      {isNb ? "Ingen kundeforespørsler funnet." : "No customer requests found."}
                    </p>
                  ) : (
                    customers.map((name) => (
                      <label key={name} className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                        <Checkbox checked={selectedCustomers.includes(name)} onCheckedChange={() => toggleCustomer(name)} className="h-3.5 w-3.5" />
                        {name}
                      </label>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <TrustProfilePreview open={previewOpen} onOpenChange={setPreviewOpen} assetId={assetId} />
    </>
  );
};
