import { useTranslation } from "react-i18next";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

interface VendorRadarData {
  name: string;
  scores: Record<string, number>;
}

interface CompareRadarChartProps {
  vendors: VendorRadarData[];
}

export function CompareRadarChart({ vendors }: CompareRadarChartProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const dimensions = [
    { key: "security", label: isNb ? "Sikkerhet" : "Security" },
    { key: "data_handling", label: isNb ? "Datahåndtering" : "Data Handling" },
    { key: "privacy", label: isNb ? "Personvern" : "Privacy" },
    { key: "availability", label: isNb ? "Tilgjengelighet" : "Availability" },
  ];

  const chartData = dimensions.map((dim) => {
    const entry: Record<string, string | number> = { dimension: dim.label };
    vendors.forEach((v) => {
      entry[v.name] = v.scores[dim.key] ?? 0;
    });
    return entry;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {isNb ? "Compliance-profil" : "Compliance Profile"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
            {vendors.map((v, i) => (
              <Radar
                key={v.name}
                name={v.name}
                dataKey={v.name}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
