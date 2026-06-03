import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Shield, FileText, MessageSquare, BarChart3, Lock, ChevronDown, Info, Sparkles, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TrustCenterProfile from "@/pages/TrustCenterProfile";
import PublicTrustFooter from "@/components/trust-center/PublicTrustFooter";
import { useAuth } from "@/hooks/useAuth";


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
  const { user } = useAuth();
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
          <button
            onClick={() => navigate("/trust-engine")}
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isNb ? "Gå til Mynder Trust Engine søk" : "Go to Mynder Trust Engine search"}
          >
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Mynder Trust Engine</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/trust-engine")}
              className="hidden sm:inline-flex"
            >
              {isNb ? "Om Trust Profile" : "About Trust Profile"}
            </Button>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {isNb ? "Tilbake" : "Back"}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  {isNb ? "Opprette din profil" : "Create your profile"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  {isNb ? "Logg inn" : "Log in"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 md:px-6 py-6 flex-1">
        <main className="min-w-0">
          <TrustCenterProfile assetId={assetId} readOnly />
        </main>
      </div>


      <PublicTrustFooter />
    </div>
  );
}
