import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Send, Loader2, Undo2, Home, MessageSquarePlus, Share2, Plus, Upload, FileText, AlertTriangle, Shield, Link, ShoppingBag, ThumbsUp, ThumbsDown, Brain, MoreHorizontal, Zap, Search, ListTodo, FileCheck, Database, Check, ChevronRight, Building2, Server, Building, HelpCircle, X, ListChecks, Clock, TrendingUp, CheckCircle2, MessageCircleWarning } from "lucide-react";
import { FeedbackDialog } from "@/components/chat/FeedbackDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import laraButterfly from "@/assets/lara-butterfly.png";
import { useOnboardingProgress, OnboardingStep } from "@/hooks/useOnboardingProgress";
import { PageContext } from "@/hooks/usePageContext";
import { useGlobalChat } from "@/components/GlobalChatProvider";

interface ActionPlanStep {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimated_days: number;
  trust_impact: number;
  category: string;
}

interface ActionPlan {
  title: string;
  summary: string;
  steps: ActionPlanStep[];
  total_trust_impact: number;
  status: "pending" | "approved" | "rejected";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  options?: Array<{
    text: string;
    type: "view" | "action" | "warning";
    prompt: string;
  }>;
  feedback?: "up" | "down" | null;
  isComplete?: boolean;
  thinkingTime?: number;
  thinkingSummary?: string;
  timestamp?: Date;
  actionPlan?: ActionPlan;
}

interface ContentViewOptions {
  viewMode?: "cards" | "table" | "list" | "names-only";
  sortBy?: string;
  filterCriteria?: {
    risk_level?: string;
    has_dpa?: boolean;
    country?: string;
    priority?: string;
    status?: string;
  };
}

interface ChatInterfaceProps {
  onShowContent?: (contentType: string, filter?: string, options?: ContentViewOptions, explanation?: string) => void;
  onBackToDashboard?: () => void;
  onMessagesChange?: (hasMessages: boolean) => void;
  pageContext?: PageContext;
  onStartDemo?: (scenarioId: string) => void;
  pendingMessage?: string | null;
  onPendingMessageSent?: () => void;
  demoMode?: "auto-demo" | "conversational" | null;
}

type SuggestionContext = "default" | "protocols" | "systems" | "third-parties" | "tasks" | "deviations" | "compliance";

type SuggestionType = "view" | "action" | "warning";

interface Suggestion {
  textKey: string;
  type: SuggestionType;
  icon?: React.ComponentType<{ className?: string }>;
}

const suggestionMap: Record<SuggestionContext, Suggestion[]> = {
  default: [
    { textKey: "chat.suggestions.default.addAssets", type: "warning", icon: AlertTriangle },
    { textKey: "chat.suggestions.default.checkCompliance", type: "view", icon: Shield },
    { textKey: "chat.suggestions.default.showRisks", type: "warning", icon: Search },
    { textKey: "chat.suggestions.default.missingDocs", type: "view", icon: Brain }
  ],
  protocols: [
    { textKey: "chat.suggestions.protocols.tableView", type: "view", icon: FileText },
    { textKey: "chat.suggestions.protocols.titlesOnly", type: "view", icon: ListTodo },
    { textKey: "chat.suggestions.protocols.highRisk", type: "view", icon: AlertTriangle },
    { textKey: "chat.suggestions.protocols.missingDpa", type: "warning", icon: AlertTriangle }
  ],
  systems: [
    { textKey: "chat.suggestions.systems.tableView", type: "view", icon: FileText },
    { textKey: "chat.suggestions.systems.namesOnly", type: "view", icon: ListTodo },
    { textKey: "chat.suggestions.systems.highRisk", type: "view", icon: AlertTriangle },
    { textKey: "chat.suggestions.systems.showVendors", type: "view", icon: Database }
  ],
  "third-parties": [
    { textKey: "chat.suggestions.thirdParties.missingTia", type: "warning", icon: AlertTriangle },
    { textKey: "chat.suggestions.thirdParties.generateTia", type: "action", icon: FileCheck },
    { textKey: "chat.suggestions.thirdParties.tableView", type: "view", icon: FileText },
    { textKey: "chat.suggestions.thirdParties.noDpa", type: "view", icon: Search }
  ],
  tasks: [
    { textKey: "chat.suggestions.tasks.listView", type: "view", icon: ListTodo },
    { textKey: "chat.suggestions.tasks.groupPriority", type: "view", icon: FileText },
    { textKey: "chat.suggestions.tasks.titlesOnly", type: "view", icon: ListTodo },
    { textKey: "chat.suggestions.tasks.aiHandled", type: "view", icon: Zap }
  ],
  deviations: [
    { textKey: "chat.suggestions.deviations.openDeviations", type: "view", icon: AlertTriangle },
    { textKey: "chat.suggestions.deviations.criticalFilter", type: "view", icon: AlertTriangle },
    { textKey: "chat.suggestions.deviations.lastMonth", type: "view", icon: Search },
    { textKey: "chat.suggestions.deviations.missingPlan", type: "warning", icon: AlertTriangle }
  ],
  compliance: [
    { textKey: "chat.suggestions.compliance.showStatus", type: "view", icon: FileCheck },
    { textKey: "chat.suggestions.compliance.missingDocs", type: "warning", icon: AlertTriangle },
    { textKey: "chat.suggestions.compliance.gdprStatus", type: "view", icon: Shield },
    { textKey: "chat.suggestions.compliance.generateReport", type: "action", icon: FileText }
  ]
};

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Server,
  Building
};

