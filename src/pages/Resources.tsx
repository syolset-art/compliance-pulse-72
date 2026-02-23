import { useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { SupportChat } from "@/components/support/SupportChat";
import { Badge } from "@/components/ui/badge";
import {
  Compass, Sparkles, Award, BookOpen, MessageCircle,
  Shield, Scale, FileText, Bot, ArrowRight,
} from "lucide-react";

const actionCards = [
  { id: "mynder-help", icon: Compass, title: "Kom i gang", desc: "Lær å bruke Mynder-plattformen", emoji: "🧭", gradient: "from-blue-500/15 to-blue-400/5", iconColor: "text-blue-500" },
  { id: "lara", icon: Sparkles, title: "Lara AI-assistent", desc: "Spør Lara om hva som helst", emoji: "🦋", gradient: "from-purple-500/15 to-pink-400/5", iconColor: "text-purple-500" },
  { id: "iso", icon: Award, title: "ISO 27001-veien", desc: "Steg-for-steg sertifisering", emoji: "🏅", gradient: "from-amber-500/15 to-orange-400/5", iconColor: "text-amber-500" },
  { id: "regulatory", icon: BookOpen, title: "Faglig opplæring", desc: "GDPR, NIS2, AI Act kurs", emoji: "📚", gradient: "from-emerald-500/15 to-green-400/5", iconColor: "text-emerald-500" },
  { id: "faq", icon: MessageCircle, title: "Ofte stilte spørsmål", desc: "Raske svar på vanlige spørsmål", emoji: "💬", gradient: "from-sky-500/15 to-cyan-400/5", iconColor: "text-sky-500" },
];

const knowledgeCards = [
  { id: "gdpr", icon: Shield, title: "GDPR", desc: "Personvern og databehandling", articles: 6, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "nis2", icon: Scale, title: "NIS2", desc: "Cybersikkerhet og beredskap", articles: 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "iso27001", icon: FileText, title: "ISO 27001", desc: "Informasjonssikkerhet", articles: 0, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "aiact", icon: Bot, title: "AI Act", desc: "AI-regulering og etikk", articles: 0, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const Resources = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleSelectContext = (id: string) => {
    setActiveContext(id);
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="px-4 pb-6 space-y-4">
            {/* Compact welcome */}
            <div className="pt-2">
              <h1 className="text-lg font-semibold text-foreground">Hva kan vi hjelpe deg med?</h1>
            </div>

            {/* Horizontal topic chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {actionCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setActiveContext(card.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    activeContext === card.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border/50 text-foreground/70 hover:bg-accent"
                  }`}
                >
                  <span>{card.emoji}</span>
                  {card.title}
                </button>
              ))}
            </div>

            {/* Full-height chat */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
              <SupportChat activeContext={activeContext} onSelectContext={setActiveContext} showContextChips={false} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Desktop: vertical dashboard layout
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

          {/* Hero welcome */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Hva kan vi hjelpe deg med?
            </h1>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Utforsk ressurser, still spørsmål til Lara, eller finn svar i kunnskapsbasen.
            </p>
          </div>

          {/* Action cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {actionCards.map((card) => {
              const Icon = card.icon;
              const isActive = activeContext === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => handleSelectContext(card.id)}
                  className={`group relative text-left rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    isActive
                      ? "border-primary/30 bg-primary/5 shadow-md ring-1 ring-primary/20"
                      : "border-border/50 bg-card hover:border-primary/20"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <p className="font-semibold text-sm text-foreground mb-1">{card.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                  <ArrowRight className={`absolute top-5 right-5 h-4 w-4 transition-all duration-200 ${
                    isActive ? "text-primary opacity-100" : "text-muted-foreground/0 group-hover:text-muted-foreground/50 group-hover:opacity-100"
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Knowledge base horizontal scroll */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Kunnskapsbase
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {knowledgeCards.map((k) => {
                const Icon = k.icon;
                return (
                  <div
                    key={k.id}
                    className="flex-shrink-0 w-52 rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <div className={`h-9 w-9 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-4.5 w-4.5 ${k.color}`} />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{k.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{k.desc}</p>
                    {k.articles > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-2 font-normal">
                        {k.articles} artikler
                      </Badge>
                    )}
                    {k.articles === 0 && (
                      <span className="text-[10px] text-muted-foreground/50 mt-2 block">Kommer snart</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat section */}
          <div ref={chatRef} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Chat med oss
            </h2>
            <div className="rounded-2xl border border-border/50 bg-card shadow-md overflow-hidden ring-1 ring-primary/5" style={{ height: "500px" }}>
              <SupportChat activeContext={activeContext} onSelectContext={setActiveContext} showContextChips={false} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Resources;
