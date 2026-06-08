import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DataCategoriesCardProps {
  assetId: string;
}

type AnswerMap = Record<string, boolean | null>;

type Question = {
  key: string;
  nb: string;
  en: string;
  hintNb?: string;
  hintEn?: string;
};

type QuestionGroup = {
  id: string;
  titleNb: string;
  titleEn: string;
  // matchFramework returns true if any selected framework activates this group
  matchFramework?: (frameworkIds: string[]) => boolean;
  questions: Question[];
};

const GROUPS: QuestionGroup[] = [
  {
    id: "base",
    titleNb: "Datatyper",
    titleEn: "Data types",
    questions: [
      { key: "personal_data", nb: "Personopplysninger", en: "Personal data" },
      { key: "sensitive_personal", nb: "Sensitive personopplysninger", en: "Sensitive personal data", hintNb: "GDPR art. 9: helse, etnisitet, religion, fagforening m.m.", hintEn: "GDPR art. 9: health, ethnicity, religion, union membership, etc." },
      { key: "employee_data", nb: "Ansattdata", en: "Employee data" },
      { key: "customer_data", nb: "Kundedata", en: "Customer data" },
      { key: "health_data", nb: "Helseopplysninger", en: "Health data" },
      { key: "financial_data", nb: "Finansielle data", en: "Financial data" },
      { key: "children_data", nb: "Data om barn (under 16)", en: "Children's data (under 16)" },
    ],
  },
  {
    id: "nis2",
    titleNb: "NIS2 / kritisk infrastruktur",
    titleEn: "NIS2 / critical infrastructure",
    matchFramework: (ids) => ids.some((id) => id.toLowerCase().includes("nis2") || id.toLowerCase().includes("nis-2")),
    questions: [
      { key: "critical_infra_data", nb: "Data knyttet til kritisk infrastruktur", en: "Data tied to critical infrastructure" },
      { key: "operational_tech", nb: "Operasjonell teknologi (OT/ICS)", en: "Operational technology (OT/ICS)" },
      { key: "network_logs", nb: "Nettverks- og hendelseslogger", en: "Network and event logs" },
    ],
  },
  {
    id: "dora",
    titleNb: "DORA / finansiell motstandsdyktighet",
    titleEn: "DORA / financial resilience",
    matchFramework: (ids) => ids.some((id) => id.toLowerCase().includes("dora")),
    questions: [
      { key: "financial_transactions", nb: "Finansielle transaksjoner", en: "Financial transactions" },
      { key: "ict_risk_data", nb: "IKT-risiko- og hendelsesdata", en: "ICT risk and incident data" },
    ],
  },
  {
    id: "ai_act",
    titleNb: "EU AI Act",
    titleEn: "EU AI Act",
    matchFramework: (ids) => ids.some((id) => id.toLowerCase().includes("ai-act") || id.toLowerCase().includes("ai_act") || id.toLowerCase().includes("aiact")),
    questions: [
      { key: "ai_training_data", nb: "Treningsdata for AI", en: "AI training data" },
      { key: "biometric_data", nb: "Biometriske data", en: "Biometric data" },
      { key: "automated_decisions", nb: "Automatiserte beslutninger om personer", en: "Automated decisions about people" },
    ],
  },
  {
    id: "iso27001",
    titleNb: "ISO 27001 / informasjonssikkerhet",
    titleEn: "ISO 27001 / information security",
    matchFramework: (ids) => ids.some((id) => id.toLowerCase().includes("iso") && id.includes("27001")),
    questions: [
      { key: "trade_secrets", nb: "Forretningshemmeligheter", en: "Trade secrets" },
      { key: "source_code", nb: "Kildekode eller proprietær teknologi", en: "Source code or proprietary technology" },
    ],
  },
];

