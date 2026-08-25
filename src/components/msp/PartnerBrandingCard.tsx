import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, RotateCcw, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";

const MAX_LOGO_BYTES = 300 * 1024;

export function PartnerBrandingCard() {
  const { branding, save, clearField } = usePartnerBranding();
  const [name, setName] = useState(branding.isAutoName ? "" : branding.name);
  const [orgNumber, setOrgNumber] = useState(branding.isAutoOrg ? "" : branding.orgNumber);
  const [domain, setDomain] = useState(branding.isAutoDomain ? "" : branding.domain);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Ugyldig filtype", { description: "Velg en PNG- eller JPG-fil." });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logoen er for stor", { description: "Maks 300 KB. Komprimer bildet og prøv igjen." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      save({ logoDataUrl: String(reader.result) });
      toast.success("Egen tilbudslogo lagret");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    save({
      name: name.trim() || undefined,
      orgNumber: orgNumber.trim() || undefined,
      domain: domain.trim() || undefined,
    });
    toast.success("Tilbudsmal lagret");
  };

  const previewName = name.trim() || branding.autoName;
  const previewOrg = orgNumber.trim() || branding.autoOrgNumber;
  const previewDomain = domain.trim() || branding.autoDomain;

  return (
    <Card className="p-4 space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">
              {branding.name || "Mangler navn"}
              {branding.orgNumber ? ` · Org.nr ${branding.orgNumber}` : ""}
              {branding.domain ? ` · ${branding.domain}` : ""}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="grid gap-4 md:grid-cols-[1fr_280px] pt-2 border-t border-border">
          <div className="space-y-3">

            <div className="space-y-1.5">
              <Label className="text-base uppercase tracking-wide text-muted-foreground font-semibold">
                Logo
              </Label>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Partnerlogo" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoSelect(f);
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" className="h-9 text-sm gap-1.5"
                  onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  {branding.logoUrl ? "Bytt logo" : "Legg ved logo"}
                </Button>
                {!branding.isAutoLogo && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-sm gap-1"
                    onClick={() => { clearField("logoDataUrl"); toast.success("Tilbakestilt til organisasjonens logo"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-base uppercase tracking-wide text-muted-foreground font-semibold">
                Partnernavn
              </Label>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={branding.autoName || "Fyll inn i organisasjonsprofilen"}
                  className="h-9 text-base"
                />
                {!branding.isAutoName && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-sm gap-1"
                    onClick={() => { clearField("name"); setName(""); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-base uppercase tracking-wide text-muted-foreground font-semibold">
                Organisasjonsnummer
              </Label>
              <div className="flex gap-2">
                <Input
                  value={orgNumber}
                  onChange={(e) => setOrgNumber(e.target.value)}
                  placeholder={branding.autoOrgNumber || "999 999 999"}
                  className="h-9 text-base tabular-nums"
                />
                {!branding.isAutoOrg && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-sm gap-1"
                    onClick={() => { clearField("orgNumber"); setOrgNumber(""); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-base uppercase tracking-wide text-muted-foreground font-semibold">
                Webadresse
              </Label>
              <div className="flex gap-2">
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={branding.autoDomain || "f.eks. firma.no"}
                  className="h-9 text-base"
                />
                {!branding.isAutoDomain && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-sm gap-1"
                    onClick={() => { clearField("domain"); setDomain(""); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-1">
              <Button type="button" size="sm" className="h-9 text-sm" onClick={handleSave}>
                Lagre tilbudsmal
              </Button>
            </div>
          </div>

          {/* Mini-preview */}
          <div className="space-y-1.5">
            <Label className="text-base uppercase tracking-wide text-muted-foreground font-semibold">
              Slik vises det i tilbudet
            </Label>
            <div className="rounded-md border border-border bg-background p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {branding.logoUrl && (
                  <img src={branding.logoUrl} alt="" className="h-10 w-10 object-contain shrink-0" />
                )}
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {previewName || "Mangler navn"}
                  </p>
                  {previewOrg && (
                    <p className="text-sm text-muted-foreground tabular-nums">
                      Org.nr {previewOrg}
                    </p>
                  )}
                  {previewDomain && (
                    <p className="text-sm text-muted-foreground truncate">
                      {previewDomain}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </Card>
  );
}
