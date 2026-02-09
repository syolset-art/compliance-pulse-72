import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, ArrowRight, MessageSquare, ExternalLink, LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  relevant_for: string[];
}

interface DomainActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: string;
  domainName: string;
  domainIcon: LucideIcon;
  domainColor: string;
  domainBgColor: string;
  tasks: Task[];
  onOpenChat?: (context: string) => void;
}

export function DomainActionDialog({
  open,
  onOpenChange,
  domainId,
  domainName,
  domainIcon: Icon,
  domainColor,
  domainBgColor,
  tasks,
  onOpenChat
}: DomainActionDialogProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  const highPriorityTasks = incompleteTasks.filter(t => t.priority === 'høy' || t.priority === 'high');

  const handleStartTask = (taskId: string) => {
    onOpenChange(false);
    navigate(`/tasks?taskId=${taskId}`);
  };

  const handleViewAllTasks = () => {
    onOpenChange(false);
    navigate(`/tasks?domain=${domainId}`);
  };

  const handleChatWithLara = () => {
    onOpenChange(false);
    onOpenChat?.(`Jeg trenger hjelp med ${domainName}. Jeg har ${incompleteTasks.length} uferdige oppgaver.`);
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'høy' || priority === 'high') {
      return <Badge variant="destructive" className="text-xs">Høy</Badge>;
    }
    if (priority === 'medium') {
      return <Badge variant="secondary" className="text-xs">Medium</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Lav</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2.5 rounded-lg", domainBgColor)}>
              <Icon className={cn("h-5 w-5", domainColor)} />
            </div>
            <div>
              <DialogTitle className="text-lg">{domainName}</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                Trenger oppmerksomhet
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-4">
            Du har <span className="font-semibold text-foreground">{incompleteTasks.length} uferdige oppgaver</span> innenfor dette kontrollområdet
            {highPriorityTasks.length > 0 && (
              <>, hvorav <span className="font-semibold text-destructive">{highPriorityTasks.length} har høy prioritet</span></>
            )}.
          </p>

          {/* Task list - show top 3 */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {incompleteTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-sm text-foreground truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getPriorityBadge(task.priority)}
                    {task.relevant_for?.slice(0, 2).map((rf, i) => (
                      <span key={i} className="text-muted-foreground">
                        {rf}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Start <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ))}

            {incompleteTasks.length > 3 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                + {incompleteTasks.length - 3} flere oppgaver
              </p>
            )}

            {incompleteTasks.length === 0 && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Alle oppgaver er fullført!</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleChatWithLara}
            className="flex-1 sm:flex-none"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t("chatPanel.talkToLaraButton")}
          </Button>
          <Button
            onClick={handleViewAllTasks}
            className="flex-1 sm:flex-none"
          >
            Se alle oppgaver
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
