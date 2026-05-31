import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, RotateCcw, Image as ImageIcon, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";

const MAX_LOGO_BYTES = 300 * 1024;

export function PartnerBrandingCard() {
  const { branding, save, clearField } = usePartnerBranding();
  const [name, setName] = useState(branding.isAutoName ? "" : branding.name);
  const [orgNumber, setOrgNumber] = useState(branding.isAutoOrg ? "" : branding.orgNumber);
  const [domain, setDomain] = useState(branding.isAutoDomain ? "" : branding.domain);
  const [tagline, setTagline] = useState(branding.tagline);
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
      tagline: tagline.trim() || undefined,
    });
    toast.success("Tilbudsmerking lagret");
  };

  const previewName = name.trim() || branding.autoName;
  const previewOrg = orgNumber.trim() || branding.autoOrgNumber;
  const previewDomain = domain.trim() || branding.autoDomain;
  const previewTagline = tagline.trim() || branding.tagline;

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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate">Tilbudsmerking</h3>
              <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/30">
                <Sparkles className="h-2.5 w-2.5" /> Auto-fylt fra trust-profil
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
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
            <p className="text-[12px] text-muted-foreground">
              Navn, organisasjonsnummer, webadresse og logo hentes automatisk fra organisasjonsprofilen din.
              Du kan overstyre per felt under, eller{" "}
              <Link to="/settings" className="text-primary hover:underline">oppdatere profilen</Link>.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Partnernavn
              </Label>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={branding.autoName || "Fyll inn i organisasjonsprofilen"}
                  className="h-9 text-sm"
                />
                {!branding.isAutoName && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-xs gap-1"
                    onClick={() => { clearField("name"); setName(""); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {branding.isAutoName
                  ? (branding.autoName
                      ? "Hentet automatisk fra organisasjonsprofilen."
                      : "Mangler — fyll inn juridisk navn i organisasjonsprofilen.")
                  : "Overstyrt manuelt."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Organisasjonsnummer
              </Label>
              <div className="flex gap-2">
                <Input
                  value={orgNumber}
                  onChange={(e) => setOrgNumber(e.target.value)}
                  placeholder={branding.autoOrgNumber || "999 999 999"}
                  className="h-9 text-sm tabular-nums"
                />
                {!branding.isAutoOrg && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-xs gap-1"
                    onClick={() => { clearField("orgNumber"); setOrgNumber(""); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {branding.isAutoOrg
                  ? (branding.autoOrgNumber ? "Hentet automatisk fra organisasjonsprofilen." : "Mangler — fyll inn i organisasjonsprofilen.")
                  : "Overstyrt manuelt."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Webadresse
              </Label>
              <div className="flex gap-2">
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={branding.autoDomain || "f.eks. firma.no"}
                  className="h-9 text-sm"
                />
                {!branding.isAutoDomain && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-xs gap-1"
                    onClick={() => { clearField("domain"); setDomain(""); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {branding.isAutoDomain
                  ? (branding.autoDomain ? "Hentet automatisk fra organisasjonsprofilen." : "Valgfritt — kan fylles inn i organisasjonsprofilen.")
                  : "Overstyrt manuelt."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Slagord <span className="text-muted-foreground/70 normal-case">(valgfritt)</span>
              </Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="F.eks. Din partner for trygg digitalisering"
                className="h-9 text-sm"
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">Vises under partnernavnet i tilbudet.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Logo</Label>
              <div className="flex flex-wrap gap-2">
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
                <Button type="button" variant="outline" size="sm" className="h-9 text-xs gap-1.5"
                  onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  {branding.isAutoLogo
                    ? (branding.autoLogoUrl ? "Bytt til egen tilbudslogo" : "Last opp logo")
                    : "Bytt logo"}
                </Button>
                {!branding.isAutoLogo && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-xs gap-1"
                    onClick={() => { clearField("logoDataUrl"); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {branding.isAutoLogo
                  ? (branding.autoLogoUrl
                      ? "Bruker logo fra organisasjonsprofilen. Last opp en egen hvis du vil ha noe annet i tilbudet."
                      : "PNG eller JPG, maks 300 KB. Vises øverst i tilbudet.")
                  : "Egen tilbudslogo i bruk."}
              </p>
            </div>

            <div className="pt-1">
              <Button type="button" size="sm" className="h-9 text-xs" onClick={handleSave}>
                Lagre tilbudsmerking
              </Button>
            </div>
          </div>

          {/* Mini-preview */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Slik vises det i tilbudet
            </Label>
            <div className="rounded-md border border-border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="" className="h-9 w-9 object-contain rounded" />
                  ) : (
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {previewName || "Mangler navn"}
                    </p>
                    {previewTagline && (
                      <p className="text-xs text-muted-foreground italic truncate">
                        {previewTagline}
                      </p>
                    )}
                    {previewOrg && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Org.nr {previewOrg}
                      </p>
                    )}
                    {previewDomain && (
                      <p className="text-xs text-muted-foreground truncate">
                        {previewDomain}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Tilbud T-2026-1234</div>
                  <div>{new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
