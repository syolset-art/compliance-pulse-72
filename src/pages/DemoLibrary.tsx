import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play, Search, Clock, Shield, Bot, Package, Users, FileText,
  Sparkles, ArrowRight, Presentation
} from "lucide-react";
import { cn } from "@/lib/utils";
import laraButterfly from "@/assets/lara-butterfly.png";

interface DemoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  difficulty: "enkel" | "middels" | "avansert";
  targetRoute: string;
  scenarioId: string;
  icon: typeof Shield;
  tags: string[];
}

const DEMO_CATEGORIES = [
  { id: "all", label: "Alle", icon: Sparkles },
  { id: "onboarding", label: "Onboarding", icon: Users },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "ai", label: "AI-funksjoner", icon: Bot },
  { id: "leverandor", label: "Leverandører", icon: Package },
  { id: "partner", label: "Partner / MSP", icon: Presentation },
];

const DEMO_ITEMS: DemoItem[] = [
  {
    id: "dashboard-overview",
    title: "Dashboard-gjennomgang",
    description: "Vis kundene en oversikt over dashbordet med compliance-status, oppgaver og risikoindikatorer.",
    category: "onboarding",
    estimatedMinutes: 3,
    difficulty: "enkel",
    targetRoute: "/",
    scenarioId: "dashboard-overview",
    icon: Shield,
    tags: ["dashboard", "oversikt", "kom i gang"],
  },
  {
    id: "create-processing-activity",
    title: "Opprett behandlingsaktivitet",
    description: "Demonstrer hvordan man oppretter en ny behandlingsaktivitet (ROPA) med formål, rettslig grunnlag og datatyper.",
    category: "compliance",
    estimatedMinutes: 5,
    difficulty: "middels",
    targetRoute: "/protocols",
    scenarioId: "create-processing-activity",
    icon: FileText,
    tags: ["ROPA", "GDPR", "protokoll", "behandling"],
  },
  {
    id: "lara-ai-suggestions",
    title: "Lara foreslår prosesser",
    description: "Vis hvordan AI-agenten Lara automatisk genererer forslag til prosesser og behandlingsaktiviteter for et arbeidsområde.",
    category: "ai",
    estimatedMinutes: 4,
    difficulty: "middels",
    targetRoute: "/work-areas",
    scenarioId: "lara-ai-suggestions",
    icon: Bot,
    tags: ["AI", "Lara", "prosesser", "arbeidsområde"],
  },
  {
    id: "vendor-assessment",
    title: "Leverandørvurdering",
    description: "Gjennomfør en komplett leverandørvurdering med sjekkliste, risikovurdering og compliance-score.",
    category: "leverandor",
    estimatedMinutes: 5,
    difficulty: "middels",
    targetRoute: "/assets",
    scenarioId: "vendor-assessment",
    icon: Package,
    tags: ["leverandør", "vurdering", "risiko"],
  },
  {
    id: "nis2-partner-assessment",
    title: "NIS2-vurdering (Partner)",
    description: "Demonstrer partner-flyten for NIS2-vurdering av en kundes enheter via MSP-dashbordet.",
    category: "partner",
    estimatedMinutes: 6,
    difficulty: "avansert",
    targetRoute: "/msp-dashboard",
    scenarioId: "nis2-partner-assessment",
    icon: Presentation,
    tags: ["NIS2", "partner", "MSP", "vurdering"],
  },
  {
    id: "compliance-checklist",
    title: "Compliance-sjekkliste",
    description: "Gå gjennom compliance-sjekklisten og vis hvordan krav håndteres med AI-assistanse.",
    category: "compliance",
    estimatedMinutes: 4,
    difficulty: "enkel",
    targetRoute: "/compliance-checklist",
    scenarioId: "compliance-checklist",
    icon: Shield,
    tags: ["compliance", "sjekkliste", "krav"],
  },
];

const difficultyColors: Record<string, string> = {
  enkel: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  middels: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  avansert: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function DemoLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selgerModus, setSelgerModus] = useState(false);

  const filtered = DEMO_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleStartDemo = (item: DemoItem) => {
    // Store the scenario ID so the target page can pick it up
    sessionStorage.setItem("pending-demo", item.scenarioId);
    navigate(item.targetRoute);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto md:pt-11">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={laraButterfly} alt="" className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Demo-bibliotek</h1>
                  <p className="text-sm text-muted-foreground">
                    Ferdige demoer for selgere og rådgivere
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer">
                  <Presentation className="h-4 w-4" />
                  Selgermodus
                  <Switch checked={selgerModus} onCheckedChange={setSelgerModus} />
                </label>
              </div>
            </div>

            {selgerModus && (
              <div className="mb-4 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm text-foreground">
                  <strong>Selgermodus er aktiv.</strong> Irrelevante innstillinger og utviklerverktøy er skjult for en renere presentasjon.
                </p>
              </div>
            )}

            {/* Search + Category filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter demo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {DEMO_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className="gap-1.5"
                  >
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Ingen demoer funnet for dette søket.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((item) => (
                <Card
                  key={item.id}
                  className="group hover:shadow-lg transition-all cursor-pointer border-border hover:border-primary/30"
                  onClick={() => handleStartDemo(item)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge className={cn("text-[10px]", difficultyColors[item.difficulty])}>
                        {item.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-3">{item.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        ~{item.estimatedMinutes} min
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Start
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
