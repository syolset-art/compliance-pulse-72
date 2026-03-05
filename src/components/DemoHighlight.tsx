import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import laraButterfly from "@/assets/lara-butterfly.png";

export interface DemoStep {
  selector?: string;
  instruction: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: "click" | "type" | "observe";
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  steps: DemoStep[];
}

interface DemoHighlightProps {
  isActive: boolean;
  scenario?: DemoScenario;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onComplete: () => void;
}

export function DemoHighlight({
  isActive,
  scenario,
  currentStep,
  onNext,
  onPrev,
  onClose,
  onComplete
}: DemoHighlightProps) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !scenario || !scenario.steps[currentStep]) {
      setHighlightRect(null);
      return;
    }

    const step = scenario.steps[currentStep];
    if (!step.selector) {
      setHighlightRect(null);
      return;
    }

    const element = document.querySelector(step.selector);
    if (!element) {
      setHighlightRect(null);
      return;
    }

    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);

      // Calculate tooltip position based on preferred position
      const position = step.position || "bottom";
      const padding = 16;
      
      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = rect.top - padding - (tooltipRef.current?.offsetHeight || 150);
          left = rect.left + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - padding - (tooltipRef.current?.offsetWidth || 300);
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + padding;
          break;
      }

      // Keep tooltip within viewport
      const tooltipWidth = tooltipRef.current?.offsetWidth || 300;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 150;
      
      if (left < padding) left = padding;
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }
      if (top < padding) top = padding;
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = window.innerHeight - tooltipHeight - padding;
      }

      setTooltipPosition({ top, left });
    };

    updatePosition();

    // Add pulse animation to the element
    element.classList.add("demo-highlight-pulse");

    // Observe for changes
    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      element.classList.remove("demo-highlight-pulse");
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isActive, scenario, currentStep]);

  if (!isActive || !scenario) return null;

  const step = scenario.steps[currentStep];
  const isLastStep = currentStep === scenario.steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / scenario.steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Highlight cutout */}
      {highlightRect && (
        <div
          className="fixed z-[101] rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-background pointer-events-none demo-pulse-ring"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
          aria-hidden="true"
        />
      )}

      {/* Allow interaction with highlighted element */}
      {highlightRect && (
        <div
          className="fixed z-[102] pointer-events-auto"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[103] w-80 bg-card border border-border rounded-xl shadow-2xl p-4 pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: step?.position === "top" || step?.position === "bottom" 
            ? "translateX(-50%)" 
            : step?.position === "left" || step?.position === "right"
              ? "translateY(-50%)"
              : "translateX(-50%)"
        }}
        role="dialog"
        aria-labelledby="demo-title"
        aria-describedby="demo-instruction"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={laraButterfly} alt="" className="w-6 h-6" aria-hidden="true" />
            <span id="demo-title" className="font-semibold text-foreground text-sm">
              {scenario.title}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
            aria-label="Lukk demo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Steg {currentStep + 1} av {scenario.steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Instruction */}
        <p id="demo-instruction" className="text-sm text-foreground mb-4 leading-relaxed">
          {step?.instruction || ""}
        </p>

        {/* Action hint */}
        {step?.action && (
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>
              {step.action === "click" && "Klikk på det markerte elementet"}
              {step.action === "type" && "Skriv inn i det markerte feltet"}
              {step.action === "observe" && "Se på det markerte området"}
            </span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Forrige
          </Button>

          {isLastStep ? (
            <Button size="sm" onClick={onComplete} className="gap-1">
              Fullfør demo
            </Button>
          ) : (
            <Button size="sm" onClick={onNext} className="gap-1">
              Neste
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        .demo-highlight-pulse {
          animation: demo-element-pulse 2s ease-in-out infinite;
        }
        
        .demo-pulse-ring {
          animation: demo-ring-pulse 2s ease-in-out infinite;
        }
        
        @keyframes demo-element-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 hsl(var(--primary) / 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px hsl(var(--primary) / 0);
          }
        }
        
        @keyframes demo-ring-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
}

// Demo scenarios definitions
export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  "add-asset": {
    id: "add-asset",
    title: "Legg til eiendel",
    description: "Lær hvordan du legger til eiendeler i systemet",
    steps: [
      {
        instruction: "Velkommen! Jeg skal vise deg hvordan du legger til en ny eiendel. Eiendeler er alle IT-systemer, leverandører, lokasjoner og annet som behandler data i organisasjonen din.",
        action: "observe"
      },
      {
        selector: "[data-demo='add-asset-button']",
        instruction: "Klikk på '+ Ny eiendel' knappen for å åpne dialogen for å legge til en ny eiendel.",
        position: "bottom",
        action: "click"
      },
      {
        instruction: "Nå vil du se en dialog der du kan velge hvilken type eiendel du vil legge til. Du kan velge mellom System, Leverandør, Lokasjon og andre typer.",
        action: "observe"
      },
      {
        instruction: "Etter å ha valgt type, kan du enten bruke AI-forslag basert på din bedriftsprofil, laste opp fra fil, koble til eksterne systemer, eller fylle ut manuelt.",
        action: "observe"
      },
      {
        instruction: "Gratulerer! Du vet nå hvordan du legger til eiendeler. Spør meg gjerne om mer hjelp!",
        action: "observe"
      }
    ]
  },
  "gdpr-gap": {
    id: "gdpr-gap",
    title: "GDPR Gap-analyse",
    description: "Lær hvordan du genererer en GDPR gap-analyse",
    steps: [
      {
        instruction: "La meg vise deg hvordan du får en GDPR gap-analyse. Dette hjelper deg å identifisere hvor organisasjonen har mangler i forhold til GDPR-kravene.",
        action: "observe"
      },
      {
        instruction: "Skriv 'Vis GDPR gap-analyse' i chatten, så genererer jeg en komplett analyse for deg.",
        action: "observe"
      },
      {
        instruction: "Gap-analysen vil vise hvilke GDPR-artikler som er fullt implementert, delvis implementert, eller mangler helt.",
        action: "observe"
      },
      {
        instruction: "For hver mangel får du konkrete anbefalinger for hvordan du kan lukke gapet. Du kan klikke på hver anbefaling for mer detaljer.",
        action: "observe"
      },
      {
        instruction: "Ferdig! Nå vet du hvordan du får en GDPR gap-analyse. Prøv det gjerne selv!",
        action: "observe"
      }
    ]
  },
  "compliance-report": {
    id: "compliance-report",
    title: "Compliance-rapport",
    description: "Lær hvordan du genererer compliance-rapporter",
    steps: [
      {
        instruction: "Jeg skal vise deg hvordan du genererer compliance-rapporter. Disse gir deg en oversikt over etterlevelse av ulike standarder som ISO 27001, GDPR, NIS2 og CRA.",
        action: "observe"
      },
      {
        instruction: "Be meg om å 'Lag en ISO 27001 rapport' eller velg en annen standard du er interessert i.",
        action: "observe"
      },
      {
        instruction: "Rapporten inneholder en executive summary, detaljert gap-analyse per kontrollområde, risikovurdering og en konkret handlingsplan.",
        action: "observe"
      },
      {
        instruction: "Du kan eksportere rapporten til PDF for å dele med ledelsen eller revisor.",
        action: "observe"
      },
      {
        instruction: "Nå vet du hvordan du lager compliance-rapporter. Lykke til!",
        action: "observe"
      }
    ]
  },
  "work-areas": {
    id: "work-areas",
    title: "Arbeidsområder",
    description: "Lær hvordan du organiserer med arbeidsområder",
    steps: [
      {
        instruction: "Arbeidsområder hjelper deg å strukturere organisasjonen din. Hver avdeling eller team kan ha sitt eget arbeidsområde med tilhørende systemer og prosesser.",
        action: "observe"
      },
      {
        selector: "[data-demo='work-areas-link']",
        instruction: "Gå til 'Mine arbeidsområder' i sidemenyen for å administrere arbeidsområdene dine.",
        position: "right",
        action: "click"
      },
      {
        instruction: "Du kan opprette nye arbeidsområder basert på maler som passer din bransje, eller lage egne tilpassede områder.",
        action: "observe"
      },
      {
        instruction: "Hvert arbeidsområde kan ha egne systemer, protokoller, prosesser og ansvarlige personer.",
        action: "observe"
      },
      {
        instruction: "Flott! Nå forstår du hvordan arbeidsområder fungerer.",
        action: "observe"
      }
    ]
  },
  // --- New demo scenarios ---
  "dashboard-overview": {
    id: "dashboard-overview",
    title: "Dashboard-gjennomgang",
    description: "En rask gjennomgang av hovedoversikten",
    steps: [
      {
        instruction: "Velkommen til Mynder! Dette er dashbordet ditt – en samlet oversikt over compliance-status, oppgaver og risiko for hele organisasjonen.",
        action: "observe"
      },
      {
        selector: "[data-demo='compliance-section']",
        instruction: "Her ser du compliance-status for de ulike rammeverkene dere har aktivert, for eksempel GDPR, ISO 27001 og NIS2.",
        position: "bottom",
        action: "observe"
      },
      {
        selector: "[data-demo='sidebar']",
        instruction: "Sidemenyen gir rask tilgang til alle funksjoner: eiendeler, arbeidsområder, oppgaver, rapporter og mer.",
        position: "right",
        action: "observe"
      },
      {
        instruction: "Fra dashbordet kan du også se kritiske oppgaver, kommende frister og Lara sine AI-anbefalinger.",
        action: "observe"
      },
      {
        instruction: "Det var en rask introduksjon! Prøv å utforske de ulike modulene eller spør Lara om hjelp.",
        action: "observe"
      }
    ]
  },
  "create-processing-activity": {
    id: "create-processing-activity",
    title: "Opprett behandlingsaktivitet",
    description: "Opprett en ny behandlingsaktivitet (ROPA)",
    steps: [
      {
        instruction: "Jeg skal vise deg hvordan du oppretter en ny behandlingsaktivitet. Dette er en sentral del av GDPR-dokumentasjonen – Record of Processing Activities (ROPA).",
        action: "observe"
      },
      {
        selector: "[data-demo='add-protocol-button']",
        instruction: "Klikk på '+ Ny protokoll' for å åpne veiviseren for ny behandlingsaktivitet.",
        position: "bottom",
        action: "click"
      },
      {
        instruction: "Fyll inn formålet med behandlingen – for eksempel 'Kundeadministrasjon' eller 'Nyhetsbrev'. AI-en foreslår automatisk basert på bransjen din.",
        action: "observe"
      },
      {
        instruction: "Velg rettslig grunnlag (f.eks. samtykke, berettiget interesse eller avtale) og angi hvilke datatyper som behandles.",
        action: "observe"
      },
      {
        instruction: "Til slutt knytter du behandlingen til et arbeidsområde og ansvarlig person. Klikk 'Lagre' for å fullføre.",
        action: "observe"
      },
      {
        instruction: "Flott! Behandlingsaktiviteten er nå registrert og vil vises i din ROPA-oversikt. Lara overvåker den løpende for compliance-avvik.",
        action: "observe"
      }
    ]
  },
  "lara-ai-suggestions": {
    id: "lara-ai-suggestions",
    title: "Lara foreslår prosesser",
    description: "Se hvordan AI-agenten Lara genererer forslag til prosesser",
    steps: [
      {
        instruction: "Nå skal jeg vise deg en av de kraftigste funksjonene i Mynder: Lara kan automatisk foreslå prosesser og behandlingsaktiviteter basert på informasjon om arbeidsområdet ditt.",
        action: "observe"
      },
      {
        selector: "[data-demo='work-area-card']",
        instruction: "Velg et arbeidsområde – for eksempel 'HR & Personal' eller 'Salg & Marked'. Lara analyserer bransje, størrelse og systemer for å gi relevante forslag.",
        position: "bottom",
        action: "click"
      },
      {
        selector: "[data-demo='ai-suggest-button']",
        instruction: "Klikk på 'AI-forslag' knappen for å la Lara generere prosessforslag. Hun analyserer nå arbeidsområdet og finner relevante prosesser.",
        position: "bottom",
        action: "click"
      },
      {
        instruction: "Lara har generert forslag! Hvert forslag inneholder prosessnavn, beskrivelse, tilknyttede systemer og estimert risikonivå. Du kan godta, avvise eller redigere hvert forslag.",
        action: "observe"
      },
      {
        instruction: "Klikk 'Godta alle' for å legge forslagene til som prosesser, eller gå gjennom dem en for en. Forslagene blir automatisk knyttet til riktig arbeidsområde.",
        action: "observe"
      },
      {
        instruction: "Fantastisk! Lara har nå spart deg for timer med manuelt arbeid. Prosessene er registrert og klare for videre dokumentasjon.",
        action: "observe"
      }
    ]
  },
  "vendor-assessment": {
    id: "vendor-assessment",
    title: "Leverandørvurdering",
    description: "Gjennomfør en komplett leverandørvurdering",
    steps: [
      {
        instruction: "La meg vise deg hvordan du gjennomfører en leverandørvurdering. Dette er viktig for tredjepartshåndtering og compliance.",
        action: "observe"
      },
      {
        selector: "[data-demo='add-asset-button']",
        instruction: "Start med å legge til en leverandør via '+ Ny eiendel' og velg 'Leverandør' som type.",
        position: "bottom",
        action: "click"
      },
      {
        instruction: "Fyll inn leverandørens navn – Mynder henter automatisk informasjon fra Brønnøysundregistrene og offentlige kilder.",
        action: "observe"
      },
      {
        instruction: "Åpne leverandørens Trust Profile for å se compliance-score, sertifiseringer og risikovurdering. Du kan også sende en forespørsel om dokumentasjon direkte.",
        action: "observe"
      },
      {
        instruction: "Bruk sjekklisten for å vurdere GDPR-etterlevelse, sikkerhetstiltak og datahåndtering. Resultatene lagres og oppdaterer compliance-scoren.",
        action: "observe"
      },
      {
        instruction: "Nå vet du hvordan du vurderer leverandører i Mynder. Alle vurderinger er sporbare og klare for revisjon.",
        action: "observe"
      }
    ]
  },
  "nis2-partner-assessment": {
    id: "nis2-partner-assessment",
    title: "NIS2-vurdering (Partner)",
    description: "NIS2-vurdering via partner-dashbordet",
    steps: [
      {
        instruction: "Denne demoen viser hvordan en partner (MSP) kan gjennomføre en NIS2-vurdering for en av sine kunder direkte fra partner-dashbordet.",
        action: "observe"
      },
      {
        selector: "[data-demo='msp-customer-card']",
        instruction: "Velg en kunde fra partner-dashbordet. Du ser kundens overordnede status med compliance-score og aktive tjenester.",
        position: "bottom",
        action: "click"
      },
      {
        instruction: "Fra kundedetaljsiden kan du klikke 'NIS2-vurdering' for å starte en vurdering av kundens enheter og infrastruktur.",
        action: "observe"
      },
      {
        instruction: "Velg enhetene som skal vurderes og gå gjennom NIS2-kravene punkt for punkt. Resultatene lagres på kundens profil.",
        action: "observe"
      },
      {
        instruction: "Etter vurderingen får kunden en NIS2-rapport med gap-analyse og anbefalte tiltak. Partneren kan følge opp med tjenester.",
        action: "observe"
      },
      {
        instruction: "Utmerket! Du har nå sett hele flyten for NIS2-vurdering fra partner-perspektivet.",
        action: "observe"
      }
    ]
  },
  "compliance-checklist": {
    id: "compliance-checklist",
    title: "Compliance-sjekkliste",
    description: "Gå gjennom compliance-kravene med AI-assistanse",
    steps: [
      {
        instruction: "Compliance-sjekklisten gir deg en strukturert gjennomgang av alle krav innenfor dine aktiverte rammeverk.",
        action: "observe"
      },
      {
        selector: "[data-demo='framework-select']",
        instruction: "Velg hvilket rammeverk du vil gjennomgå – for eksempel GDPR, ISO 27001 eller NIS2.",
        position: "bottom",
        action: "click"
      },
      {
        instruction: "Hvert krav viser status (oppfylt, delvis, ikke startet), prioritet og hvem som er ansvarlig. Klikk for å se detaljer.",
        action: "observe"
      },
      {
        instruction: "Lara kan hjelpe med hvert krav – hun foreslår tiltak, kobler til eksisterende dokumentasjon og vurderer om kravet allerede er dekket.",
        action: "observe"
      },
      {
        instruction: "Nå har du oversikt over hvordan compliance-sjekklisten fungerer. Den oppdateres automatisk når du gjør endringer i systemet.",
        action: "observe"
      }
    ]
  },
};

// Helper hook for managing demo state
export function useDemoState() {
  const [isActive, setIsActive] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<DemoScenario | undefined>();
  const [currentStep, setCurrentStep] = useState(0);

  const startDemo = (scenarioId: string) => {
    const scenario = DEMO_SCENARIOS[scenarioId];
    if (scenario) {
      setCurrentScenario(scenario);
      setCurrentStep(0);
      setIsActive(true);
    }
  };

  const nextStep = () => {
    if (currentScenario && currentStep < currentScenario.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const closeDemo = () => {
    setIsActive(false);
    setCurrentScenario(undefined);
    setCurrentStep(0);
  };

  const completeDemo = () => {
    closeDemo();
  };

  return {
    isActive,
    currentScenario,
    currentStep,
    startDemo,
    nextStep,
    prevStep,
    closeDemo,
    completeDemo
  };
}
