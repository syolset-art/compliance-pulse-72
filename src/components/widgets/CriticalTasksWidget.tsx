import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const criticalItems = [
  "3 dokumenter utdatert",
  "2 risikovurderinger mangler",
  "1 beredskapsplan utdatert",
];

export function CriticalTasksWidget() {
  const totalTasks = criticalItems.length + 3; // Simulated additional tasks
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Kritiske oppgaver
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            {totalTasks} oppgaver krever handling
          </h2>
        </div>
        <ul className="space-y-2">
          {criticalItems.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