// Empty state welcome component - centered butterfly with onboarding
function EmptyStateWelcome({ 
  onSuggestionClick, 
  suggestions,
  onboardingSteps,
  onStepAction,
  isOnboardingComplete,
  completedCount,
  totalCount,
  percentComplete,
  isOnboardingDismissed,
  onDismissOnboarding,
  onExpandOnboarding,
  t
}: { 
  onSuggestionClick: (text: string) => void;
  suggestions: Suggestion[];
  onboardingSteps: OnboardingStep[];
  onStepAction: (step: OnboardingStep) => void;
  isOnboardingComplete: boolean;
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  isOnboardingDismissed: boolean;
  onDismissOnboarding: () => void;
  onExpandOnboarding: () => void;
  t: (key: string, options?: any) => string;
}) {
  const getStepIcon = (iconName: string) => {
    const Icon = stepIcons[iconName] || Building2;
    return Icon;
  };

  const nextStep = onboardingSteps.find(s => !s.isCompleted);
  const remainingSteps = totalCount - completedCount;
  
  // Show expanded onboarding only if not complete and user expanded it
  const showOnboardingExpanded = !isOnboardingComplete && !isOnboardingDismissed;
  // Show collapsed onboarding hint if not complete and dismissed
  const showOnboardingHint = !isOnboardingComplete && isOnboardingDismissed;

  return (
    <div className="flex flex-col h-full px-4">
      {/* Header with butterfly and welcome */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <img 
          src={laraButterfly} 
          alt="" 
          className="w-16 h-16 mb-3"
          aria-hidden="true"
        />
        <h2 className="text-lg font-medium text-foreground mb-1 text-center">
          {t("chat.welcome.greeting")}
        </h2>
        <p className="text-base text-muted-foreground text-center max-w-xs">
          {t("chat.welcome.description")}
        </p>
      </div>

      {/* Completed badge - only show if user expanded onboarding */}
      {isOnboardingComplete && !isOnboardingDismissed && (
        <div className="mb-4 flex items-center justify-center gap-2" role="status">
          <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3 border-success/40 text-success">
            <Check className="h-3 w-3" aria-hidden="true" />
            {t("chat.complete.title")}
          </Badge>
        </div>
      )}

      {/* Collapsed onboarding hint - subtle expandable */}
      {showOnboardingHint && (
        <button
          onClick={onExpandOnboarding}
          className="mb-4 mx-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-sm text-primary"
        >
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t("chat.onboarding.stepsCompleted", { completed: completedCount, total: totalCount })}</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}

      {/* Onboarding section - expanded */}
      {showOnboardingExpanded && (
        <div className="mb-4 bg-accent/50 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="text-base font-medium text-foreground">{t("chat.onboarding.title")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {remainingSteps} {t("chat.onboarding.remaining")}
              </Badge>
              <button
                onClick={onDismissOnboarding}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={t("chat.onboarding.hideOnboarding")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={percentComplete} aria-valuemin={0} aria-valuemax={100}>
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              {t("chat.onboarding.stepsCompleted", { completed: completedCount, total: totalCount })}
            </p>
          </div>

          {/* Onboarding steps */}
          <div className="space-y-2" role="list" aria-label="Onboarding-steg">
            {onboardingSteps.map((step) => {
              const Icon = getStepIcon(step.icon);
              const isNext = nextStep?.id === step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => onStepAction(step)}
                  disabled={step.isCompleted}
                  aria-current={isNext ? "step" : undefined}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    step.isCompleted
                      ? 'bg-success/10 opacity-60'
                      : isNext
                        ? 'bg-primary/10 border border-primary/30 hover:bg-primary/20'
                        : 'bg-background/50 hover:bg-background'
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                    step.isCompleted
                      ? 'bg-success text-success-foreground'
                      : isNext
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.isCompleted ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${
                      step.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  
                  {!step.isCompleted && (
                    <ChevronRight className={`h-4 w-4 shrink-0 ${
                      isNext ? 'text-primary' : 'text-muted-foreground'
                    }`} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Suggestions */}
      <nav className="w-full space-y-2 pb-3 px-2 mt-4" aria-label={t("chat.suggestions.title")}>
        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">{t("chat.suggestions.title")}</p>
        {suggestions.slice(0, 4).map((suggestion, i) => {
          const Icon = suggestion.icon;
          const text = t(suggestion.textKey);
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(text)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left group"
            >
              {Icon && (
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
              )}
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {text}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface ChatInterfacePropsExtended extends ChatInterfaceProps {
  onOpenSystemDialog?: () => void;
  pendingMessage?: string | null;
  onPendingMessageSent?: () => void;
  demoMode?: "auto-demo" | "conversational" | null;
}

export function ChatInterface({ onShowContent, onBackToDashboard, onMessagesChange, onOpenSystemDialog, pageContext, onStartDemo, pendingMessage, onPendingMessageSent }: ChatInterfacePropsExtended) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState<SuggestionContext>("default");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareType, setShareType] = useState<"internal" | "external">("internal");
  const [isSending, setIsSending] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(true);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  const [currentThinkingTime, setCurrentThinkingTime] = useState<number>(0);
  const [companyName, setCompanyName] = useState<string>("");
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get onboarding progress
  const { 
    steps: onboardingSteps, 
    completedCount, 
    totalCount, 
    percentComplete, 
    isFullyComplete: isOnboardingComplete,
    refetch: refetchOnboarding 
  } = useOnboardingProgress();

  // Get global chat context for asset added callback
  const { registerAssetAddedCallback, unregisterAssetAddedCallback } = useGlobalChat();

  // Track previous next step to detect completion transitions
  const prevNextStepRef = useRef<string | null>(null);

  // Register callback to refetch onboarding when assets are added
  useEffect(() => {
    const callback = () => {
      refetchOnboarding();
    };
    registerAssetAddedCallback(callback);
    return () => {
      unregisterAssetAddedCallback(callback);
    };
  }, [registerAssetAddedCallback, unregisterAssetAddedCallback, refetchOnboarding]);

  // Auto-advance to next onboarding step when current step completes
  useEffect(() => {
    const prevId = prevNextStepRef.current;
    const currentNextStep = onboardingSteps.find(s => !s.isCompleted) || null;
    const currentId = currentNextStep?.id || null;

    // If the previous next step was 'assets' and now it's 'work-areas', auto-navigate
    if (prevId === 'assets' && currentId === 'work-areas') {
      // Small delay to let the user see the completion checkmark
      setTimeout(() => {
        navigate('/work-areas');
      }, 800);
    }

    prevNextStepRef.current = currentId;
  }, [onboardingSteps, navigate]);

  const suggestions = suggestionMap[currentContext];
  const isEmptyState = messages.length === 0;

  // Handle pending message from demo panel
  useEffect(() => {
    if (pendingMessage && !isLoading) {
      handleSend(pendingMessage);
      onPendingMessageSent?.();
    }
  }, [pendingMessage]);

  // Handle onboarding step action
  const handleOnboardingStepAction = (step: OnboardingStep) => {
    if (step.isCompleted) return;

    switch (step.id) {
      case 'company-info':
        setShowCompanyForm(true);
        break;
      case 'frameworks':
        // Framework selection - handled inline or navigate
        break;
      case 'assets':
        // Open add asset dialog via the onOpenSystemDialog callback
        if (onOpenSystemDialog) {
          onOpenSystemDialog();
        }
        break;
      case 'work-areas':
        navigate('/work-areas');
        break;
    }
  };

  // Handle approve action plan
  const handleApprovePlan = async (messageIndex: number) => {
    const msg = messages[messageIndex];
    if (!msg?.actionPlan) return;

    // Update plan status to approved
    setMessages(prev => prev.map((m, i) => 
      i === messageIndex && m.actionPlan 
        ? { ...m, actionPlan: { ...m.actionPlan, status: "approved" as const } }
        : m
    ));

    // Create tasks in database
    try {
      for (const step of msg.actionPlan.steps) {
        await supabase.from("tasks").insert({
          title: step.title,
          description: step.description,
          priority: step.priority,
          type: step.category,
          status: "pending",
          relevant_for: [],
          ai_autonomy_level: 0,
          ai_handling: false,
        });
      }

      // Add confirmation message
      const confirmMsg: Message = {
        role: "assistant",
        content: t("chat.actionPlan.confirmedMessage", { count: msg.actionPlan.steps.length }),
        isComplete: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMsg]);

      toast({
        title: t("chat.actionPlan.tasksCreated"),
        description: t("chat.actionPlan.tasksCreatedDesc", { count: msg.actionPlan.steps.length }),
      });
    } catch (error) {
      console.error("Failed to create tasks:", error);
      toast({
        title: t("common.error"),
        description: t("chat.actionPlan.createError"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    onMessagesChange?.(messages.length > 0);
  }, [messages.length, onMessagesChange]);

  // Fetch company name on mount
  useEffect(() => {
    const fetchCompanyName = async () => {
      const { data } = await supabase
        .from('company_profile')
        .select('name')
        .limit(1)
        .single();
      if (data?.name) {
        setCompanyName(data.name);
      }
    };
    fetchCompanyName();
  }, []);

  const handleFeedback = (messageIndex: number, feedbackType: "up" | "down") => {
    setMessages(prev => prev.map((msg, idx) => {
      if (idx === messageIndex) {
        const newFeedback = msg.feedback === feedbackType ? null : feedbackType;
        return { ...msg, feedback: newFeedback };
      }
      return msg;
    }));
    
    toast({
      title: feedbackType === "up" ? t("chat.feedback.helpful") : t("chat.feedback.notHelpful"),
      description: feedbackType === "up" 
        ? t("chat.feedback.helpfulDesc") 
        : t("chat.feedback.notHelpfulDesc"),
    });
  };

  const handleUndoLastMessage = () => {
    if (messages.length >= 2) {
      setMessages(prev => prev.slice(0, -2));
      setCurrentContext("default");
      toast({
        title: t("chat.undo.title"),
        description: t("chat.undo.description"),
      });
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentContext("default");
    if (onBackToDashboard) {
      onBackToDashboard();
    }
    toast({
      title: t("chat.newChat.title"),
      description: t("chat.newChat.description"),
    });
  };

  const handleShareConversation = () => {
    setShareDialogOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!shareEmail.trim()) {
      toast({
        title: t("common.error"),
        description: t("chat.share.errors.enterEmail"),
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast({
        title: t("common.error"),
        description: t("chat.share.errors.invalidEmail"),
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: t("chat.share.shared"),
        description: t("chat.share.sharedDesc", { email: shareEmail }),
      });

      setShareDialogOpen(false);
      setShareEmail("");
      setShareType("internal");
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("chat.share.errors.failed"),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadProgress(0);
    setUploadDialogOpen(false);

    // Add user message about the upload
    const uploadMsg: Message = { role: "user", content: `📎 Last opp og analyser: ${file.name}`, timestamp: new Date() };
    setMessages(prev => [...prev, uploadMsg]);

    // Show thinking state
    const thinkingMsg: Message = { role: "assistant", content: "", timestamp: new Date() };
    setMessages(prev => [...prev, thinkingMsg]);
    setIsLoading(true);
    setThinkingStartTime(Date.now());

    try {
      // Read file content as text
      setUploadProgress(20);
      const fileText = await file.text();
      setUploadProgress(40);

      // Call analyze-document edge function
      const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`;
      const analyzeResponse = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          documentText: fileText,
          fileName: file.name,
        }),
      });

      setUploadProgress(70);

      if (!analyzeResponse.ok) {
        throw new Error("Analyse feilet");
      }

      const { analysis } = await analyzeResponse.json();
      setUploadProgress(85);

      // Insert discovered suppliers as vendor assets (use demo fallback if AI found none)
      let addedCount = 0;
      const { DEMO_VENDORS } = await import("@/lib/demoVendors");
      const suppliers = analysis?.suppliers?.length > 0 ? analysis.suppliers : DEMO_VENDORS;
      for (const supplier of suppliers) {
        const { error } = await supabase.from("assets").insert({
          name: supplier.name,
          asset_type: "vendor",
          category: supplier.type || "SaaS",
          description: supplier.dataProcessing
            ? `Behandler persondata. ${supplier.certifications?.join(", ") || ""}`
            : supplier.certifications?.join(", ") || "",
          risk_level: supplier.risk_level || (supplier.hasDPA ? "low" : "medium"),
          risk_score: supplier.risk_score ?? (supplier.hasDPA ? 20 : 50),
          compliance_score: supplier.compliance_score ?? (supplier.hasDPA ? 85 : 55),
          vendor: supplier.vendor || supplier.name,
          country: supplier.country || "USA",
          region: supplier.region || "Nord-Amerika",
          criticality: supplier.criticality || "medium",
          url: supplier.url || null,
        });
        if (!error) addedCount++;
      }

      setUploadProgress(100);

      // Build analysis summary for chat
      const suppliersText = suppliers.length
        ? suppliers.map((s: any) => `• **${s.name}** (${s.type})${s.hasDPA ? " – DPA ✓" : " – ⚠️ Mangler DPA"}`).join("\n")
        : "Ingen leverandører funnet.";

      const gapsText = analysis?.complianceGaps?.length
        ? analysis.complianceGaps.map((g: any) => `• **${g.area}** (${g.severity}): ${g.description}`).join("\n")
        : "";

      const thinkingTime = thinkingStartTime ? Math.floor((Date.now() - thinkingStartTime) / 1000) : undefined;

      let resultContent = `🦋 **Analyse fullført: ${file.name}**\n\n`;
      resultContent += `${analysis?.summary || "Dokumentet ble analysert og leverandører identifisert."}\n\n`;
      resultContent += `### Leverandører funnet (${suppliers.length})\n${suppliersText}\n\n`;
      if (addedCount > 0) {
        resultContent += `✅ **${addedCount} leverandør${addedCount > 1 ? "er" : ""} lagt til i leverandørlisten.**\n\n`;
      }
      if (gapsText) {
        resultContent += `### Compliance-gap\n${gapsText}\n\n`;
      }
      resultContent += `Du kan se leverandørene under **Leverandører** i menyen.`;

      // Seed demo inbox after vendors are added
      if (addedCount > 0) {
        const { seedDemoInbox, seedDemoDocuments } = await import("@/lib/demoSeedInbox");
        await seedDemoInbox();
        await seedDemoDocuments();
      }

      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: resultContent, isComplete: true, thinkingTime, thinkingSummary: "Dokumentanalyse" }
            : m
        )
      );

    } catch (error) {
      console.error("Upload/analyze error:", error);
      const errorContent = `❌ Beklager, analysen av **${file.name}** feilet. ${error instanceof Error ? error.message : "Prøv igjen."}`;
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: errorContent, isComplete: true } : m
        )
      );
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      setIsLoading(false);
      setThinkingStartTime(null);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (thinkingStartTime && isLoading) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - thinkingStartTime;
        setCurrentThinkingTime(Math.floor(elapsed / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [thinkingStartTime, isLoading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setThinkingStartTime(Date.now());
    setCurrentThinkingTime(0);

    const lowerText = textToSend.toLowerCase();
    if (lowerText.includes("behandlingsprotokoll") || lowerText.includes("protokoll") || lowerText.includes("protocol") || lowerText.includes("processing record")) {
      setCurrentContext("protocols");
    } else if (lowerText.includes("system") || lowerText.includes("it-system") || lowerText.includes("asset")) {
      setCurrentContext("systems");
    } else if (lowerText.includes("tredjeparti") || lowerText.includes("leverandør") || lowerText.includes("third-part") || lowerText.includes("vendor") || lowerText.includes("supplier")) {
      setCurrentContext("third-parties");
    } else if (lowerText.includes("oppgav") || lowerText.includes("task")) {
      setCurrentContext("tasks");
    } else if (lowerText.includes("avvik") || lowerText.includes("deviation") || lowerText.includes("incident")) {
      setCurrentContext("deviations");
    } else if (lowerText.includes("compliance") || lowerText.includes("etterlevelse")) {
      setCurrentContext("compliance");
    }

    // Detect if this message needs database data
    const needsDbData = lowerText.includes("søk") || lowerText.includes("database") || 
      lowerText.includes("identifiser") || lowerText.includes("høyrisiko") ||
      lowerText.includes("leverandør") || lowerText.includes("risiko") ||
      lowerText.includes("mangler") || lowerText.includes("sikkerhetskontroll") ||
      lowerText.includes("eksponering") || lowerText.includes("ai") ||
      lowerText.includes("vendor") || lowerText.includes("high-risk") ||
      lowerText.includes("gaps") || lowerText.includes("controls");

    let databaseResults: any = undefined;
    if (needsDbData) {
      try {
        // Fetch assets/vendors
        const { data: assets } = await supabase.from("assets").select("id, name, asset_type, risk_level, risk_score, compliance_score, vendor, country, region, criticality, category, vendor_category, gdpr_role, description").limit(50);
        // Fetch systems
        const { data: systems } = await supabase.from("systems").select("id, name, category, vendor, status, risk_level, compliance_score, risk_score").limit(30);
        // Fetch processes
        const { data: processes } = await supabase.from("system_processes").select("id, name, description, status, system_id").limit(30);
        
        databaseResults = {
          assets: assets || [],
          systems: systems || [],
          processes: processes || [],
          summary: {
            total_assets: assets?.length || 0,
            vendors: assets?.filter(a => a.asset_type === "vendor")?.length || 0,
            high_risk: assets?.filter(a => a.risk_level === "high")?.length || 0,
            medium_risk: assets?.filter(a => a.risk_level === "medium")?.length || 0,
            low_risk: assets?.filter(a => a.risk_level === "low")?.length || 0,
          }
        };
      } catch (err) {
        console.error("Failed to prefetch database data:", err);
      }
    }

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          context: pageContext ? {
            currentRoute: pageContext.currentRoute,
            pageName: pageContext.pageName,
            pageDescription: pageContext.pageDescription,
            availableActions: pageContext.availableActions,
            demoScenarios: pageContext.demoScenarios
          } : undefined,
          databaseResults,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          const error = await response.json();
          toast({
            title: t("common.error"),
            description: error.error,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";
      let toolCall: any = null;
      let thinkingSummary = "";
      let hasReceivedFirstContent = false;

      const updateAssistantMessage = (content: string, isComplete = false, thinking?: { time: number; summary: string }) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => 
              i === prev.length - 1 ? { 
                ...m, 
                content, 
                isComplete,
                thinkingTime: thinking?.time,
                thinkingSummary: thinking?.summary,
                timestamp: m.timestamp || new Date()
              } : m
            );
          }
          return [...prev, { 
            role: "assistant", 
            content, 
            isComplete,
            thinkingTime: thinking?.time,
            thinkingSummary: thinking?.summary,
            timestamp: new Date()
          }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.tool_calls) {
              const tc = delta.tool_calls[0];
              if (tc.function?.name === "navigate_to" || tc.function?.name === "show_content" || tc.function?.name === "generate_tia" || tc.function?.name === "suggest_options" || tc.function?.name === "start_demo" || tc.function?.name === "create_action_plan") {
                if (!toolCall) {
                  toolCall = { name: tc.function.name, arguments: "" };
                }
                if (tc.function.arguments) {
                  toolCall.arguments += tc.function.arguments;
                }
              }
            }

            if (delta?.content) {
              if (!hasReceivedFirstContent && thinkingStartTime) {
                const thinkingTime = Math.floor((Date.now() - thinkingStartTime) / 1000);
                thinkingSummary = delta.content;
                hasReceivedFirstContent = true;
                
                updateAssistantMessage("", false, { time: thinkingTime, summary: thinkingSummary });
              } else {
                assistantContent += delta.content;
                
                const thinkingTime = thinkingStartTime ? Math.floor((Date.now() - thinkingStartTime) / 1000) : undefined;
                updateAssistantMessage(
                  assistantContent, 
                  false,
                  thinkingTime && thinkingSummary ? { time: thinkingTime, summary: thinkingSummary } : undefined
                );
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (toolCall && toolCall.arguments) {
        try {
          const args = JSON.parse(toolCall.arguments);
          
          if (toolCall.name === "show_content") {
            setCurrentContext(args.content_type as SuggestionContext);
            
            updateAssistantMessage(assistantContent || t("chat.showingContent"));
            
            if (onShowContent) {
              const options: ContentViewOptions = {
                viewMode: args.view_mode,
                sortBy: args.sort_by,
                filterCriteria: args.filter_criteria
              };
              onShowContent(args.content_type, args.filter, options, args.explanation);
            }
          } else if (toolCall.name === "navigate_to" && args.path) {
            const navMessage = args.reason 
              ? `${assistantContent}\n\n✨ ${args.reason}`
              : `${assistantContent}\n\n✨ ${t("chat.navigating")}`;
            
            updateAssistantMessage(navMessage);
            
            setTimeout(() => {
              navigate(args.path);
              toast({
                title: t("chat.navigatedTo"),
                description: args.reason || t("chat.navigatedDesc"),
              });
            }, 500);
          } else if (toolCall.name === "generate_tia") {
            const tiaMessage = args.status_message 
              ? `${assistantContent}\n\n⚠️ ${args.status_message}`
              : `${assistantContent}\n\n⚠️ ${t("chat.generatingTiaShort")}`;
            
            updateAssistantMessage(tiaMessage);
            
            toast({
              title: "Transfer Impact Assessment",
              description: args.status_message || t("chat.generatingTia"),
              duration: 5000,
            });
          } else if (toolCall.name === "suggest_options") {
            const optionsMessage = args.message || assistantContent;
            
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: optionsMessage, options: args.options } : m
                );
              }
              return [...prev, { role: "assistant", content: optionsMessage, options: args.options }];
            });
          } else if (toolCall.name === "start_demo") {
            const demoMessage = args.intro_message || t("chat.startingDemo", { id: args.scenario_id });
            updateAssistantMessage(demoMessage);
            
            if (onStartDemo && args.scenario_id) {
              setTimeout(() => {
                onStartDemo(args.scenario_id);
              }, 500);
            }
          } else if (toolCall.name === "create_action_plan") {
            const plan: ActionPlan = {
              title: args.title,
              summary: args.summary,
              steps: args.steps,
              total_trust_impact: args.total_trust_impact,
              status: "pending",
            };
            const planMessage = assistantContent || t("chat.actionPlan.created");
            
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: planMessage, actionPlan: plan, isComplete: true } : m
                );
              }
              return [...prev, { role: "assistant", content: planMessage, actionPlan: plan, isComplete: true, timestamp: new Date() }];
            });

            // Also show in content viewer
            if (onShowContent) {
              onShowContent("action-plan", undefined, undefined, JSON.stringify(plan));
            }
          }
        } catch (e) {
          console.error("Failed to parse tool arguments:", e);
        }
      }

      const finalThinkingTime = thinkingStartTime ? Math.floor((Date.now() - thinkingStartTime) / 1000) : undefined;
      
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { 
              ...m, 
              isComplete: true,
              thinkingTime: finalThinkingTime || m.thinkingTime,
              thinkingSummary: thinkingSummary || m.thinkingSummary
            } : m
          );
        }
        return prev;
      });
      setIsLoading(false);
      setThinkingStartTime(null);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: t("chat.error.title"),
        description: t("chat.error.aiResponse"),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return "";
    const locale = i18n.language === 'nb' ? 'nb-NO' : 'en-US';
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
    <div className="flex h-full w-full flex-col bg-card overflow-hidden">
      {/* Messages or Empty State */}
      {isEmptyState ? (
        <div className="flex-1 overflow-hidden">
          <EmptyStateWelcome 
            onSuggestionClick={handleSend} 
            suggestions={suggestions}
            onboardingSteps={onboardingSteps}
            onStepAction={handleOnboardingStepAction}
            isOnboardingComplete={isOnboardingComplete}
            completedCount={completedCount}
            totalCount={totalCount}
            percentComplete={percentComplete}
            isOnboardingDismissed={isOnboardingDismissed}
            onDismissOnboarding={() => setIsOnboardingDismissed(true)}
            onExpandOnboarding={() => setIsOnboardingDismissed(false)}
            t={t}
          />
        </div>
      ) : (
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div key={i}>
                <div
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <img src={laraButterfly} alt="Lara" className="w-6 h-6 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1 max-w-[85%]">
                    {/* Subtle thinking indicator - inline */}
                    {message.role === "assistant" && message.thinkingSummary && (
                      <div className="flex items-center gap-1.5 mb-2 text-sm text-muted-foreground">
                        <Brain className="h-3.5 w-3.5" />
                        <span>{t("chat.thinkingWithTime", { time: message.thinkingTime })}</span>
                      </div>
                    )}
                    
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    
                    {/* Timestamp and feedback for assistant messages */}
                    {message.role === "assistant" && message.isComplete && (
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 ${message.feedback === "up" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => handleFeedback(i, "up")}
                            aria-label={t("chat.aria.helpful")}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 ${message.feedback === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => handleFeedback(i, "down")}
                            aria-label={t("chat.aria.notHelpful")}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* User message timestamp */}
                    {message.role === "user" && (
                      <div className="flex justify-end mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Show options as clickable badges if present */}
                {message.options && message.role === "assistant" && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-9">
                    {message.options.map((option, optIndex) => {
                      const variant = option.type === "warning" 
                        ? "warning" 
                        : option.type === "action" 
                        ? "action" 
                        : "secondary";
                      
                      return (
                        <Badge
                          key={optIndex}
                          variant={variant}
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm py-1.5 px-3"
                          onClick={() => handleSend(option.prompt)}
                        >
                          {option.text}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                {/* Action Plan inline preview */}
                {message.actionPlan && message.role === "assistant" && (
                  <div className="mt-3 ml-9 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground">{message.actionPlan.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{message.actionPlan.summary}</p>
                    <div className="space-y-2">
                      {message.actionPlan.steps.map((step, si) => (
                        <div key={si} className="flex items-start gap-3 p-2.5 rounded-lg bg-background border border-border">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                            step.priority === 'high' ? 'bg-destructive text-destructive-foreground' :
                            step.priority === 'medium' ? 'bg-warning text-warning-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {si + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{step.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {step.estimated_days}d
                              </span>
                              <span className="flex items-center gap-1 text-success">
                                <TrendingUp className="h-3 w-3" /> +{step.trust_impact}%
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {step.priority.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-success" />
                        {t("chat.actionPlan.totalImpact", { impact: message.actionPlan.total_trust_impact })}
                      </span>
                      {message.actionPlan.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleSend(t("chat.actionPlan.cancelPrompt"))}>
                            {t("chat.actionPlan.cancel")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleSend(t("chat.actionPlan.editPrompt"))}>
                            ✏️ {t("chat.actionPlan.edit")}
                          </Button>
                          <Button size="sm" onClick={() => handleApprovePlan(i)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {t("chat.actionPlan.approve")}
                          </Button>
                        </div>
                      )}
                      {message.actionPlan.status === "approved" && (
                        <Badge className="bg-success text-success-foreground">
                          <Check className="h-3 w-3 mr-1" />
                          {t("chat.actionPlan.approved")}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center" role="status" aria-live="polite">
                <img src={laraButterfly} alt="" className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Brain className="h-4 w-4 animate-pulse" aria-hidden="true" />
                  <span className="text-sm">
                    {t("chat.thinking")}{currentThinkingTime > 0 ? ` (${currentThinkingTime}s)` : "..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Notion-style Input Area */}
      <div className="border-t border-border p-3">
        {/* Context-aware suggestions when not in empty state */}
        {!isEmptyState && (
          <div className="space-y-2 mb-3" role="group" aria-label={t("chat.suggestions.title")}>
            {suggestions?.slice(0, 3).map((suggestion, i) => {
              const Icon = suggestion.icon;
              const text = t(suggestion.textKey);
              return (
                <button
                  key={i}
                  onClick={() => handleSend(text)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border bg-background hover:bg-accent hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground text-left"
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  <span className="truncate">{text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Notion-style input container */}
        <div className="rounded-xl border border-border bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          {/* Context chip */}
          <div className="px-4 pt-3 pb-2">
            <span className="inline-flex items-center gap-1 text-sm text-primary bg-primary/10 px-2.5 py-1 rounded-md">
              @ {companyName}
            </span>
          </div>
          
          {/* Input row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-start gap-2 px-4 pb-3"
          >
            {/* Plus menu: upload & add asset */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isLoading}
                  className="h-10 w-10 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {i18n.language === 'nb' ? "Last opp dokument" : "Upload document"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  handleSend(i18n.language === 'nb'
                    ? "Jeg vil legge til en ny verdi (eiendel) med bilde i et arbeidsområde for risikovurdering"
                    : "I want to add a new asset with a photo to a work area for risk assessment");
                }}>
                  <Server className="mr-2 h-4 w-4" />
                  {i18n.language === 'nb' ? "Legg til verdi med bilde" : "Add asset with photo"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Textarea field - expandable */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t("chat.input.placeholder")}
              disabled={isLoading}
              rows={1}
              className="flex-1 min-h-[40px] max-h-[120px] py-2 text-base border-0 bg-transparent focus:outline-none focus:ring-0 resize-none placeholder:text-muted-foreground/60"
              style={{ height: 'auto', overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />

            {/* Mode indicator */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md">
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Auto</span>
            </div>

            {/* More options menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isLoading}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onBackToDashboard}>
                  <Home className="mr-2 h-4 w-4" />
                  {t("chat.menu.goToDashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNewConversation}>
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  {t("chat.menu.newConversation")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShopDialogOpen(true)}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {t("chat.menu.additionalModules")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleUndoLastMessage}
                  disabled={messages.length < 2}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  {t("chat.menu.undoLastMessage")}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleShareConversation}
                  disabled={messages.length === 0}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t("chat.menu.shareConversation")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    handleSend(t("chat.prompts.gapAnalysis"));
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t("chat.menu.gapAnalysis")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleSend(t("chat.prompts.riskAssessment"));
                  }}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {t("chat.menu.riskAssessment")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleSend(t("chat.prompts.complianceReport"));
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t("chat.menu.complianceReport")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toast({
                      title: t("chat.integrationsToast.title"),
                      description: t("chat.integrationsToast.description"),
                    });
                  }}
                >
                  <Link className="mr-2 h-4 w-4" />
                  {t("chat.menu.integrations")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Send button */}
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="h-8 w-8 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>

    {/* Share Dialog */}
    <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("chat.share.title")}</DialogTitle>
          <DialogDescription>
            {t("chat.share.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("chat.share.shareType")}</Label>
            <RadioGroup value={shareType} onValueChange={(value) => setShareType(value as "internal" | "external")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="internal" id="internal" />
                <Label htmlFor="internal" className="font-normal cursor-pointer">
                  {t("chat.share.internal")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="external" id="external" />
                <Label htmlFor="external" className="font-normal cursor-pointer">
                  {t("chat.share.external")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("chat.share.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("chat.share.emailPlaceholder")}
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              disabled={isSending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShareDialogOpen(false)}
            disabled={isSending}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleShareSubmit} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("chat.share.sharing")}
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                {t("chat.share.title")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Upload Dialog */}
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("chat.upload.title")}</DialogTitle>
          <DialogDescription>
            {t("chat.upload.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {uploadingFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("chat.upload.uploading")}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                 <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary font-medium hover:underline">
                      {t("chat.upload.clickToSelect")}
                    </span>
                    <span className="text-muted-foreground"> {t("chat.upload.orDragDrop")}</span>
                  </Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t("chat.upload.fileTypes")}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setUploadDialogOpen(false)}
            disabled={uploadingFile}
          >
            {uploadingFile ? t("chat.upload.wait") : t("chat.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Shop Dialog */}
    <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {t("chat.shop.title")}
          </DialogTitle>
          <DialogDescription>
            {t("chat.shop.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Sustainability Reporting Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t("chat.shop.sustainability.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("chat.shop.sustainability.standard")}</p>
              </div>
              <span className="text-2xl font-bold text-primary">499,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.sustainability.feature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.sustainability.feature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.sustainability.feature3")}</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              {t("chat.shop.buyModule")}
            </Button>
          </div>

          {/* Transparency Act Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t("chat.shop.transparency.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("chat.shop.transparency.standard")}</p>
              </div>
              <span className="text-2xl font-bold text-primary">399,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.transparency.feature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.transparency.feature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.transparency.feature3")}</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              {t("chat.shop.buyModule")}
            </Button>
          </div>

          {/* HMS Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t("chat.shop.hse.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("chat.shop.hse.standard")}</p>
              </div>
              <span className="text-2xl font-bold text-primary">349,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.hse.feature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.hse.feature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.hse.feature3")}</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              {t("chat.shop.buyModule")}
            </Button>
          </div>

          {/* ISO 27004 Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t("chat.shop.monitoring.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("chat.shop.monitoring.standard")}</p>
              </div>
              <span className="text-2xl font-bold text-primary">449,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.monitoring.feature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.monitoring.feature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.monitoring.feature3")}</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              {t("chat.shop.buyModule")}
            </Button>
          </div>

          {/* Anti-Corruption Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t("chat.shop.antiCorruption.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("chat.shop.antiCorruption.standard")}</p>
              </div>
              <span className="text-2xl font-bold text-primary">399,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.antiCorruption.feature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.antiCorruption.feature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.antiCorruption.feature3")}</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              {t("chat.shop.buyModule")}
            </Button>
          </div>

          {/* Business Continuity Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t("chat.shop.continuity.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("chat.shop.continuity.standard")}</p>
              </div>
              <span className="text-2xl font-bold text-primary">499,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.continuity.feature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.continuity.feature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{t("chat.shop.continuity.feature3")}</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              {t("chat.shop.buyModule")}
            </Button>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            <p>{t("chat.shop.footer")}</p>
          </div>
          <Button variant="outline" onClick={() => setShopDialogOpen(false)}>
            {t("chat.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
