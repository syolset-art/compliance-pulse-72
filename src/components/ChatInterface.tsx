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
import { Send, Sparkles, Loader2, Undo2, Home, MessageSquarePlus, Share2, Plus, X, Upload, FileText, AlertTriangle, Shield, Link, Lightbulb, ShoppingBag, ThumbsUp, ThumbsDown, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import laraButterfly from "@/assets/lara-butterfly.png";

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
}

type SuggestionContext = "default" | "protocols" | "systems" | "third-parties" | "tasks" | "deviations" | "compliance";

type SuggestionType = "view" | "action" | "warning";

interface Suggestion {
  text: string;
  type: SuggestionType;
}

const suggestionMap: Record<SuggestionContext, Suggestion[]> = {
  default: [
    { text: "Vis behandlingsprotokoller", type: "view" },
    { text: "Hvilke systemer bruker vi?", type: "view" },
    { text: "Tredjeparter for Microsoft", type: "view" },
    { text: "Vis oppgavelisten", type: "view" }
  ],
  protocols: [
    { text: "Vis i tabellformat", type: "view" },
    { text: "Vis bare titler", type: "view" },
    { text: "Filtrer på høy risiko", type: "view" },
    { text: "Vis protokoller som mangler DPA", type: "warning" }
  ],
  systems: [
    { text: "Vis i tabellformat", type: "view" },
    { text: "Vis bare navnene", type: "view" },
    { text: "Filtrer på høy risiko", type: "view" },
    { text: "Vis tredjeparter for systemene", type: "view" }
  ],
  "third-parties": [
    { text: "Mangler det Transfer Impact Assessment?", type: "warning" },
    { text: "Generer TIA for tredjeparter", type: "action" },
    { text: "Vis i tabellformat", type: "view" },
    { text: "Vis kun de uten DPA", type: "view" },
    { text: "Sorter etter risikonivå", type: "view" }
  ],
  tasks: [
    { text: "Vis i liste", type: "view" },
    { text: "Grupér etter prioritet", type: "view" },
    { text: "Vis bare titler", type: "view" },
    { text: "Filtrer på AI-håndterte", type: "view" },
    { text: "Vis fullførte oppgaver", type: "view" }
  ],
  deviations: [
    { text: "Vis åpne avvik", type: "view" },
    { text: "Filtrer på kritiske avvik", type: "view" },
    { text: "Vis avvik siste måned", type: "view" },
    { text: "Hvilke avvik mangler tiltaksplan?", type: "warning" }
  ],
  compliance: [
    { text: "Vis compliance-status", type: "view" },
    { text: "Hvilke krav mangler dokumentasjon?", type: "warning" },
    { text: "Vis GDPR-status", type: "view" },
    { text: "Generer compliance-rapport", type: "action" }
  ]
};

