import { useTranslation } from "react-i18next";
import { Shield, Scale, FileText, Bot, ChevronRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface KnowledgeArticle {
  title: string;
  summary: string;
  tag: string;
  readTime: string;
}

const gdprArticles: KnowledgeArticle[] = [
  { title: "Art. 5 – Prinsipper for behandling", summary: "Lovlig, rettferdig og transparent behandling av personopplysninger.", tag: "Grunnprinsipper", readTime: "4 min" },
  { title: "Art. 6 – Behandlingsgrunnlag", summary: "Gyldige grunnlag for behandling: samtykke, avtale, berettiget interesse.", tag: "Lovlighet", readTime: "6 min" },
  { title: "Art. 25 – Innebygd personvern", summary: "Personvern fra design-fasen med tekniske og organisatoriske tiltak.", tag: "Tiltak", readTime: "5 min" },
  { title: "Art. 28 – Databehandler", summary: "Krav til databehandleravtale (DPA) med tredjeparter.", tag: "Tredjeparter", readTime: "6 min" },
  { title: "Art. 30 – Behandlingsprotokoll", summary: "Krav om ROPA med formål, kategorier og slettingsfrister.", tag: "Dokumentasjon", readTime: "5 min" },
  { title: "Art. 33-34 – Avvikshåndtering", summary: "Meldeplikt til Datatilsynet innen 72 timer ved brudd.", tag: "Avvik", readTime: "5 min" },
];

const categories = [
  { id: "gdpr", icon: Shield, title: "GDPR", descKey: "resources.knowledge.gdprDesc", articles: gdprArticles },
  { id: "nis2", icon: Scale, title: "NIS2", descKey: "resources.knowledge.nis2Desc", articles: [] as KnowledgeArticle[] },
  { id: "iso27001", icon: FileText, title: "ISO 27001", descKey: "resources.knowledge.isoDesc", articles: [] as KnowledgeArticle[] },
  { id: "aiact", icon: Bot, title: "AI Act", descKey: "resources.knowledge.aiActDesc", articles: [] as KnowledgeArticle[] },
];

export const KnowledgePanel = () => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = categories.find(c => c.id === expandedId);

  if (expanded && expanded.articles.length > 0) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setExpandedId(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("resources.knowledge.title")}
        </button>
        <h3 className="text-sm font-semibold text-foreground">{expanded.title}</h3>
        <div className="space-y-1.5">
          {expanded.articles.map((article, i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer group"
            >
              <p className="text-sm font-medium text-foreground leading-tight">{article.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{article.tag}</Badge>
                <span className="text-[10px] text-muted-foreground">{article.readTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {t("resources.knowledge.title")}
      </h3>
      <div className="space-y-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => cat.articles.length > 0 && setExpandedId(cat.id)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left text-foreground/70 hover:bg-accent/50 hover:text-foreground"
          >
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <cat.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{cat.title}</p>
              <p className="text-xs text-muted-foreground truncate">{t(cat.descKey)}</p>
            </div>
            <span className="text-xs text-muted-foreground">{cat.articles.length || "—"}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
