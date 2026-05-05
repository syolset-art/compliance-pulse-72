import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Shield, Globe, FileText, MessageSquare, Share2,
  Linkedin, Facebook, Mail, Copy, BarChart3, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TrustCenterProfile from "@/pages/TrustCenterProfile";

type SectionKey = "profile" | "maturity" | "documentation" | "contact" | "share";

interface Props {
  assetId?: string;
}

const SECTION_ANCHOR: Record<Exclude<SectionKey, "profile" | "share">, string> = {
  maturity: "tc-section-maturity",
  documentation: "tc-section-documentation",
  contact: "tc-section-contact",
};

export default function PublicTrustCenterLayout({ assetId }: Props) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [active, setActive] = useState<SectionKey>("profile");

  // Sync from hash on mount
  useEffect(() => {
    const h = window.location.hash.replace("#", "") as SectionKey;
    if (h && ["profile", "maturity", "documentation", "contact", "share"].includes(h)) {
      setActive(h);
    }
  }, []);

  const handleSelect = (key: SectionKey) => {
    setActive(key);
    window.history.replaceState(null, "", `#${key}`);
    if (key !== "profile" && key !== "share") {
      // Scroll to anchor inside profile after render
      setTimeout(() => {
        const el = document.getElementById(SECTION_ANCHOR[key as keyof typeof SECTION_ANCHOR]);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const publicUrl = typeof window !== "undefined" ? window.location.href : "";

  const navItems: { key: SectionKey; label: string; icon: typeof Shield }[] = [
    { key: "profile", label: isNb ? "Trust Profile" : "Trust Profile", icon: Shield },
    { key: "maturity", label: isNb ? "Modenhet" : "Maturity", icon: BarChart3 },
    { key: "documentation", label: isNb ? "Dokumentasjon" : "Documentation", icon: FileText },
    { key: "contact", label: isNb ? "Kontakt" : "Contact", icon: MessageSquare },
    { key: "share", label: isNb ? "Del profilen" : "Share profile", icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Trust Engine top bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/trust-engine")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {isNb ? "Tilbake til søk" : "Back to search"}
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">Mynder Trust Engine</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs gap-1.5 border-primary/30 text-primary">
            <Globe className="h-3 w-3" />
            Open Database
          </Badge>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <div className="md:sticky md:top-20 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                {isNb ? "Trust Center" : "Trust Center"}
              </p>
              <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelect(item.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 px-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isNb
                    ? "All informasjon vises her — du forlater ikke Trust Centeret når du leser dokumentasjon."
                    : "Everything stays here — you don't leave the Trust Center when reading documentation."}
                </p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {active === "share" ? (
              <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {isNb ? "Del Trust Profilen" : "Share the Trust Profile"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isNb
                      ? "Send lenken til kunder, partnere eller del i sosiale kanaler."
                      : "Send the link to customers, partners or share on social channels."}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center gap-3">
                  <code className="text-sm font-mono text-foreground truncate flex-1">{publicUrl}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      toast.success(isNb ? "Lenke kopiert" : "Link copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {isNb ? "Kopier" : "Copy"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`, "_blank", "noopener,noreferrer")}
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`, "_blank", "noopener,noreferrer")}
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const subject = isNb ? "Trust Profile" : "Trust Profile";
                      const body = isNb
                        ? `Hei,\n\nDu kan se Trust Profilen her: ${publicUrl}\n`
                        : `Hi,\n\nYou can view the Trust Profile here: ${publicUrl}\n`;
                      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                  >
                    <Mail className="h-4 w-4" />
                    {isNb ? "E-post" : "Email"}
                  </Button>
                </div>
              </div>
            ) : (
              <TrustCenterProfile assetId={assetId} readOnly />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
