import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CompareVendor {
  id: string;
  name: string;
  compliance_score: number | null;
  risk_level: string | null;
  gdpr_role: string | null;
  vendor_category: string | null;
  country: string | null;
  hasDPA: boolean;
  categoryScores: {
    security: number | null;
    data_handling: number | null;
    privacy: number | null;
    availability: number | null;
  };
  overall_score: number | null;
  expiredDocs: number;
}

interface CompareTableProps {
  vendors: CompareVendor[];
}

function ScoreCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const color =
    value >= 70
      ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950"
      : value >= 40
        ? "text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950"
        : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950";
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-sm font-medium", color)}>
      {value}%
    </span>
  );
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-muted-foreground">—</span>;
  const variant =
    level === "high" ? "destructive" : level === "medium" ? "warning" : "action";
  return <Badge variant={variant}>{level}</Badge>;
}

export function CompareTable({ vendors }: CompareTableProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const dimensions: { label: string; render: (v: CompareVendor) => React.ReactNode }[] = [
    {
      label: isNb ? "Compliance-score" : "Compliance Score",
      render: (v) => <ScoreCell value={v.compliance_score} />,
    },
    {
      label: isNb ? "Sikkerhet" : "Security",
      render: (v) => <ScoreCell value={v.categoryScores.security} />,
    },
    {
      label: isNb ? "Datahåndtering" : "Data Handling",
      render: (v) => <ScoreCell value={v.categoryScores.data_handling} />,
    },
    {
      label: isNb ? "Personvern" : "Privacy",
      render: (v) => <ScoreCell value={v.categoryScores.privacy} />,
    },
    {
      label: isNb ? "Tilgjengelighet" : "Availability",
      render: (v) => <ScoreCell value={v.categoryScores.availability} />,
    },
    {
      label: isNb ? "AI-analyse" : "AI Analysis",
      render: (v) => <ScoreCell value={v.overall_score} />,
    },
    {
      label: isNb ? "Risikonivå" : "Risk Level",
      render: (v) => <RiskBadge level={v.risk_level} />,
    },
    {
      label: "DPA",
      render: (v) =>
        v.hasDPA ? (
          <Badge variant="action">{isNb ? "Ja" : "Yes"}</Badge>
        ) : (
          <Badge variant="destructive">{isNb ? "Nei" : "No"}</Badge>
        ),
    },
    {
      label: isNb ? "GDPR-rolle" : "GDPR Role",
      render: (v) => (
        <span className="text-sm">{v.gdpr_role || "—"}</span>
      ),
    },
    {
      label: isNb ? "Kategori" : "Category",
      render: (v) => (
        <span className="text-sm">{v.vendor_category || "—"}</span>
      ),
    },
    {
      label: isNb ? "Land" : "Country",
      render: (v) => <span className="text-sm">{v.country || "—"}</span>,
    },
    {
      label: isNb ? "Utdaterte dokumenter" : "Expired Documents",
      render: (v) =>
        v.expiredDocs > 0 ? (
          <Badge variant="destructive">{v.expiredDocs}</Badge>
        ) : (
          <Badge variant="action">0</Badge>
        ),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {isNb ? "Sammenstilling" : "Comparison"}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">
                {isNb ? "Dimensjon" : "Dimension"}
              </TableHead>
              {vendors.map((v) => (
                <TableHead key={v.id} className="text-center min-w-[120px]">
                  {v.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dimensions.map((dim) => (
              <TableRow key={dim.label}>
                <TableCell className="font-medium">{dim.label}</TableCell>
                {vendors.map((v) => (
                  <TableCell key={v.id} className="text-center">
                    {dim.render(v)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
