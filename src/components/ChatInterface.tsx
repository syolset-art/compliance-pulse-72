import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Send, Loader2, Undo2, Home, MessageSquarePlus, Share2, Plus, Upload, FileText, AlertTriangle, Shield, Link, ShoppingBag, ThumbsUp, ThumbsDown, Brain, MoreHorizontal, Paperclip, Zap, Search, ListTodo, FileCheck, Database, Check, ChevronRight, Building2, Server, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import laraButterfly from "@/assets/lara-butterfly.png";
import { useOnboardingProgress, OnboardingStep } from "@/hooks/useOnboardingProgress";

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
}

type SuggestionContext = "default" | "protocols" | "systems" | "third-parties" | "tasks" | "deviations" | "compliance";

type SuggestionType = "view" | "action" | "warning";

interface Suggestion {
  text: string;
  type: SuggestionType;
  icon?: React.ComponentType<{ className?: string }>;
}

const suggestionMap: Record<SuggestionContext, Suggestion[]> = {
  default: [
    { text: "Sjekk compliance-status for våre systemer", type: "view", icon: Shield },
    { text: "Vis risikovurderinger som trenger oppfølging", type: "warning", icon: AlertTriangle },
    { text: "Hvilke assets mangler dokumentasjon?", type: "action", icon: Search },
    { text: "Foreslå tiltak for å redusere gap", type: "action", icon: FileCheck }
  ],
  protocols: [
    { text: "Vis i tabellformat", type: "view", icon: FileText },
    { text: "Vis bare titler", type: "view", icon: ListTodo },
    { text: "Filtrer på høy risiko", type: "view", icon: AlertTriangle },
    { text: "Vis protokoller som mangler DPA", type: "warning", icon: AlertTriangle }
  ],
  systems: [
    { text: "Vis i tabellformat", type: "view", icon: FileText },
    { text: "Vis bare navnene", type: "view", icon: ListTodo },
    { text: "Filtrer på høy risiko", type: "view", icon: AlertTriangle },
    { text: "Vis tredjeparter for systemene", type: "view", icon: Database }
  ],
  "third-parties": [
    { text: "Mangler det Transfer Impact Assessment?", type: "warning", icon: AlertTriangle },
    { text: "Generer TIA for tredjeparter", type: "action", icon: FileCheck },
    { text: "Vis i tabellformat", type: "view", icon: FileText },
    { text: "Vis kun de uten DPA", type: "view", icon: Search }
  ],
  tasks: [
    { text: "Vis i liste", type: "view", icon: ListTodo },
    { text: "Grupér etter prioritet", type: "view", icon: FileText },
    { text: "Vis bare titler", type: "view", icon: ListTodo },
    { text: "Filtrer på AI-håndterte", type: "view", icon: Zap }
  ],
  deviations: [
    { text: "Vis åpne avvik", type: "view", icon: AlertTriangle },
    { text: "Filtrer på kritiske avvik", type: "view", icon: AlertTriangle },
    { text: "Vis avvik siste måned", type: "view", icon: Search },
    { text: "Hvilke avvik mangler tiltaksplan?", type: "warning", icon: AlertTriangle }
  ],
  compliance: [
    { text: "Vis compliance-status", type: "view", icon: FileCheck },
    { text: "Hvilke krav mangler dokumentasjon?", type: "warning", icon: AlertTriangle },
    { text: "Vis GDPR-status", type: "view", icon: Shield },
    { text: "Generer compliance-rapport", type: "action", icon: FileText }
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
  percentComplete
}: { 
  onSuggestionClick: (text: string) => void;
  suggestions: Suggestion[];
  onboardingSteps: OnboardingStep[];
  onStepAction: (step: OnboardingStep) => void;
  isOnboardingComplete: boolean;
  completedCount: number;
  totalCount: number;
  percentComplete: number;
}) {
  const getStepIcon = (iconName: string) => {
    const Icon = stepIcons[iconName] || Building2;
    return Icon;
  };

  const nextStep = onboardingSteps.find(s => !s.isCompleted);
  const remainingSteps = totalCount - completedCount;

  return (
    <div className="flex flex-col h-full px-4">
      {/* Header with butterfly and welcome */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <img 
          src={laraButterfly} 
          alt="Lara" 
          className="w-16 h-16 mb-3"
        />
        <h2 className="text-base font-medium text-foreground mb-1 text-center">
          Hei! Jeg er Lara 👋
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Jeg hjelper deg med compliance, personvern og informasjonssikkerhet
        </p>
      </div>

      {/* Onboarding section - show if not complete */}
      {!isOnboardingComplete && (
        <div className="mb-4 bg-accent/50 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">ISO-klargjøring</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {remainingSteps} gjenstår
            </Badge>
          </div>
          
          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {completedCount} av {totalCount} steg fullført
            </p>
          </div>

          {/* Onboarding steps */}
          <div className="space-y-1.5">
            {onboardingSteps.map((step) => {
              const Icon = getStepIcon(step.icon);
              const isNext = nextStep?.id === step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => onStepAction(step)}
                  disabled={step.isCompleted}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left ${
                    step.isCompleted
                      ? 'bg-success/10 opacity-60'
                      : isNext
                        ? 'bg-primary/10 border border-primary/30 hover:bg-primary/20'
                        : 'bg-background/50 hover:bg-background'
                  }`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
                    step.isCompleted
                      ? 'bg-success text-success-foreground'
                      : isNext
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium ${
                      step.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  
                  {!step.isCompleted && (
                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${
                      isNext ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed badge when fully done */}
      {isOnboardingComplete && (
        <div className="mb-4 bg-success/10 rounded-xl p-3 border border-success/20 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
            <Check className="h-4 w-4 text-success-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Oppsett fullført! 🎉</p>
            <p className="text-xs text-muted-foreground">Du er klar til å utforske</p>
          </div>
        </div>
      )}
      
      {/* Suggestions */}
      <div className="flex-1" />
      <div className="w-full max-w-sm mx-auto space-y-2 pb-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Forslag</p>
        {suggestions.slice(0, 3).map((suggestion, i) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left group"
            >
              {Icon && (
                <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <span className="text-xs text-foreground group-hover:text-primary transition-colors">
                {suggestion.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ChatInterfacePropsExtended extends ChatInterfaceProps {
  onOpenSystemDialog?: () => void;
}

export function ChatInterface({ onShowContent, onBackToDashboard, onMessagesChange, onOpenSystemDialog }: ChatInterfacePropsExtended) {
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
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  const [currentThinkingTime, setCurrentThinkingTime] = useState<number>(0);
  const [companyName, setCompanyName] = useState<string>("Eviny AS");
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

  const suggestions = suggestionMap[currentContext];
  const isEmptyState = messages.length === 0;

  // Handle onboarding step action
  const handleOnboardingStepAction = (step: OnboardingStep) => {
    if (step.isCompleted) return;

    switch (step.id) {
      case 'company-info':
        setShowCompanyForm(true);
        break;
      case 'systems':
        if (onOpenSystemDialog) {
          onOpenSystemDialog();
        }
        break;
      case 'work-areas':
        navigate('/work-areas');
        break;
    }
  };

  // Notify parent about messages state
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
      title: feedbackType === "up" ? "Takk for tilbakemeldingen! 👍" : "Vi jobber med å forbedre svaret 👎",
      description: feedbackType === "up" 
        ? "Flott at svaret var nyttig!" 
        : "Takk for tilbakemeldingen, vi bruker den til å forbedre Lara.",
    });
  };

  const handleUndoLastMessage = () => {
    if (messages.length >= 2) {
      setMessages(prev => prev.slice(0, -2));
      setCurrentContext("default");
      toast({
        title: "Angret",
        description: "Siste melding er fjernet",
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
      title: "Ny samtale",
      description: "Samtalen er tilbakestilt",
    });
  };

  const handleShareConversation = () => {
    setShareDialogOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!shareEmail.trim()) {
      toast({
        title: "Feil",
        description: "Vennligst oppgi en e-postadresse",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast({
        title: "Feil",
        description: "Vennligst oppgi en gyldig e-postadresse",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Samtale delt",
        description: `Samtalen er delt med ${shareEmail}`,
      });

      setShareDialogOpen(false);
      setShareEmail("");
      setShareType("internal");
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke dele samtalen. Prøv igjen senere.",
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Feil",
          description: "Du må være logget inn for å laste opp filer",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      const { error: dbError } = await supabase
        .from('uploaded_documents')
        .insert({
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          analysis_status: 'pending'
        });

      if (dbError) throw dbError;

      setUploadProgress(100);

      toast({
        title: "Dokument lastet opp",
        description: `${file.name} er lastet opp og klar for analyse`,
      });

      setUploadDialogOpen(false);
      
      setTimeout(() => {
        handleSend(`Analyser dokumentet ${file.name} for compliance og personverninnhold`);
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Opplasting feilet",
        description: error instanceof Error ? error.message : "Kunne ikke laste opp filen",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
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
    if (lowerText.includes("behandlingsprotokoll") || lowerText.includes("protokoll")) {
      setCurrentContext("protocols");
    } else if (lowerText.includes("system") || lowerText.includes("it-system")) {
      setCurrentContext("systems");
    } else if (lowerText.includes("tredjeparti") || lowerText.includes("leverandør")) {
      setCurrentContext("third-parties");
    } else if (lowerText.includes("oppgav")) {
      setCurrentContext("tasks");
    } else if (lowerText.includes("avvik")) {
      setCurrentContext("deviations");
    } else if (lowerText.includes("compliance") || lowerText.includes("etterlevelse")) {
      setCurrentContext("compliance");
    }

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          const error = await response.json();
          toast({
            title: "Feil",
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
              if (tc.function?.name === "navigate_to" || tc.function?.name === "show_content" || tc.function?.name === "generate_tia" || tc.function?.name === "suggest_options") {
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
            
            updateAssistantMessage(assistantContent || "Viser innhold til høyre...");
            
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
              ? `${assistantContent}\n\n✨ Jeg tar deg til den relevante siden: ${args.reason}`
              : `${assistantContent}\n\n✨ Navigerer til riktig side...`;
            
            updateAssistantMessage(navMessage);
            
            setTimeout(() => {
              navigate(args.path);
              toast({
                title: "Navigert",
                description: args.reason || "Tatt deg til riktig side",
              });
            }, 500);
          } else if (toolCall.name === "generate_tia") {
            const tiaMessage = args.status_message 
              ? `${assistantContent}\n\n⚠️ ${args.status_message}`
              : `${assistantContent}\n\n⚠️ Genererer TIA...`;
            
            updateAssistantMessage(tiaMessage);
            
            toast({
              title: "Transfer Impact Assessment",
              description: args.status_message || "Genererer TIA i bakgrunnen. Du kan fortsette å bruke systemet.",
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
        title: "Feil",
        description: "Kunne ikke få svar fra AI. Prøv igjen.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
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
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">
                        <Brain className="h-3 w-3" />
                        <span>Tenkte {message.thinkingTime}s</span>
                      </div>
                    )}
                    
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    
                    {/* Timestamp and feedback for assistant messages */}
                    {message.role === "assistant" && message.isComplete && (
                      <div className="flex items-center gap-2 mt-1.5 ml-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-6 w-6 p-0 ${message.feedback === "up" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => handleFeedback(i, "up")}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-6 w-6 p-0 ${message.feedback === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => handleFeedback(i, "down")}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* User message timestamp */}
                    {message.role === "user" && (
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-muted-foreground">
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
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                          onClick={() => handleSend(option.prompt)}
                        >
                          {option.text}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <img src={laraButterfly} alt="Lara" className="w-6 h-6 flex-shrink-0" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span className="text-xs">
                    Tenker{currentThinkingTime > 0 ? ` (${currentThinkingTime}s)` : "..."}
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
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestions?.slice(0, 3).map((suggestion, i) => {
              const Icon = suggestion.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion.text)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-border bg-background hover:bg-accent hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground"
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {suggestion.text}
                </button>
              );
            })}
          </div>
        )}

        {/* Notion-style input container */}
        <div className="rounded-xl border border-border bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          {/* Context chip */}
          <div className="px-4 pt-3 pb-2">
            <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
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
            {/* Attachment button */}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setUploadDialogOpen(true)}
              disabled={isLoading}
              className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5"
              title="Last opp dokument"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

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
              placeholder="Spør, søk eller be om hjelp..."
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
              <Zap className="w-3 h-3" />
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
                  Gå til dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNewConversation}>
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Ny samtale
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShopDialogOpen(true)}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Tilleggsmoduler
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleUndoLastMessage}
                  disabled={messages.length < 2}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Angre siste melding
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleShareConversation}
                  disabled={messages.length === 0}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Del samtale
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    handleSend("Hvilken type gap-analyse ønsker du? Presenter alternativer jeg kan velge.");
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gap Analyse
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleSend("Utfør risikovurdering for våre systemer og behandlinger");
                  }}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Risikovurdering
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleSend("Lag en detaljert ISO 27001 compliance-rapport. Inkluder executive summary, gap-analyse per kontrollområde med status-indikatorer, risikovurdering og prioritert handlingsplan.");
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Compliance-rapport (ISO 27001)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toast({
                      title: "Systemintegrasjoner",
                      description: "Koble til eksterne systemer",
                    });
                  }}
                >
                  <Link className="mr-2 h-4 w-4" />
                  Integrasjoner
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
          <DialogTitle>Del samtale</DialogTitle>
          <DialogDescription>
            Del denne samtalen med andre brukere eller eksterne personer via e-post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Delingstype</Label>
            <RadioGroup value={shareType} onValueChange={(value) => setShareType(value as "internal" | "external")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="internal" id="internal" />
                <Label htmlFor="internal" className="font-normal cursor-pointer">
                  Intern bruker (innad i organisasjonen)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="external" id="external" />
                <Label htmlFor="external" className="font-normal cursor-pointer">
                  Ekstern person
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-postadresse</Label>
            <Input
              id="email"
              type="email"
              placeholder="navn@eksempel.no"
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
            Avbryt
          </Button>
          <Button onClick={handleShareSubmit} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deler...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Del samtale
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
          <DialogTitle>Last opp dokument</DialogTitle>
          <DialogDescription>
            Last opp dokumenter for automatisk compliance-analyse
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
                  <span>Laster opp...</span>
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
                    Klikk for å velge fil
                  </span>
                  <span className="text-muted-foreground"> eller dra og slipp</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, Word, Excel eller tekstfiler
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
            {uploadingFile ? "Vent..." : "Avbryt"}
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
            Tilleggsmoduler for compliance og rapportering
          </DialogTitle>
          <DialogDescription>
            Utvid systemet med AI-drevne rapporteringsmoduler i tråd med ISO 27001/27002/27004
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Sustainability Reporting Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">Bærekraftsrapportering</h3>
                <p className="text-sm text-muted-foreground">ISO 14001 / CSRD</p>
              </div>
              <span className="text-2xl font-bold text-primary">499,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>AI-generert miljø- og klimarapportering</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Automatisk sporingsdata for CO2, energi, avfall</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>CSRD og GRI compliance</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              Kjøp modul
            </Button>
          </div>

          {/* Transparency Act Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">Åpenhetsloven</h3>
                <p className="text-sm text-muted-foreground">Menneskerettigheter</p>
              </div>
              <span className="text-2xl font-bold text-primary">399,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>AI-analyse av leverandørkjeder</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Aktsomhetsvurderinger</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Åpenhetsloven §4 og §5 rapporter</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              Kjøp modul
            </Button>
          </div>

          {/* HMS Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">HMS-rapportering</h3>
                <p className="text-sm text-muted-foreground">ISO 45001</p>
              </div>
              <span className="text-2xl font-bold text-primary">349,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Helse, miljø og sikkerhetsrapporter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Risikovurdering av arbeidsplasser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Avviksrapportering og tiltaksplaner</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              Kjøp modul
            </Button>
          </div>

          {/* ISO 27004 Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">Måling og Monitoring</h3>
                <p className="text-sm text-muted-foreground">ISO 27004</p>
              </div>
              <span className="text-2xl font-bold text-primary">449,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>KPI-dashboards for sikkerhetskontroller</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Måling av effektivitet av tiltak</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Trendanalyse og forbedringsindikatorer</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              Kjøp modul
            </Button>
          </div>

          {/* Anti-Corruption Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">Anti-korrupsjon</h3>
                <p className="text-sm text-muted-foreground">ISO 37001</p>
              </div>
              <span className="text-2xl font-bold text-primary">399,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Korrupsjonsrisikovurdering</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Due diligence på forretningspartnere</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Compliance-kontroller og varslingssystem</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              Kjøp modul
            </Button>
          </div>

          {/* Business Continuity Module */}
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">Kontinuitetsplanlegging</h3>
                <p className="text-sm text-muted-foreground">ISO 22301</p>
              </div>
              <span className="text-2xl font-bold text-primary">499,-</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Forretningskontinuitetsplaner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>BIA - Business Impact Analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Gjenopprettingsstrategier og øvelser</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              Kjøp modul
            </Button>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            <p>Alle moduler inkluderer AI-agenter som automatiserer rapportering og overholdelse.</p>
          </div>
          <Button variant="outline" onClick={() => setShopDialogOpen(false)}>
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
