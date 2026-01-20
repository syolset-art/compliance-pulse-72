import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldAlert, Eye, CheckCircle2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface RiskLevel {
  id: string;
  label: string;
  description: string;
  examples: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

interface AIRiskPyramidProps {
  selectedRisk?: string | null;
  onSelectRisk?: (risk: string) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const RISK_LEVELS: RiskLevel[] = [
  {
    id: "unacceptable",
    label: "Uakseptabel risiko",
    description: "Forbudt bruk av AI som truer grunnleggende rettigheter",
    examples: [
      "Sosial scoring av borgere",
      "Manipulerende AI-systemer",
      "Biometrisk masseovervåking"
    ],
    color: "text-white",
    bgColor: "bg-red-600",
    borderColor: "border-red-700",
    icon: <ShieldAlert className="h-4 w-4" />
  },
  {
    id: "high",
    label: "Høy risiko",
    description: "Krever streng regulering og samsvarsvurdering",
    examples: [
      "Rekruttering og HR-beslutninger",
      "Kredittscoring",
      "Medisinsk diagnostikk",
      "Kritisk infrastruktur"
    ],
    color: "text-white",
    bgColor: "bg-orange-500",
    borderColor: "border-orange-600",
    icon: <AlertTriangle className="h-4 w-4" />
  },
  {
    id: "limited",
    label: "Begrenset risiko",
    description: "Krever transparens og informasjonsplikt",
    examples: [
      "Chatboter",
      "Emosjonsgenkjenning",
      "AI-generert innhold",
      "Deepfakes"
    ],
    color: "text-yellow-900",
    bgColor: "bg-yellow-400",
    borderColor: "border-yellow-500",
    icon: <Eye className="h-4 w-4" />
  },
  {
    id: "minimal",
    label: "Minimal risiko",
    description: "Ingen spesifikke krav, frivillige retningslinjer",
    examples: [
      "Spamfiltre",
      "Spillbasert AI",
      "Inventarstyring",
      "Anbefalingssystemer"
    ],
    color: "text-green-900",
    bgColor: "bg-green-400",
    borderColor: "border-green-500",
    icon: <CheckCircle2 className="h-4 w-4" />
  }
];

export const AIRiskPyramid = ({ 
  selectedRisk, 
  onSelectRisk, 
  interactive = true,
  size = 'md',
  showLabels = true
}: AIRiskPyramidProps) => {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: { pyramid: 'max-w-[200px]', text: 'text-[10px]', padding: 'py-1.5 px-2' },
    md: { pyramid: 'max-w-[280px]', text: 'text-xs', padding: 'py-2 px-3' },
    lg: { pyramid: 'max-w-[360px]', text: 'text-sm', padding: 'py-3 px-4' }
  };

  const currentSize = sizeClasses[size];

  // Calculate widths for pyramid effect (top to bottom: narrow to wide)
  const getWidth = (index: number) => {
    const baseWidth = 40; // Top level starts at 40%
    const increment = 20; // Each level adds 20%
    return `${baseWidth + (index * increment)}%`;
  };

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col items-center gap-1", currentSize.pyramid, "mx-auto")}>
        {/* EU AI Act label */}
        <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
          <Info className="h-3.5 w-3.5" />
          <span className={cn("font-medium", currentSize.text)}>EU AI Act Risikopyramide</span>
        </div>

        {RISK_LEVELS.map((level, index) => {
          const isSelected = selectedRisk === level.id;
          const width = getWidth(index);

          return (
            <Tooltip key={level.id} delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => interactive && onSelectRisk?.(level.id)}
                  disabled={!interactive}
                  style={{ width }}
                  className={cn(
                    "relative transition-all duration-200 rounded-sm",
                    currentSize.padding,
                    level.bgColor,
                    level.color,
                    level.borderColor,
                    "border-2",
                    interactive && "cursor-pointer hover:scale-105 hover:shadow-lg",
                    !interactive && "cursor-default",
                    isSelected && "ring-2 ring-offset-2 ring-primary scale-105 shadow-lg",
                    !isSelected && interactive && "opacity-80 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {level.icon}
                    {showLabels && (
                      <span className={cn("font-semibold whitespace-nowrap", currentSize.text)}>
                        {level.label}
                      </span>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -right-1 -top-1 bg-primary text-primary-foreground rounded-full p-0.5">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <div className="space-y-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    {level.icon}
                    {level.label}
                  </div>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                  <div className="pt-1 border-t">
                    <p className="text-xs font-medium mb-1">Eksempler:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {level.examples.map((example, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-muted-foreground/60">•</span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Legend for selection */}
        {interactive && (
          <p className={cn("text-muted-foreground mt-2 text-center", currentSize.text)}>
            Klikk for å velge risikonivå
          </p>
        )}
      </div>
    </TooltipProvider>
  );
};

// Compact horizontal version for inline use
export const AIRiskPyramidInline = ({ 
  selectedRisk, 
  onSelectRisk,
  interactive = true 
}: Omit<AIRiskPyramidProps, 'size' | 'showLabels'>) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {RISK_LEVELS.map((level) => {
          const isSelected = selectedRisk === level.id;
          
          return (
            <Tooltip key={level.id} delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => interactive && onSelectRisk?.(level.id)}
                  disabled={!interactive}
                  className={cn(
                    "p-1.5 rounded transition-all",
                    level.bgColor,
                    level.color,
                    interactive && "cursor-pointer hover:scale-110",
                    !interactive && "cursor-default",
                    isSelected && "ring-2 ring-offset-1 ring-primary scale-110",
                    !isSelected && "opacity-60 hover:opacity-100"
                  )}
                >
                  {level.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="font-medium">{level.label}</div>
                <div className="text-xs text-muted-foreground max-w-[200px]">
                  {level.description}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
