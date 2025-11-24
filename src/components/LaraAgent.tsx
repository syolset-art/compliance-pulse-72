import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import laraButterfly from "@/assets/lara-butterfly.png";

export const LaraAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Floating Lara Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative group animate-fade-in"
          >
            <img 
              src={laraButterfly} 
              alt="Lara AI Agent" 
              className="w-20 h-20 hover:scale-110 transition-transform duration-300 drop-shadow-lg"
            />
            {/* Blinking notification dot */}
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
            </span>
          </button>
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
