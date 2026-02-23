import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { faqAnswers, contextPrompts } from "@/lib/supportFaqData";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: "mynder" | "ai" | "article";
}

interface SupportChatProps {
  activeContext: string | null;
  onSelectContext: (id: string) => void;
  showContextChips?: boolean;
}

const contextChips = [
  { id: "mynder-help", labelKey: "resources.chat.contextMynderHelp", emoji: "🧭" },
  { id: "lara", labelKey: "resources.chat.contextLara", emoji: "🦋" },
  { id: "iso", labelKey: "resources.chat.contextISO", emoji: "🏅" },
  { id: "faq", labelKey: "resources.chat.contextFAQ", emoji: "💬" },
  { id: "regulatory", labelKey: "resources.chat.contextTraining", emoji: "📚" },
];

const suggestedQuestions = [
  "Hvordan legger jeg til en leverandør?",
  "Hva er forskjellen på GDPR og NIS2?",
  "Hjelp meg med risikovurdering",
  "Hvordan kommer jeg i gang med ISO 27001?",
];

const phaseSuggestions: Record<string, string[]> = {
  foundation: ["Hva bør være i scopet mitt?", "Hvordan gjør jeg en gap-analyse?", "Hvem bør ha hvilke roller?", "Hva er kontekstanalyse?"],
  implementation: ["Hvordan skriver jeg en policy?", "Hjelp med risikovurdering", "Hva er risikobehandling?", "Hvordan setter jeg mål?"],
  operation: ["Hvordan håndterer jeg avvik?", "Tips til awareness-trening", "Hvordan overvåker jeg kontroller?", "Hva bør dokumenteres?"],
  audit: ["Hva innebærer en intern revisjon?", "Hvordan forbereder jeg ledelsesgjennomgang?", "Hva er korrigerende tiltak?"],
  certification: ["Hva skjer i Stage 1?", "Hvor lang tid tar sertifisering?", "Hva koster ekstern revisjon?"],
};

export const SupportChat = ({ activeContext, onSelectContext, showContextChips = true }: SupportChatProps) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!activeContext) return;

    // Phase contexts
    const phaseIds = ['foundation', 'implementation', 'operation', 'audit', 'certification'];
    if (phaseIds.includes(activeContext)) {
      const phaseNames: Record<string, string> = {
        foundation: 'Fundament', implementation: 'Implementering', operation: 'Drift',
        audit: 'Intern Audit', certification: 'Sertifisering',
      };
      setMessages([{
        role: "assistant",
        content: `**${phaseNames[activeContext]}**\n\nJeg kan hjelpe deg med denne fasen av compliance-prosessen. Still meg et spørsmål, eller velg et av forslagene under.`,
        source: "ai",
      }]);
      return;
    }

    if (activeContext !== "regulatory") {
      const faqs = faqAnswers[activeContext];
      if (faqs && faqs.length > 0) {
        const contextName = contextPrompts[activeContext]?.split(".")[0] || activeContext;
        setMessages([{
          role: "assistant",
          content: `**${contextName}**\n\nHer er de vanligste spørsmålene:\n\n${faqs.map((f, i) => `**${i + 1}. ${f.q}**\n${f.a}`).join("\n\n")}`,
          source: "mynder",
        }]);
      }
    } else {
      setMessages([{
        role: "assistant",
        content: t("resources.chat.welcome"),
        source: "ai",
      }]);
    }
  }, [activeContext, t]);

  const tryLocalAnswer = (query: string): string | null => {
    const q = query.toLowerCase();
    for (const category of Object.values(faqAnswers)) {
      for (const faq of category) {
        const keywords = faq.q.toLowerCase().split(/\s+/);
        const matchCount = keywords.filter(kw => kw.length > 3 && q.includes(kw)).length;
        if (matchCount >= 2) return faq.a;
      }
    }
    return null;
  };

  const streamAIResponse = async (userMessages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    const systemContext = activeContext ? contextPrompts[activeContext] || "" : "";
    const messagesForAI = userMessages.map(m => ({ role: m.role, content: m.content }));
    if (systemContext) {
      messagesForAI.unshift({ role: "user" as const, content: `[Kontekst: ${systemContext}]` });
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: messagesForAI, context: { currentRoute: "/resources", pageName: "Support" } }),
    });

    if (resp.status === 429) return t("resources.chat.aiLimitReached");
    if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.source === "ai") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullResponse } : m);
              }
              return [...prev, { role: "assistant", content: fullResponse, source: "ai" as const }];
            });
          }
        } catch { /* partial JSON */ }
      }
    }
    return fullResponse;
  };

  const handleSend = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;
    const userMsg: Message = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const localAnswer = tryLocalAnswer(trimmed);
      if (localAnswer && activeContext !== "regulatory") {
        setMessages(prev => [...prev, { role: "assistant", content: localAnswer, source: "mynder" }]);
      } else {
        await streamAIResponse([...messages, userMsg]);
      }
    } catch (e) {
      console.error("Support chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Beklager, noe gikk galt. Prøv igjen om litt.", source: "mynder" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sourceBadge = (source?: string) => {
    if (!source) return null;
    const config: Record<string, { label: string; className: string }> = {
      mynder: { label: t("resources.chat.sourceMynder"), className: "bg-primary/10 text-primary border-primary/20" },
      ai: { label: t("resources.chat.sourceAI"), className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
      article: { label: t("resources.chat.sourceArticle"), className: "bg-muted text-muted-foreground border-border" },
    };
    const c = config[source];
    if (!c) return null;
    return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${c.className}`}>{c.label}</Badge>;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Context chips — only when explicitly shown */}
      {showContextChips && (
        <div className="flex flex-wrap gap-1.5 p-3 border-b border-border/50">
          {contextChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onSelectContext(chip.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeContext === chip.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className="text-[11px]">{chip.emoji}</span>
              {t(chip.labelKey)}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center py-12">
            <div className="space-y-5 max-w-sm">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-base mb-1">Still et spørsmål</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Velg et tema over, eller prøv et av forslagene under.
                </p>
              </div>
              {/* Suggested questions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {(phaseSuggestions[activeContext || ''] || suggestedQuestions).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="px-3 py-2 rounded-xl text-xs font-medium bg-muted/60 text-foreground/80 border border-border/50 hover:bg-accent hover:border-primary/20 hover:text-foreground transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-foreground border border-border/40"
              }`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                {msg.role === "assistant" && (
                  <div className="mt-1.5 flex justify-end">
                    {sourceBadge(msg.source)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border/40 rounded-2xl px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border/50">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("resources.chat.placeholder")}
            className="flex-1 bg-muted/30 border-border/50"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};
