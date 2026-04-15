import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, format } from "date-fns";
import { useTranslation } from "react-i18next";

export function MonthlyTasksWidget() {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

      const [totalRes, completedRes] = await Promise.all([
        supabase
          .from("requirement_status")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("requirement_status")
          .select("id", { count: "exact", head: true })
          .gte("completed_at", monthStart),
      ]);

      setTotal(totalRes.count || 0);
      setCompleted(completedRes.count || 0);
    };
    fetch();
  }, []);

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed >= total;
  const lowProgress = total > 0 && pct < 50;

  return (
    <Card variant="flat" className="h-full">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          {isNorwegian ? "Månedens oppgaver" : "Monthly tasks"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        <div className="flex items-center gap-2">
          {allDone ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : lowProgress ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
          <span className="text-lg font-bold">
            {completed}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {isNorwegian ? `av ${total} utført` : `of ${total} done`}
            </span>
          </span>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="text-[13px] text-muted-foreground">
          {isNorwegian ? "Denne måneden" : "This month"} · {pct}%
        </p>
      </CardContent>
    </Card>
  );
}
