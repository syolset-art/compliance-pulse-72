import { useTranslation } from "react-i18next";
import { HelpCircle, Bot, Award, MessageCircle, GraduationCap } from "lucide-react";

interface QuickLinksPanelProps {
  onSelectContext: (contextId: string) => void;
  activeContext: string | null;
}

const quickLinks = [
  { id: "mynder-help", icon: HelpCircle, titleKey: "resources.quickLinks.mynderHelp", descKey: "resources.quickLinks.mynderHelpDesc", emoji: "🧭" },
  { id: "lara", icon: Bot, titleKey: "resources.quickLinks.laraHelp", descKey: "resources.quickLinks.laraHelpDesc", emoji: "🦋" },
  { id: "iso", icon: Award, titleKey: "resources.quickLinks.isoHelp", descKey: "resources.quickLinks.isoHelpDesc", emoji: "🏅" },
  { id: "faq", icon: MessageCircle, titleKey: "resources.quickLinks.faqHelp", descKey: "resources.quickLinks.faqHelpDesc", emoji: "💬" },
  { id: "regulatory", icon: GraduationCap, titleKey: "resources.quickLinks.trainingHelp", descKey: "resources.quickLinks.trainingHelpDesc", emoji: "📚" },
];

export const QuickLinksPanel = ({ onSelectContext, activeContext }: QuickLinksPanelProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-1">
        {t("resources.quickLinks.title")}
      </h3>
      <div className="space-y-1.5">
        {quickLinks.map((link) => {
          const isActive = activeContext === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectContext(link.id)}
              className={`w-full group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 text-left ${
                isActive
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
                  : "text-foreground/70 hover:bg-accent/60 hover:text-foreground hover:shadow-sm"
              }`}
            >
              <span className="text-lg flex-shrink-0">{link.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className={`font-medium text-[13px] leading-tight ${isActive ? "text-primary" : ""}`}>
                  {t(link.titleKey)}
                </p>
                <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                  {t(link.descKey)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
