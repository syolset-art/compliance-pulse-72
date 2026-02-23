import { useTranslation } from "react-i18next";
import { HelpCircle, Bot, Award, MessageCircle, GraduationCap } from "lucide-react";

interface QuickLinksPanelProps {
  onSelectContext: (contextId: string) => void;
  activeContext: string | null;
}

const quickLinks = [
  { id: "mynder-help", icon: HelpCircle, titleKey: "resources.quickLinks.mynderHelp", descKey: "resources.quickLinks.mynderHelpDesc" },
  { id: "lara", icon: Bot, titleKey: "resources.quickLinks.laraHelp", descKey: "resources.quickLinks.laraHelpDesc" },
  { id: "iso", icon: Award, titleKey: "resources.quickLinks.isoHelp", descKey: "resources.quickLinks.isoHelpDesc" },
  { id: "faq", icon: MessageCircle, titleKey: "resources.quickLinks.faqHelp", descKey: "resources.quickLinks.faqHelpDesc" },
  { id: "regulatory", icon: GraduationCap, titleKey: "resources.quickLinks.trainingHelp", descKey: "resources.quickLinks.trainingHelpDesc" },
];

export const QuickLinksPanel = ({ onSelectContext, activeContext }: QuickLinksPanelProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {t("resources.quickLinks.title")}
      </h3>
      <div className="space-y-1">
        {quickLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => onSelectContext(link.id)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left ${
              activeContext === link.id
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              activeContext === link.id ? "bg-primary/20" : "bg-muted"
            }`}>
              <link.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{t(link.titleKey)}</p>
              <p className="text-xs text-muted-foreground truncate">{t(link.descKey)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
