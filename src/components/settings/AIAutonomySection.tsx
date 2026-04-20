import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Sparkles, Hand, UserCheck, Bot, ShieldCheck, AlertTriangle,
  CheckCircle2, FileSearch, Search, Gauge, Lightbulb, Mail,
  ListChecks, Globe, History, Undo2, PowerOff, Users, Info,
} from "lucide-react";

type Level = "manual" | "assisted" | "automatic";

interface TaskDef {
  id: string;
  icon: typeof FileSearch;
  nameNb: string;
  nameEn: string;
  descNb: string;
  descEn: string;
  defaultLevel: Level;
  recommendedMax: Level;
}

const TASKS: TaskDef[] = [
  { id: "documentAnalysis", icon: FileSearch, nameNb: "Dokumentanalyse", nameEn: "Document analysis", descNb: "Klassifisering, utløpsdato-uthenting", descEn: "Classification, expiry extraction", defaultLevel: "automatic", recommendedMax: "automatic" },
  { id: "gapDetection", icon: Search, nameNb: "Funn & gap-deteksjon", nameEn: "Findings & gap detection", descNb: "Identifisere mangler i DPA, SLA", descEn: "Identify gaps in DPA, SLA", defaultLevel: "assisted", recommendedMax: "assisted" },
  { id: "riskScoring", icon: Gauge, nameNb: "Risikoscoring", nameEn: "Risk scoring", descNb: "Beregne leverandørrisiko", descEn: "Calculate vendor risk", defaultLevel: "assisted", recommendedMax: "automatic" },
  { id: "activitySuggestions", icon: Lightbulb, nameNb: "Aktivitetsforslag", nameEn: "Activity suggestions", descNb: "Forslag i Veiledning fra Mynder", descEn: "Suggestions in Guidance from Mynder", defaultLevel: "assisted", recommendedMax: "assisted" },
  { id: "externalCommunication", icon: Mail, nameNb: "Kommunikasjon utad", nameEn: "External communication", descNb: "Sende e-post til leverandør", descEn: "Send email to vendor", defaultLevel: "manual", recommendedMax: "assisted" },
  { id: "controlStatusChange", icon: ListChecks, nameNb: "Endring av kontrollstatus", nameEn: "Change control status", descNb: "Markere kontroll som lukket", descEn: "Mark control as closed", defaultLevel: "manual", recommendedMax: "assisted" },
  { id: "publishing", icon: Globe, nameNb: "Publisering", nameEn: "Publishing", descNb: "Publisere Trust Profile", descEn: "Publish Trust Profile", defaultLevel: "manual", recommendedMax: "manual" },
];

const LEVEL_META: Record<Level, { nb: string; en: string; icon: typeof Hand; tone: string; activeBorder: string; activeBg: string; dot: string }> = {
  manual: { nb: "Manuell", en: "Manual", icon: Hand, tone: "text-success", activeBorder: "border-success/60", activeBg: "bg-success/5", dot: "bg-success" },
  assisted: { nb: "Assistert", en: "Assisted", icon: UserCheck, tone: "text-warning", activeBorder: "border-warning/60", activeBg: "bg-warning/5", dot: "bg-warning" },
  automatic: { nb: "Automatisk", en: "Automatic", icon: Bot, tone: "text-primary", activeBorder: "border-primary/60", activeBg: "bg-primary/5", dot: "bg-primary" },
};

const LEVEL_RANK: Record<Level, number> = { manual: 0, assisted: 1, automatic: 2 };

const STORAGE_KEY = "mynder-ai-autonomy-config";

interface Config {
  globalLevel: Level;
  overrides: Record<string, Level>;
  killSwitch: boolean;
}

const defaultConfig: Config = {
  globalLevel: "assisted",
  overrides: {},
  killSwitch: false,
};

