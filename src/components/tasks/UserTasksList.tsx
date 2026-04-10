import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, User, Trash2, CheckCircle2, Clock, CircleDot, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserTask } from "@/hooks/useUserTasks";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ny: { label: "Ny", color: "bg-muted text-muted-foreground", icon: <CircleDot className="h-3 w-3" /> },
  pågår: { label: "Pågår", color: "bg-primary/15 text-primary", icon: <Clock className="h-3 w-3" /> },
  fullført: { label: "Fullført", color: "bg-green-500/15 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
};

interface UserTasksListProps {
  tasks: UserTask[];
  isLoading: boolean;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function UserTasksList({ tasks, isLoading, onStatusChange, onDelete }: UserTasksListProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4">Laster oppgaver...</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Ingen egne oppgaver ennå. Klikk «Ny oppgave» for å opprette en.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const status = statusConfig[task.status] || statusConfig.ny;
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "fullført";

        return (
          <Card key={task.id} className={`p-4 transition-all ${task.status === "fullført" ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-xs gap-1 ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">Forfalt</Badge>
                  )}
                  {task.asset_name && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Link2 className="h-3 w-3" />
                      {task.asset_name}
                    </Badge>
                  )}
                </div>
                <h4 className="text-sm font-medium text-foreground">{task.title}</h4>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {task.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </span>
                  )}
                  {task.due_date && (
                    <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), "d. MMM yyyy", { locale: nb })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Select value={task.status} onValueChange={(val) => onStatusChange(task.id, val)}>
                  <SelectTrigger className="h-8 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ny">Ny</SelectItem>
                    <SelectItem value="pågår">Pågår</SelectItem>
                    <SelectItem value="fullført">Fullført</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
