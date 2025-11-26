import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Leaf, FileText, HardHat } from "lucide-react";
import laraButterfly from "@/assets/lara-butterfly.png";

export const LaraAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const navigate = useNavigate();

  const newFeatures = [
    { icon: Leaf, title: "Bærekraftsrapport", badge: "Nytt", link: "/sustainability" },
    { icon: FileText, title: "Åpenhetsloven", badge: "Nytt", link: "/transparency" },
    { icon: HardHat, title: "HMS Rapportering", badge: "Beta" }
  ];

  return (
    <>
      {/* Floating Lara Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(true)}
              className="relative group animate-fade-in"
            >
              <img 
                src={laraButterfly} 
                alt="Lara AI Agent" 
                className="w-20 h-20 hover:scale-110 transition-transform duration-300 drop-shadow-lg"
              />
              {/* Feature notification badge */}
              <Badge 
                className="absolute -top-2 -right-2 bg-success text-success-foreground text-xs px-2 cursor-pointer hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFeatures(!showFeatures);
                }}
              >
                3 nye
              </Badge>
            </button>

            {/* Features popup */}
            {showFeatures && (
              <Card className="absolute bottom-full right-0 mb-2 w-64 shadow-xl animate-scale-in">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">Nye funksjoner</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setShowFeatures(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {newFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (feature.link) {
                            navigate(feature.link);
                            setShowFeatures(false);
                          }
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                        disabled={!feature.link}
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground flex-1">{feature.title}</span>
                        <Badge variant="outline" className="text-xs">{feature.badge}</Badge>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Lara Card */}
        {isOpen && (
          <Card className="w-80 shadow-2xl animate-scale-in border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={laraButterfly} 
                    alt="Lara" 
                    className="w-10 h-10"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-1">
                      Lara
                      <Sparkles className="w-3 h-3 text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground">Din AI-assistent</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  👋 Hei! Jeg har lagt merke til at du ikke har fullført innledende oppsett ennå.
                </p>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Anbefalt handling:
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    Fullføre organisasjonsoppsett og sikkerhetsrammeverk
                  </p>
                </div>

                <Button 
                  onClick={() => {
                    navigate("/onboarding");
                    setIsOpen(false);
                  }}
                  className="w-full"
                >
                  Start oppsett
                </Button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  Gjør dette senere
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};