export function ChatInterface({ onShowContent, onBackToDashboard }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
      {
        role: "assistant",
        content: "Hei! Jeg er Lara, din AI-assistent. Still meg et spørsmål eller si hva du leter etter, så hjelper jeg deg å finne det."
      }
  ]);
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const suggestions = suggestionMap[currentContext];

  const handleFeedback = (messageIndex: number, feedbackType: "up" | "down") => {
    setMessages(prev => prev.map((msg, idx) => {
      if (idx === messageIndex) {
        // Toggle feedback: if clicking the same type, remove it; otherwise set new type
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
    if (messages.length > 1) {
      // Remove last two messages (user + assistant)
      setMessages(prev => prev.slice(0, -2));
      setCurrentContext("default");
      toast({
        title: "Angret",
        description: "Siste melding er fjernet",
      });
    }
  };

  const handleNewConversation = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hei! Jeg er Lara, din AI-assistent. Still meg et spørsmål eller si hva du leter etter, så hjelper jeg deg å finne det."
      }
    ]);
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

    // Basic email validation
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
      const conversationText = messages
        .map(m => `${m.role === "user" ? "Du" : "Lara"}: ${m.content}`)
        .join("\n\n");

      // TODO: Implement actual email sending via edge function
      // For now, just show success message
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Feil",
          description: "Du må være logget inn for å laste opp filer",
          variant: "destructive",
        });
        return;
      }

      // Create file path with user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Save metadata to database
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
      
      // Trigger analysis via chat
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

  // Timer for thinking indicator
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

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setThinkingStartTime(Date.now());
    setCurrentThinkingTime(0);

    // Detect context from user message
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
                thinkingSummary: thinking?.summary 
              } : m
            );
          }
          return [...prev, { 
            role: "assistant", 
            content, 
            isComplete,
            thinkingTime: thinking?.time,
            thinkingSummary: thinking?.summary
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

            // Handle tool calls
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

            // Handle regular content
            if (delta?.content) {
              // First content marks end of thinking
              if (!hasReceivedFirstContent && thinkingStartTime) {
                const thinkingTime = Math.floor((Date.now() - thinkingStartTime) / 1000);
                thinkingSummary = delta.content;
                hasReceivedFirstContent = true;
                
                // Show thinking summary
                updateAssistantMessage("", false, { time: thinkingTime, summary: thinkingSummary });
              } else {
                assistantContent += delta.content;
                
                // Keep thinking info when updating content
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

      // Process tool call if any
      if (toolCall && toolCall.arguments) {
        try {
          const args = JSON.parse(toolCall.arguments);
          
          if (toolCall.name === "show_content") {
            // Update context based on content type
            setCurrentContext(args.content_type as SuggestionContext);
            
            // Chat only shows the AI's brief status message - NOT the explanation
            // The explanation (full report) is only shown in the right panel (ContentViewer)
            updateAssistantMessage(assistantContent || "Viser innhold til høyre...");
            
            if (onShowContent) {
              const options: ContentViewOptions = {
                viewMode: args.view_mode,
                sortBy: args.sort_by,
                filterCriteria: args.filter_criteria
              };
              // Pass explanation to ContentViewer to display the full report
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
            // Add options to the assistant message
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

      // Mark the message as complete when streaming ends with thinking info
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

  return (
    <>
    <div className="flex h-full w-full flex-col bg-card overflow-hidden">
      {/* Messages */}
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
                  <img src={laraButterfly} alt="Lara" className="w-6 h-6 mt-1" />
                )}
                <div className="flex-1 max-w-[80%]">
                  {/* Thinking indicator */}
                  {message.role === "assistant" && message.thinkingSummary && (
                    <div className="mb-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span className="text-xs font-medium text-primary">
                          Tenker... {message.thinkingTime ? `(${message.thinkingTime}s)` : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        {message.thinkingSummary}
                      </p>
                    </div>
                  )}
                  
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Feedback buttons for assistant messages */}
                  {message.role === "assistant" && message.isComplete && (
                    <div className="flex items-center gap-2 mt-2 ml-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 px-2 ${message.feedback === "up" ? "text-success" : "text-muted-foreground"}`}
                        onClick={() => handleFeedback(i, "up")}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 px-2 ${message.feedback === "down" ? "text-destructive" : "text-muted-foreground"}`}
                        onClick={() => handleFeedback(i, "down")}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                      {message.isComplete && (
                        <span className="text-xs text-muted-foreground ml-2">✓ Ferdig</span>
                      )}
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
            <div className="flex gap-3 justify-start">
              <img src={laraButterfly} alt="Lara" className="w-6 h-6 mt-1" />
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Tenker{currentThinkingTime > 0 ? ` (${currentThinkingTime}s)` : "..."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToDashboard}
            className="h-8 w-8"
            disabled={isLoading}
            title="Gå til dashboard"
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShopDialogOpen(true)}
            className="h-8 w-8"
            disabled={isLoading}
            title="Kjøp tilleggsmoduler"
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewConversation}
            className="h-8 w-8"
            disabled={isLoading}
            title="Ny samtale"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUndoLastMessage}
            className="h-8 w-8"
            disabled={isLoading || messages.length <= 1}
            title="Angre siste melding"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShareConversation}
            className="h-8 w-8"
            disabled={isLoading || messages.length <= 1}
            title="Del samtale"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
        {/* Suggestions - always visible */}
        <div className="flex flex-wrap gap-2">
          {suggestions?.map((suggestion, i) => {
            const variant = suggestion.type === "warning" 
              ? "warning" 
              : suggestion.type === "action" 
              ? "action" 
              : "secondary";
            
            return (
              <Badge
                key={i}
                variant={variant}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                onClick={() => handleSend(suggestion.text)}
              >
                {suggestion.text}
              </Badge>
            );
          })}
        </div>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={isLoading}
                className="h-10 w-10"
                title="Åpne verktøymeny"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  setUploadDialogOpen(true);
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Last opp dokumenter
              </DropdownMenuItem>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Systemintegrasjoner",
                    description: "Koble til eksterne systemer",
                  });
                  // TODO: Navigate to integrations page
                }}
              >
                <Link className="mr-2 h-4 w-4" />
                Integrasjoner
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleSend("Lag en detaljert ISO 27001 compliance-rapport for Eviny. Inkluder executive summary, gap-analyse per kontrollområde med status-indikatorer, risikovurdering og prioritert handlingsplan. Bruk tabeller og strukturert format.");
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Compliance-rapport (ISO 27001)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleSend("Analyser GDPR-etterlevelse og gi anbefalinger");
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                GDPR-analyse
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              handleSend("Gi meg AI-forslag basert på vår nåværende compliance-status og identifiser forbedringområder");
            }}
            disabled={isLoading}
            className="h-10 w-10"
            title="AI-forslag for forbedringer"
          >
            <Lightbulb className="h-5 w-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Still et spørsmål..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
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