export function AIAutonomySection({ isNb }: { isNb: boolean }) {
  const [config, setConfig] = useState<Config>(defaultConfig);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setConfig({ ...defaultConfig, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  const persist = (next: Config) => {
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    toast.success(isNb ? "Autonominivå oppdatert" : "Autonomy level updated");
  };

  const setGlobal = (level: Level) => persist({ ...config, globalLevel: level });
  const setOverride = (taskId: string, level: Level) => persist({ ...config, overrides: { ...config.overrides, [taskId]: level } });
  const toggleKill = (on: boolean) => persist({ ...config, killSwitch: on });

  const globalMeta = LEVEL_META[config.globalLevel];

  // Consequence panel content
  const consequences: Record<Level, { benefits: string[]; risks: string[]; controls: string[] }> = {
    manual: {
      benefits: isNb
        ? ["Maksimal kontroll over alle KI-handlinger", "Full innsikt i hvert forslag før utførelse"]
        : ["Maximum control over all AI actions", "Full insight into every suggestion before execution"],
      risks: isNb
        ? ["Lavere hastighet — alt krever manuell utførelse", "Risiko for å miste oversikt ved store volum"]
        : ["Lower speed — everything requires manual execution", "Risk of losing oversight at scale"],
      controls: isNb
        ? ["Alle KI-handlinger logges automatisk", "Du kan eskalere til kollega når som helst"]
        : ["All AI actions are logged automatically", "You can escalate to a colleague at any time"],
    },
    assisted: {
      benefits: isNb
        ? ["KI lager utkast — du sparer 60–80% tid", "Bedre kvalitet gjennom forslag basert på beste praksis"]
        : ["AI drafts — you save 60–80% time", "Better quality through best-practice suggestions"],
      risks: isNb
        ? ["Krav om aktiv godkjenning før handling utføres", "Bias i utkast kan smitte over hvis ikke vurdert"]
        : ["Requires active approval before action", "Bias in drafts may carry over if not reviewed"],
      controls: isNb
        ? ["Hvert utkast må godkjennes av et menneske", "Full audit log + 24t angre-funksjon", "Eskalering til menneske ved usikkerhet"]
        : ["Each draft must be human-approved", "Full audit log + 24h undo", "Escalation to human on uncertainty"],
    },
    automatic: {
      benefits: isNb
        ? ["Maksimal hastighet og dekning", "KI utfører rutineoppgaver døgnet rundt"]
        : ["Maximum speed and coverage", "AI executes routine tasks 24/7"],
      risks: isNb
        ? ["Mindre menneskelig kontroll på enkelthandlinger", "Krever stikkprøver og periodisk gjennomgang", "EU AI Act art. 14: dokumentert oversiktsplikt"]
        : ["Less human control on individual actions", "Requires sampling and periodic review", "EU AI Act art. 14: documented oversight duty"],
      controls: isNb
        ? ["Full revisjonslogg av alle KI-handlinger", "Kill-switch for umiddelbar pause", "24t angre-funksjon på alle handlinger", "Automatisk eskalering ved lav konfidens"]
        : ["Full audit log of all AI actions", "Kill-switch for immediate pause", "24h undo on all actions", "Automatic escalation on low confidence"],
    },
  };

  const c = consequences[config.globalLevel];

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* A. Intro banner */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-sm font-semibold text-foreground">
                {isNb ? "Styr hva Mynders KI får gjøre" : "Control what Mynder's AI is allowed to do"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isNb
                  ? "Du har full kontroll. Standardvalgene følger ISO/IEC 42001 sin anbefaling om meningsfull menneskelig overvåking. Høyere autonomi gir hastighet, men reduserer kontrollpunkter — Mynder anbefaler «Assistert» som balansert utgangspunkt."
                  : "You're in full control. Defaults follow ISO/IEC 42001 guidance on meaningful human oversight. Higher autonomy means more speed but fewer control points — Mynder recommends 'Assisted' as a balanced starting point."}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="outline" className="text-[10px] font-medium">ISO/IEC 42001</Badge>
                <Badge variant="outline" className="text-[10px] font-medium">NIST AI RMF</Badge>
                <Badge variant="outline" className="text-[10px] font-medium">EU AI Act art. 14</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. Global autonomy selector */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {isNb ? "Globalt autonominivå" : "Global autonomy level"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isNb ? "Setter standard for alle KI-oppgaver. Kan overstyres per oppgave under." : "Sets the default for all AI tasks. Can be overridden per task below."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(LEVEL_META) as Level[]).map((lvl) => {
              const meta = LEVEL_META[lvl];
              const Icon = meta.icon;
              const active = config.globalLevel === lvl;
              const isRecommended = lvl === "assisted";
              const shortDesc: Record<Level, { nb: string; en: string }> = {
                manual: { nb: "KI foreslår, du utfører alt", en: "AI suggests, you execute everything" },
                assisted: { nb: "KI lager utkast, du godkjenner før handling", en: "AI drafts, you approve before action" },
                automatic: { nb: "KI utfører selv innenfor definerte grenser", en: "AI acts within defined boundaries" },
              };
              const tradeoffs: Record<Level, { save: { nb: string; en: string }; give: { nb: string; en: string } }> = {
                manual: {
                  save: { nb: "Maks kontroll og innsikt", en: "Max control and insight" },
                  give: { nb: "Mer manuell tid", en: "More manual time" },
                },
                assisted: {
                  save: { nb: "60–80% tidsbesparelse", en: "60–80% time saved" },
                  give: { nb: "Krav om aktiv godkjenning", en: "Requires active approval" },
                },
                automatic: {
                  save: { nb: "Maks hastighet og dekning", en: "Max speed and coverage" },
                  give: { nb: "Mindre kontroll per handling", en: "Less per-action control" },
                },
              };

              return (
                <button
                  key={lvl}
                  onClick={() => setGlobal(lvl)}
                  className={`text-left rounded-xl border p-4 transition-all hover:border-primary/40 ${
                    active ? `${meta.activeBorder} ${meta.activeBg} shadow-sm` : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${active ? meta.activeBg : "bg-muted"}`}>
                        <Icon className={`h-4 w-4 ${meta.tone}`} />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {isNb ? meta.nb : meta.en}
                      </span>
                    </div>
                    {isRecommended && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {isNb ? "Anbefalt" : "Recommended"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 min-h-[32px]">
                    {isNb ? shortDesc[lvl].nb : shortDesc[lvl].en}
                  </p>
                  <Separator className="mb-2" />
                  <div className="space-y-1">
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{isNb ? tradeoffs[lvl].save.nb : tradeoffs[lvl].save.en}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{isNb ? tradeoffs[lvl].give.nb : tradeoffs[lvl].give.en}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* C. Dynamic consequence panel */}
      <Card className="border-l-4 border-l-primary bg-muted/30">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {isNb ? "Hva betyr dette?" : "What does this mean?"}
            </h3>
            <Badge className={`${globalMeta.tone} bg-transparent border ml-auto`} variant="outline">
              <span className={`h-1.5 w-1.5 rounded-full ${globalMeta.dot} mr-1.5`} />
              {isNb ? globalMeta.nb : globalMeta.en}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" /> {isNb ? "Fordeler" : "Benefits"}
              </h4>
              <ul className="space-y-1.5">
                {c.benefits.map((b, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {b}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-warning flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> {isNb ? "Risiko" : "Risks"}
              </h4>
              <ul className="space-y-1.5">
                {c.risks.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {r}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" /> {isNb ? "Kontrollpunkter" : "Controls"}
              </h4>
              <ul className="space-y-1.5">
                {c.controls.map((ct, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">• {ct}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D. Per-task overrides */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {isNb ? "Overstyring per oppgave" : "Per-task overrides"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNb ? "Finjuster autonomi for spesifikke KI-oppgaver. Overstyrer det globale nivået." : "Fine-tune autonomy for specific AI tasks. Overrides the global level."}
            </p>
          </div>

          <div className="space-y-2">
            {TASKS.map((task) => {
              const TaskIcon = task.icon;
              const currentLevel: Level = config.overrides[task.id] ?? config.globalLevel;
              const exceedsRecommended = LEVEL_RANK[currentLevel] > LEVEL_RANK[task.recommendedMax];

              return (
                <div key={task.id} className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <TaskIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{isNb ? task.nameNb : task.nameEn}</p>
                        <p className="text-xs text-muted-foreground">{isNb ? task.descNb : task.descEn}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-muted p-1 shrink-0">
                      {(Object.keys(LEVEL_META) as Level[]).map((lvl) => {
                        const meta = LEVEL_META[lvl];
                        const active = currentLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            onClick={() => setOverride(task.id, lvl)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                              active
                                ? "bg-card shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {isNb ? meta.nb : meta.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {exceedsRecommended && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 p-2.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                      <p className="text-[11px] text-foreground leading-relaxed">
                        {isNb
                          ? `Høyere enn anbefalt (${LEVEL_META[task.recommendedMax].nb}) for denne oppgaven. Mynder vil logge alle handlinger for revisjon.`
                          : `Higher than recommended (${LEVEL_META[task.recommendedMax].en}) for this task. Mynder will log all actions for audit.`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* E. Safety net */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              {isNb ? "Sikkerhetsnett — alltid på" : "Safety net — always on"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: History, nb: "Full revisjonslogg", en: "Full audit log", descNb: "Alle KI-handlinger logges med tidsstempel og kontekst", descEn: "All AI actions logged with timestamp and context" },
              { icon: Undo2, nb: "Angre-funksjon (24t)", en: "Undo (24h)", descNb: "Reverser KI-handlinger innen 24 timer", descEn: "Reverse AI actions within 24 hours" },
              { icon: PowerOff, nb: "Kill-switch", en: "Kill-switch", descNb: "Pauser all KI umiddelbart", descEn: "Pause all AI immediately" },
              { icon: Users, nb: "Eskalering til menneske", en: "Human escalation", descNb: "Ved usikkerhet over terskel", descEn: "On uncertainty above threshold" },
            ].map((item, i) => {
              const ItemIcon = item.icon;
              const isKill = item.en === "Kill-switch";
              return (
                <div key={i} className="rounded-lg border border-border p-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ItemIcon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">{isNb ? item.nb : item.en}</p>
                      {isKill && (
                        <Switch checked={config.killSwitch} onCheckedChange={toggleKill} />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{isNb ? item.descNb : item.descEn}</p>
                    {isKill && config.killSwitch && (
                      <Badge variant="destructive" className="mt-1.5 text-[9px]">
                        {isNb ? "AKTIV — All KI er pauset" : "ACTIVE — All AI paused"}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* F. Footer / framework anchoring */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-2.5">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isNb
                ? "Designet etter ISO/IEC 42001 §6.1 (AI risk treatment) og §8.3 (human oversight). EU AI Act art. 14 krever meningsfull menneskelig overvåking for høyrisiko-systemer. NIST AI RMF (Govern/Manage) brukes som risikobasert styringsrammeverk."
                : "Designed per ISO/IEC 42001 §6.1 (AI risk treatment) and §8.3 (human oversight). EU AI Act art. 14 requires meaningful human oversight for high-risk systems. NIST AI RMF (Govern/Manage) used as risk-based governance framework."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
