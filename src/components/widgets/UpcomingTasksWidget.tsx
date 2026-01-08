import { useState } from "react";
import { Calendar, User, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TaskFilter = "alle" | "gdpr" | "nis2" | "revisjon" | "iso27001" | "intern";

interface Task {
  id: string;
  title: string;
  date: string;
  daysLeft: number;
  assignee: string;
  category: TaskFilter;
  critical?: boolean;
}

const tasks: Task[] = [
  { id: "1", title: "Oppdater personvernerklæring", date: "5. des", daysLeft: 3, assignee: "Maria L.", category: "gdpr", critical: true },
  { id: "2", title: "Gjennomfør risikovurdering NIS2", date: "8. des", daysLeft: 6, assignee: "Erik S.", category: "nis2" },
  { id: "3", title: "Intern revisjon Q4", date: "10. des", daysLeft: 8, assignee: "Anna K.", category: "revisjon" },
  { id: "4", title: "Oppdater databehandleravtaler", date: "12. des", daysLeft: 10, assignee: "Jonas H.", category: "gdpr" },
];

const filters: { value: TaskFilter; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "gdpr", label: "GDPR" },
  { value: "nis2", label: "NIS2" },
  { value: "revisjon", label: "Revisjon" },
  { value: "iso27001", label: "ISO 27001" },
  { value: "intern", label: "Intern" },
];

const getCategoryColor = (category: TaskFilter) => {
  switch (category) {
    case "gdpr": return "bg-primary text-primary-foreground";
    case "nis2": return "bg-accent text-accent-foreground";
    case "revisjon": return "bg-muted text-foreground";
    case "iso27001": return "bg-secondary text-secondary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export function UpcomingTasksWidget() {
  const [filter, setFilter] = useState<TaskFilter>("alle");
  
  const filteredTasks = filter === "alle" 
    ? tasks 
    : tasks.filter(t => t.category === filter);
  
  const criticalCount = tasks.filter(t => t.critical).length;
  const thisWeekCount = tasks.filter(t => t.daysLeft <= 7).length;
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Kommende oppgaver
              </CardTitle>
              <p className="text-xs text-muted-foreground">{tasks.length} oppgaver</p>
            </div>
          </div>
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            Se alle <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <span className="text-muted-foreground text-sm">⚙</span>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        {/* Task List */}
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {task.date}
                      <span className="text-warning">({task.daysLeft}d)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </span>
                  </div>
                </div>
                <Badge className={`text-xs ${getCategoryColor(task.category)}`}>
                  {task.category.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            {criticalCount} kritisk
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning" />
            {thisWeekCount} denne uken
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
