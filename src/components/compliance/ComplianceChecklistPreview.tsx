import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  Lock, 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RequirementCard, RequirementStatus } from "./RequirementCard";
import { AgentCapabilitySummary } from "./AgentCapabilityBadge";
import { cn } from "@/lib/utils";
import type { ComplianceRequirement, AgentCapability } from "@/lib/complianceRequirementsData";

interface RequirementWithStatus extends ComplianceRequirement {
  status: RequirementStatus;
  progress_percent?: number;
  is_ai_handling?: boolean;
}

interface ComplianceChecklistPreviewProps {
  frameworkId: string;
  frameworkName: string;
  frameworkIcon?: 'shield' | 'lock' | 'bot';
  requirements: RequirementWithStatus[];
  maxItemsToShow?: number;
  onViewFullChecklist?: () => void;
  onStartTask?: (requirementId: string) => void;
  onOpenChat?: (context: string) => void;
  className?: string;
}

const iconMap = {
  shield: Shield,
  lock: Lock,
  bot: Bot
};

export function ComplianceChecklistPreview({
  frameworkId,
  frameworkName,
  frameworkIcon = 'shield',
  requirements,
  maxItemsToShow = 5,
  onViewFullChecklist,
  onStartTask,
  onOpenChat,
  className
}: ComplianceChecklistPreviewProps) {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language?.startsWith('nb') || i18n.language?.startsWith('no');
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const Icon = iconMap[frameworkIcon];
  
  // Calculate stats
  const totalRequirements = requirements.length;
  const completedRequirements = requirements.filter(r => r.status === 'completed').length;
  const inProgressRequirements = requirements.filter(r => r.status === 'in_progress').length;
  const aiHandlingCount = requirements.filter(r => r.is_ai_handling).length;
  
  // Score based on maturity levels: avg(maturity_level / 4) * 100
  const progressPercent = totalRequirements > 0 
    ? Math.round(
        requirements.reduce((sum, r) => sum + ((r as any).maturity_level ?? 0) / 4, 0) / totalRequirements * 100
      ) 
    : 0;
  
  // Group requirements
  const incompleteManual = requirements
    .filter(r => r.status !== 'completed' && r.status !== 'not_applicable' && r.agent_capability === 'manual')
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  
  const aiWorkingOn = requirements
    .filter(r => r.status === 'in_progress' && (r.is_ai_handling || r.agent_capability === 'full'));
  
  const completed = requirements
    .filter(r => r.status === 'completed')
    .sort((a, b) => a.sort_order - b.sort_order);

  // Agent capability counts
  const capabilityCounts = {
    full: requirements.filter(r => r.agent_capability === 'full').length,
    assisted: requirements.filter(r => r.agent_capability === 'assisted').length,
    manual: requirements.filter(r => r.agent_capability === 'manual').length
  };

  const handleStartTask = (requirementId: string) => {
    if (onStartTask) {
      onStartTask(requirementId);
    } else {
      navigate(`/tasks?requirement=${requirementId}`);
    }
  };

  const handleViewFullChecklist = () => {
    if (onViewFullChecklist) {
      onViewFullChecklist();
    } else {
      navigate(`/tasks?framework=${frameworkId}`);
    }
  };

  return (
    <Card variant="luxury" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{frameworkName}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedRequirements} of {totalRequirements} requirements completed
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>Collapse <ChevronUp className="h-4 w-4 ml-1" /></>
            ) : (
              <>Expand <ChevronDown className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          
          {/* Agent capability breakdown */}
          <div className="flex items-center justify-between pt-1">
            <AgentCapabilitySummary counts={capabilityCounts} size="sm" />
            {aiHandlingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                {aiHandlingCount} AI active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Critical items requiring manual attention */}
          {incompleteManual.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h4 className="text-sm font-medium">
                  Requires Your Attention ({incompleteManual.length})
                </h4>
              </div>
              <div className="space-y-2">
                {incompleteManual.slice(0, maxItemsToShow).map((req) => (
                  <RequirementCard
                    key={req.requirement_id}
                    requirementId={req.requirement_id}
                    name={(isNorwegian && req.name_no) ? req.name_no : req.name}
                    description={(isNorwegian && req.description_no) ? req.description_no : req.description}
                    status={req.status}
                    priority={req.priority}
                    agentCapability={req.agent_capability}
                    progressPercent={req.progress_percent}
                    isAiHandling={req.is_ai_handling}
                    onStartTask={() => handleStartTask(req.requirement_id)}
                  />
                ))}
                {incompleteManual.length > maxItemsToShow && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    + {incompleteManual.length - maxItemsToShow} more requiring manual action
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI working on */}
          {aiWorkingOn.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-status-closed" />
                <h4 className="text-sm font-medium">
                  AI Working On ({aiWorkingOn.length})
                </h4>
              </div>
              <div className="space-y-2">
                {aiWorkingOn.slice(0, 3).map((req) => (
                  <RequirementCard
                    key={req.requirement_id}
                    requirementId={req.requirement_id}
                    name={(isNorwegian && req.name_no) ? req.name_no : req.name}
                    status={req.status}
                    priority={req.priority}
                    agentCapability={req.agent_capability}
                    progressPercent={req.progress_percent}
                    isAiHandling={true}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-status-closed" />
                <h4 className="text-sm font-medium">
                  Completed ({completed.length})
                </h4>
              </div>
              <div className="space-y-1">
                {completed.slice(0, 4).map((req) => (
                  <RequirementCard
                    key={req.requirement_id}
                    requirementId={req.requirement_id}
                    name={(isNorwegian && req.name_no) ? req.name_no : req.name}
                    status={req.status}
                    priority={req.priority}
                    agentCapability={req.agent_capability}
                    compact
                  />
                ))}
                {completed.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    + {completed.length - 4} more completed
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={handleViewFullChecklist}
              className="flex-1"
            >
              View Full Checklist
              <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </Button>
            {onOpenChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChat(`Help me with ${frameworkName} compliance`)}
              >
                Ask Lara
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
