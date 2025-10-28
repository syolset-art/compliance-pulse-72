import { Card } from "@/components/ui/card";
import { Shield, Lock, Globe, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  gdpr: Shield,
  iso: Lock,
  nis2: Globe,
  cra: FileCheck,
};

interface ComplianceCardProps {
  standard: "gdpr" | "iso" | "nis2" | "cra";
  title: string;
  percentage: number;
  subtitle: string;
}

export function ComplianceCard({ standard, title, percentage, subtitle }: ComplianceCardProps) {
  const Icon = icons[standard];
  const isGood = percentage >= 80;
  
  return (
    <Card className="p-6 transition-shadow hover:shadow-md">
      <div className="flex flex-col items-center text-center">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg mb-4",
          isGood ? "bg-success/10" : "bg-warning/10"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            isGood ? "text-success" : "text-warning"
          )} />
        </div>
        
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        
        <div className="relative w-full h-2 bg-muted rounded-full mb-3">
          <div 
            className={cn(
              "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
              isGood ? "bg-success" : "bg-warning"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className={cn(
          "text-3xl font-bold mb-2",
          isGood ? "text-success" : "text-warning"
        )}>
          {percentage}%
        </p>
        
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </Card>
  );
}
