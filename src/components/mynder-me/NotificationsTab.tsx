import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  title_no: string | null;
  content: string | null;
  content_no: string | null;
  severity: string;
  created_at: string;
  expires_at: string | null;
}

const severityConfig: Record<string, { icon: typeof Info; color: string; label: string }> = {
  info: { icon: Info, label: "Info", color: "text-blue-500" },
  warning: { icon: AlertTriangle, label: "Advarsel", color: "text-amber-500" },
  critical: { icon: ShieldAlert, label: "Kritisk", color: "text-destructive" },
};

const typeLabels: Record<string, string> = {
  policy_update: "Policy-oppdatering",
  course_assignment: "Kurstildeling",
  incident: "Hendelse",
};

export function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({
    type: "policy_update",
    title_no: "",
    content_no: "",
    severity: "info",
  });

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("employee_notifications")
      .select("*")
      .order("created_at", { ascending: false });
    setNotifications((data as Notification[]) || []);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleSend = async () => {
    if (!newNotif.title_no) {
      toast.error("Tittel er påkrevd");
      return;
    }
    const { error } = await supabase.from("employee_notifications").insert({
      type: newNotif.type,
      title: newNotif.title_no,
      title_no: newNotif.title_no,
      content_no: newNotif.content_no,
      severity: newNotif.severity,
    });
    if (error) {
      toast.error("Kunne ikke sende varsel");
    } else {
      toast.success("Varsel sendt til alle ansatte!");
      setDialogOpen(false);
      setNewNotif({ type: "policy_update", title_no: "", content_no: "", severity: "info" });
      fetchNotifications();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Varsler til ansatte
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nytt varsel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send varsel til ansatte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={newNotif.type} onValueChange={v => setNewNotif(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alvorlighetsgrad</Label>
                <Select value={newNotif.severity} onValueChange={v => setNewNotif(p => ({ ...p, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Advarsel</SelectItem>
                    <SelectItem value="critical">Kritisk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tittel</Label>
                <Input value={newNotif.title_no} onChange={e => setNewNotif(p => ({ ...p, title_no: e.target.value }))} />
              </div>
              <div>
                <Label>Innhold</Label>
                <Textarea value={newNotif.content_no} onChange={e => setNewNotif(p => ({ ...p, content_no: e.target.value }))} />
              </div>
              <Button onClick={handleSend} className="w-full">Send varsel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map(notif => {
            const sev = severityConfig[notif.severity] || severityConfig.info;
            const SevIcon = sev.icon;
            return (
              <div key={notif.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <SevIcon className={`h-5 w-5 mt-0.5 ${sev.color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{notif.title_no || notif.title}</p>
                    <Badge variant="outline">{typeLabels[notif.type] || notif.type}</Badge>
                    <Badge variant={notif.severity === "critical" ? "destructive" : "secondary"}>{sev.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.content_no || notif.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(notif.created_at), "d. MMM yyyy HH:mm", { locale: nb })}
                  </p>
                </div>
              </div>
            );
          })}
          {notifications.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Ingen varsler sendt ennå.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
