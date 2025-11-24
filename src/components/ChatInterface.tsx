import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Loader2, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import laraButterfly from "@/assets/lara-butterfly.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onToggleMode: () => void;
  onShowContent?: (contentType: string, filter?: string) => void;
}

type SuggestionContext = "default" | "protocols" | "systems" | "third-parties" | "tasks" | "deviations" | "compliance";

const suggestionMap: Record<SuggestionContext, string[]> = {
  default: [
    "Vis behandlingsprotokoller",
    "Hvilke systemer bruker vi?",
    "Tredjeparter for Microsoft",
    "Vis oppgavelisten"
  ],
  protocols: [
    "Filtrer på høy risiko",
    "Vis nyeste protokoller",
    "Hvilke protokoller mangler DPA?",
    "Vis alle protokoller for Eviny"
  ],
  systems: [
    "Vis systemer med høy risiko",
    "Hvilke systemer trenger oppdatering?",
    "Vis tredjeparter for dette systemet",
    "Filtrer på skybaserte systemer"
  ],
  "third-parties": [
    "Vis DPA for denne leverandøren",
    "Sjekk risikoevaluering",
    "Hvilke andre systemer bruker denne?",
    "Vis alle Microsoft-tjenester"
  ],
  tasks: [
    "Vis bare høy prioritet",
    "Filtrer på AI-håndterte oppgaver",
    "Vis fullførte oppgaver",
    "Hvilke oppgaver er forsinket?"
  ],
  deviations: [
    "Vis åpne avvik",
    "Filtrer på kritiske avvik",
    "Vis avvik siste måned",
    "Hvilke avvik mangler tiltaksplan?"
  ],
  compliance: [
    "Vis compliance-status",
    "Hvilke krav mangler dokumentasjon?",
    "Vis GDPR-status",
    "Generer compliance-rapport"
  ]
};

export function ChatInterface({ onToggleMode, onShowContent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hei! 👋 Jeg er Lara, din AI-assistent. Still meg et spørsmål eller si hva du leter etter, så hjelper jeg deg å finne det."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState<SuggestionContext>("default");
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const suggestions = suggestionMap[currentContext];

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
              if (tc.function?.name === "navigate_to" || tc.function?.name === "show_content") {
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
              onShowContent(args.content_type, args.filter);
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
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
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
      <div className="p-4 border-t border-border space-y-3">
        {/* Suggestions - always visible */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
              onClick={() => handleSend(suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
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
  );
}
