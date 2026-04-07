import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ComplianceHistoryChartProps {
  frameworkId: string;
}

function generateDemoData(frameworkId: string) {
  const seed = frameworkId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const data = [];
  let value = 10 + (seed % 30);
  const now = new Date();
  for (let i = 90; i >= 0; i -= 3) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value = Math.min(100, Math.max(0, value + (Math.sin(seed + i) * 4 + 1.2)));
    data.push({
      date: `${date.getDate()}.${date.getMonth() + 1}`,
      score: Math.round(value),
    });
  }
  return data;
}

export const ComplianceHistoryChart = ({ frameworkId }: ComplianceHistoryChartProps) => {
  const data = useMemo(() => generateDemoData(frameworkId), [frameworkId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Historisk utvikling</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={4}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}%`, "Score"]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
