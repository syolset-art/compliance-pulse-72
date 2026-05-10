import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Shield, ShieldCheck, Globe, FileText, MessageSquare, BarChart3, Lock, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TrustCenterProfile from "@/pages/TrustCenterProfile";
import PublicTrustFooter from "@/components/trust-center/PublicTrustFooter";

type SectionKey = "profile" | "maturity" | "documentation" | "contact";

interface Props {
  assetId?: string;
}

const SECTION_ANCHOR: Record<Exclude<SectionKey, "profile">, string> = {
  maturity: "tc-section-maturity",
  documentation: "tc-section-documentation",
  contact: "tc-section-contact",
};

export default function PublicTrustCenterLayout({ assetId }: Props) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [active, setActive] = useState<SectionKey>("profile");

  useEffect(() => {
    const h = window.location.hash.replace("#", "") as SectionKey;
    if (h && ["profile", "maturity", "documentation", "contact"].includes(h)) {
      setActive(h);
    }
  }, []);

  const handleSelect = (key: SectionKey) => {
    setActive(key);
    window.history.replaceState(null, "", `#${key}`);
    if (key !== "profile") {
      setTimeout(() => {
        const el = document.getElementById(SECTION_ANCHOR[key as keyof typeof SECTION_ANCHOR]);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navItems: { key: SectionKey; label: string; icon: typeof Shield }[] = [
    { key: "profile", label: isNb ? "Trust Profile" : "Trust Profile", icon: Shield },
    { key: "maturity", label: isNb ? "Modenhet" : "Maturity", icon: BarChart3 },
    { key: "documentation", label: isNb ? "Dokumentasjon" : "Documentation", icon: FileText },
    { key: "contact", label: isNb ? "Kontakt" : "Contact", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Trust Engine top bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto flex items-center justify-between px-6 py-3 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/trust-engine")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {isNb ? "Tilbake til søk" : "Back to search"}
          </Button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">Mynder Trust Engine</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 md:px-6 py-6 flex-1">
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
                          ? "bg-primary/10 text-primary font-medium dark:bg-accent/15 dark:text-accent"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 px-3 space-y-2">
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                  <Lock className="h-3.5 w-3.5 text-primary dark:text-accent shrink-0 mt-0.5" />
                  <span>
                    {isNb
                      ? "Innhold er kryptert og verifisert av eier."
                      : "Content is encrypted and verified by the owner."}
                  </span>
                </div>
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
            <TrustCenterProfile assetId={assetId} readOnly />
          </main>
        </div>
      </div>

      <PublicTrustFooter />
    </div>
  );
}
