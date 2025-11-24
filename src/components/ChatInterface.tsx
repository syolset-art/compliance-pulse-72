import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Send, Sparkles, Loader2, Menu, Undo2, Home, MessageSquarePlus, Share2, Plus, X, Upload, FileText, AlertTriangle, Shield, Link, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import laraButterfly from "@/assets/lara-butterfly.png";

interface Message {
  role: "user" | "assistant";
  content: string;
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
  onToggleMode: () => void;
  onShowContent?: (contentType: string, filter?: string, options?: ContentViewOptions) => void;
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

export function ChatInterface({ onToggleMode, onShowContent, onBackToDashboard }: ChatInterfaceProps) {
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
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const suggestions = suggestionMap[currentContext];

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

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

      const updateAssistantMessage = (content: string) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => 
              i === prev.length - 1 ? { ...m, content } : m
            );
          }
          return [...prev, { role: "assistant", content }];
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
              if (tc.function?.name === "navigate_to" || tc.function?.name === "show_content" || tc.function?.name === "generate_tia") {
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
              assistantContent += delta.content;
              updateAssistantMessage(assistantContent);
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
            
            const contentMessage = args.explanation 
              ? `${assistantContent}\n\n✨ ${args.explanation}`
              : `${assistantContent}\n\n✨ Viser innhold...`;
            
            updateAssistantMessage(contentMessage);
            
            if (onShowContent) {
              const options: ContentViewOptions = {
                viewMode: args.view_mode,
                sortBy: args.sort_by,
                filterCriteria: args.filter_criteria
              };
              onShowContent(args.content_type, args.filter, options);
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
          }
        } catch (e) {
          console.error("Failed to parse tool arguments:", e);
        }
      }

      setIsLoading(false);
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
    <div className="flex h-full w-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={laraButterfly} alt="Lara" className="w-8 h-8" />
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-1">
              Lara
              <Sparkles className="w-3 h-3 text-primary" />
            </h3>
            <p className="text-xs text-muted-foreground">AI-assistent</p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={onToggleMode}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
          >
            <Menu className="h-4 w-4" />
            Meny
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-background text-foreground shadow-sm font-medium text-sm transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <img src={laraButterfly} alt="Lara" className="w-6 h-6 mt-1" />
              )}
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <img src={laraButterfly} alt="Lara" className="w-6 h-6 mt-1" />
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
          {suggestions.map((suggestion, i) => {
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
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setPlusMenuOpen(true)}
            disabled={isLoading}
            className="h-10 w-10"
          >
            <Plus className="h-5 w-5" />
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

    {/* Plus Menu Sheet */}
    <Sheet open={plusMenuOpen} onOpenChange={setPlusMenuOpen}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader className="relative">
          <SheetTitle>Verktøy og integrasjoner</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-6 w-6"
            onClick={() => setPlusMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => {
              setPlusMenuOpen(false);
              toast({
                title: "Visual Edits",
                description: "Klikk på elementer for å redigere direkte",
              });
              // TODO: Implement visual editing mode
            }}
          >
            <PenTool className="h-6 w-6" />
            <span className="text-sm font-medium">Visual Edits</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => {
              setPlusMenuOpen(false);
              toast({
                title: "Last opp dokumenter",
                description: "Velg dokumenter for analyse",
              });
              // TODO: Implement document upload
            }}
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm font-medium">Last opp dokumenter</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => {
              setPlusMenuOpen(false);
              handleSend("Utfør Gap Analyse for personvern og sikkerhet");
            }}
          >
            <FileText className="h-6 w-6" />
            <span className="text-sm font-medium">Gap Analyse</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => {
              setPlusMenuOpen(false);
              handleSend("Utfør risikovurdering for våre systemer og behandlinger");
            }}
          >
            <AlertTriangle className="h-6 w-6" />
            <span className="text-sm font-medium">Risikovurdering</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => {
              setPlusMenuOpen(false);
              toast({
                title: "Systemintegrasjoner",
                description: "Koble til eksterne systemer",
              });
              // TODO: Navigate to integrations page
            }}
          >
            <Link className="h-6 w-6" />
            <span className="text-sm font-medium">Integrasjoner</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => {
              setPlusMenuOpen(false);
              handleSend("Vis compliance-status og lag en rapport");
            }}
          >
            <Shield className="h-6 w-6" />
            <span className="text-sm font-medium">Compliance-rapport</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => {
              setPlusMenuOpen(false);
              handleSend("Analyser GDPR-etterlevelse og gi anbefalinger");
            }}
          >
            <FileText className="h-6 w-6" />
            <span className="text-sm font-medium">GDPR-analyse</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
