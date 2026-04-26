import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Leaf, FileText, HardHat, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: typeof Leaf;
  color: string;
  bgColor: string;
  badge: string;
  link?: string;
}

export function NewFeaturesWidget() {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const features: Feature[] = [
    {
      id: "sustainability",
      title: "Bærekraftsrapport",
      description: "Lag omfattende bærekraftsrapporter i henhold til CSRD og andre rammeverk. Automatisk datainnsamling og analyse.",
      icon: Leaf,
      color: "text-status-closed",
      bgColor: "bg-status-closed/10 dark:bg-green-950/20",
      badge: "Nytt",
      link: "/sustainability"
    },
    {
      id: "transparency",
      title: "Åpenhetsloven",
      description: "Rapporter på åpenhetsloven med våre verktøy for aktsomhetsvurderinger og menneskerettigheter i leverandørkjeden.",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10 dark:bg-blue-950/20",
      badge: "Nytt",
      link: "/transparency"
    },
    {
      id: "hms",
      title: "HMS Rapportering",
      description: "Systematisk HMS-arbeid med hendelsesrapportering, risikovurdering og oppfølging av tiltak.",
      icon: HardHat,
      color: "text-warning",
      bgColor: "bg-warning/10 dark:bg-orange-950/20",
      badge: "Beta"
    }
  ];

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Nye funksjoner tilgjengelig</CardTitle>
              <CardDescription>Utvid din compliance-portefølje</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="animate-pulse">
            3 nye
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isExpanded = expandedFeature === feature.id;
          
          return (
            <div
              key={feature.id}
              className={`
                group relative overflow-hidden rounded-lg border transition-all duration-300 cursor-pointer
                ${isExpanded ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'}
              `}
              onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
            >
              <div className={`p-4 ${feature.bgColor} transition-all duration-300`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-background/80 ${feature.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{feature.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {feature.badge}
                        </Badge>
                      </div>
                      <p 
                        className={`
                          text-sm text-muted-foreground transition-all duration-300
                          ${isExpanded ? 'line-clamp-none' : 'line-clamp-2'}
                        `}
                      >
                        {feature.description}
                      </p>
                      
                      {isExpanded && (
                        <div className="mt-3 animate-fade-in">
                          {feature.link ? (
                            <Link to={feature.link}>
                              <Button size="sm" className="gap-2">
                                Utforsk funksjonen
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          ) : (
                            <Button size="sm" className="gap-2" disabled>
                              Kommer snart
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div 
                    className={`
                      flex-shrink-0 transition-transform duration-300
                      ${isExpanded ? 'rotate-180' : ''}
                    `}
                  >
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="pt-2">
          <Button variant="outline" className="w-full gap-2 hover-scale">
            Se alle nye funksjoner
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
