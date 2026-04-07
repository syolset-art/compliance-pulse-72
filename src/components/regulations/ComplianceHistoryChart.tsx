import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { CheckCircle2, CircleAlert, Circle } from "lucide-react";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";

export interface ComplianceEvent {
  date: string;
  requirementId: string;
  requirementName: string;
  type: "met" | "partial" | "lost";
  score: number;
  dataIndex: number;
}

interface DataPoint {
  date: string;
  score: number;
  events?: ComplianceEvent[];
}

interface ComplianceHistoryChartProps {
  frameworkId: string;
  onEventClick?: (requirementId: string) => void;
}

function getReqs(frameworkId: string): ComplianceRequirement[] {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main;
  return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
}

function generateDemoData(frameworkId: string): { data: DataPoint[]; events: ComplianceEvent[] } {
  const seed = frameworkId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const reqs = getReqs(frameworkId);
  const data: DataPoint[] = [];
  const allEvents: ComplianceEvent[] = [];
  let value = 10 + (seed % 30);
  const now = new Date();
  const dates: string[] = [];

  for (let i = 90; i >= 0; i -= 3) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value = Math.min(100, Math.max(0, value + (Math.sin(seed + i) * 4 + 1.2)));
    const dateStr = `${date.getDate()}.${date.getMonth() + 1}`;
    dates.push(dateStr);
    data.push({ date: dateStr, score: Math.round(value), events: [] });
  }

  // Generate deterministic events at specific data points
  if (reqs.length > 0) {
    const eventIndices = [4, 9, 14, 19, 23, 27];
    eventIndices.forEach((idx, i) => {
      if (idx >= data.length || i >= reqs.length) return;
      const req = reqs[i % reqs.length];
      const hash = (req.requirement_id.charCodeAt(req.requirement_id.length - 1) + i) % 3;
      const type: ComplianceEvent["type"] = hash === 0 ? "met" : hash === 1 ? "partial" : "lost";
      const event: ComplianceEvent = {
        date: data[idx].date,
        requirementId: req.requirement_id,
        requirementName: req.name_no,
        type,
        score: data[idx].score,
        dataIndex: idx,
      };
      data[idx].events = [...(data[idx].events || []), event];
      allEvents.push(event);
    });
  }

  return { data, events: allEvents };
}

const eventTypeLabel = {
  met: "Oppfylt",
  partial: "Delvis oppfylt",
  lost: "Ikke oppfylt",
};

const eventTypeColor = {
  met: "text-emerald-600 dark:text-emerald-400",
  partial: "text-amber-600 dark:text-amber-400",
  lost: "text-destructive",
};

const EventIcon = ({ type, className = "h-3.5 w-3.5" }: { type: ComplianceEvent["type"]; className?: string }) => {
  if (type === "met") return <CheckCircle2 className={`${className} text-emerald-500`} />;
  if (type === "partial") return <CircleAlert className={`${className} text-amber-500`} />;
  return <Circle className={`${className} text-destructive/60`} />;
};

// Custom tooltip that shows events
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const point: DataPoint = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs max-w-[220px]">
      <div className="flex justify-between items-center mb-1">
        <span className="text-muted-foreground">{point.date}</span>
        <span className="font-semibold">{point.score}%</span>
      </div>
      {point.events && point.events.length > 0 && (
        <div className="border-t border-border pt-1.5 mt-1 space-y-1">
          {point.events.map((ev, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <EventIcon type={ev.type} className="h-3 w-3 mt-0.5 shrink-0" />
              <div>
                <span className="font-mono text-[10px] text-muted-foreground">{ev.requirementId}</span>
                <span className={`ml-1 font-medium ${eventTypeColor[ev.type]}`}>{eventTypeLabel[ev.type]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ComplianceHistoryChart = ({ frameworkId, onEventClick }: ComplianceHistoryChartProps) => {
  const { data, events } = useMemo(() => generateDemoData(frameworkId), [frameworkId]);
  const recentEvents = useMemo(() => [...events].reverse().slice(0, 6), [events]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Historisk utvikling</CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            {/* Event markers */}
            {events.map((ev, i) => (
              <ReferenceDot
                key={i}
                x={ev.date}
                y={ev.score}
                r={5}
                fill={ev.type === "met" ? "hsl(142, 71%, 45%)" : ev.type === "partial" ? "hsl(38, 92%, 50%)" : "hsl(var(--destructive))"}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

      </CardContent>
    </Card>
  );
};