const TriState = ({ value, onChange, isNb }: { value: boolean | null; onChange: (v: boolean) => void; isNb: boolean }) => (
  <div className="flex items-center gap-1.5 shrink-0">
    <button
      type="button"
      onClick={() => onChange(true)}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        value === true
          ? "bg-success/15 text-success border-success/40"
          : "border-border text-muted-foreground hover:border-foreground/30"
      )}
    >
      {isNb ? "Ja" : "Yes"}
    </button>
    <button
      type="button"
      onClick={() => onChange(false)}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        value === false
          ? "bg-muted text-foreground border-border"
          : "border-border text-muted-foreground hover:border-foreground/30"
      )}
    >
      {isNb ? "Nei" : "No"}
    </button>
  </div>
);

export const DataCategoriesCard = ({ assetId }: DataCategoriesCardProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [freeText, setFreeText] = useState("");
  const [original, setOriginal] = useState<{ answers: AnswerMap; freeText: string }>({ answers: {}, freeText: "" });
  const [saving, setSaving] = useState(false);

  const { data: asset } = useQuery({
    queryKey: ["asset-data-categories", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, metadata")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-for-data-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("selected_frameworks")
        .select("framework_id")
        .eq("is_selected", true);
      return (data || []).map((r: any) => r.framework_id as string);
    },
  });

  useEffect(() => {
    const meta = (asset?.metadata as any) || {};
    const stored = (meta.data_categories as AnswerMap) || {};
    const text = (meta.data_categories_note as string) || meta.personal_data_text || "";
    setAnswers(stored);
    setFreeText(text);
    setOriginal({ answers: stored, freeText: text });
  }, [asset?.id]);

  const visibleGroups = useMemo(() => {
    return GROUPS.filter((g) => !g.matchFramework || g.matchFramework(frameworks));
  }, [frameworks]);

  const dirty = useMemo(() => {
    if (freeText !== original.freeText) return true;
    const keys = new Set([...Object.keys(answers), ...Object.keys(original.answers)]);
    for (const k of keys) {
      if (answers[k] !== original.answers[k]) return true;
    }
    return false;
  }, [answers, freeText, original]);

  const setAnswer = (key: string, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const meta = (asset?.metadata as any) || {};
      const newMeta = {
        ...meta,
        data_categories: answers,
        data_categories_note: freeText,
        data_categories_updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("assets").update({ metadata: newMeta }).eq("id", assetId);
      if (error) throw error;
      setOriginal({ answers, freeText });
      toast.success(isNb ? "Lagret" : "Saved");
      queryClient.invalidateQueries({ queryKey: ["asset-data-categories", assetId] });
    } catch (e: any) {
      toast.error(e?.message || (isNb ? "Kunne ikke lagre" : "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const answeredCount = Object.values(answers).filter((v) => v === true).length;

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {isNb ? "Databruk og datakategorier" : "Data usage and categories"}
        </CardTitle>
        <div className="flex items-center gap-2">
          {answeredCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {answeredCount} {isNb ? "kategorier valgt" : "categories selected"}
            </Badge>
          )}
          <Badge variant="outline" className="text-[11px] gap-1">
            <Info className="h-3 w-3" />
            {isNb ? "Spørsmål tilpasses regelverk" : "Adapts to regulations"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {visibleGroups.map((group) => (
          <div key={group.id} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isNb ? group.titleNb : group.titleEn}
            </h4>
            <div className="rounded-lg border divide-y">
              {group.questions.map((q) => (
                <div key={q.key} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <Label className="text-sm font-normal cursor-default">
                      {isNb ? q.nb : q.en}
                    </Label>
                    {(q.hintNb || q.hintEn) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isNb ? q.hintNb : q.hintEn}
                      </p>
                    )}
                  </div>
                  <TriState value={answers[q.key] ?? null} onChange={(v) => setAnswer(q.key, v)} isNb={isNb} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isNb ? "Fri tekst (valgfritt)" : "Free text (optional)"}
          </Label>
          <Textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={isNb ? "Beskriv eventuelle andre datatyper, formål eller spesielle hensyn…" : "Describe any other data types, purposes, or special considerations…"}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end pt-1">
          <Button size="sm" variant={dirty ? "default" : "ghost"} onClick={handleSave} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {isNb ? "Lagre" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
