import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Plus, Mail, User, Building2, Check, Clock, X, Trash2, Network,
} from "lucide-react";
import { toast } from "sonner";

export function NetworkTab() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [connectionType, setConnectionType] = useState("customer");

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["network-connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("network_connections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("network_connections").insert({
        invited_by_user_id: user.id,
        organization_name: orgName.trim(),
        contact_person: contactPerson.trim() || null,
        contact_email: contactEmail.trim(),
        connection_type: connectionType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network-connections"] });
      toast.success(isNb ? "Invitasjon sendt" : "Invitation sent");
      setOrgName("");
      setContactPerson("");
      setContactEmail("");
      setShowInviteForm(false);
    },
    onError: () => {
      toast.error(isNb ? "Kunne ikke sende invitasjon" : "Failed to send invitation");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("network_connections")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network-connections"] });
      toast.success(isNb ? "Forbindelse godtatt" : "Connection accepted");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("network_connections")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network-connections"] });
      toast.success(isNb ? "Forbindelse fjernet" : "Connection removed");
    },
  });

  const acceptedCount = connections.filter((c: any) => c.status === "accepted").length;
  const pendingCount = connections.filter((c: any) => c.status === "pending").length;

  function getStatusBadge(status: string) {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] gap-1">
            <Check className="h-3 w-3" />
            {isNb ? "Godtatt" : "Accepted"}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] gap-1">
            <Clock className="h-3 w-3" />
            {isNb ? "Avventer" : "Pending"}
          </Badge>
        );
      case "declined":
        return (
          <Badge className="bg-red-500/15 text-red-700 border-red-500/30 text-[10px] gap-1">
            <X className="h-3 w-3" />
            {isNb ? "Avslått" : "Declined"}
          </Badge>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">{acceptedCount}</p>
              <p className="text-[11px] text-muted-foreground">{isNb ? "Godtatte" : "Accepted"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">{pendingCount}</p>
              <p className="text-[11px] text-muted-foreground">{isNb ? "Avventer" : "Pending"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Network className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{connections.length}</p>
              <p className="text-[11px] text-muted-foreground">{isNb ? "Totalt" : "Total"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <Users className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          {isNb
            ? "Nettverket fungerer som LinkedIn — du kan bare dele dokumenter og sende forespørsler til kontakter som har godtatt invitasjonen din."
            : "The network works like LinkedIn — you can only share documents and send requests to contacts who have accepted your invitation."}
        </p>
      </div>

      {/* Invite button */}
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setShowInviteForm(!showInviteForm)}>
          <Plus className="h-4 w-4" />
          {isNb ? "Inviter til nettverk" : "Invite to network"}
        </Button>
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{isNb ? "Inviter ny kontakt" : "Invite new contact"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">{isNb ? "Organisasjonsnavn *" : "Organization name *"}</Label>
              <div className="relative mt-1">
                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={isNb ? "F.eks. Bedrift AS" : "e.g. Company AS"} className="h-9 pl-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isNb ? "Kontaktperson" : "Contact person"}</Label>
                <div className="relative mt-1">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder={isNb ? "Navn" : "Name"} className="h-9 pl-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">{isNb ? "E-post *" : "Email *"}</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="name@company.no" className="h-9 pl-8 text-sm" />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">{isNb ? "Type" : "Type"}</Label>
              <Select value={connectionType} onValueChange={setConnectionType}>
                <SelectTrigger className="h-9 mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{isNb ? "Kunde" : "Customer"}</SelectItem>
                  <SelectItem value="vendor">{isNb ? "Leverandør" : "Vendor"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" disabled={!orgName.trim() || !contactEmail.trim() || inviteMutation.isPending} onClick={() => inviteMutation.mutate()} className="gap-1">
                <Mail className="h-3.5 w-3.5" />
                {isNb ? "Send invitasjon" : "Send invitation"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowInviteForm(false)}>
                {isNb ? "Avbryt" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            {isNb ? "Mine forbindelser" : "My connections"}
            <Badge variant="secondary" className="text-[10px]">{connections.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">{isNb ? "Laster..." : "Loading..."}</p>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Network className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{isNb ? "Ingen forbindelser ennå" : "No connections yet"}</p>
              <p className="text-xs mt-1">{isNb ? "Inviter kunder og leverandører til nettverket ditt" : "Invite customers and vendors to your network"}</p>
            </div>
          ) : (
            connections.map((conn: any) => (
              <div key={conn.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{conn.organization_name}</span>
                    {getStatusBadge(conn.status)}
                    <Badge variant="outline" className="text-[10px]">
                      {conn.connection_type === "customer" ? (isNb ? "Kunde" : "Customer") : (isNb ? "Leverandør" : "Vendor")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {conn.contact_person && <span>{conn.contact_person}</span>}
                    {conn.contact_person && conn.contact_email && <span>·</span>}
                    {conn.contact_email && <span>{conn.contact_email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {conn.status === "pending" && (
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => acceptMutation.mutate(conn.id)}>
                      <Check className="h-3 w-3" />
                      {isNb ? "Godta" : "Accept"}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(conn.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
