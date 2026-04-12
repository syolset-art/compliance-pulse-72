import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Crown,
  Monitor,
  ClipboardCheck,
  Workflow,
  Pencil,
  Plus,
  Check,
  X,
  Trash2,
  Loader2,
  UserPlus,
} from "lucide-react";

interface Member {
  id: string;
  person_name: string;
  role: string;
  email: string | null;
}

const ROLE_CONFIG = [
  { key: "system_owner", label: "Systemansvarlig", desc: "Ansvar for systemer i arbeidsområdet", icon: Monitor },
  { key: "action_owner", label: "Tiltaksansvarlig", desc: "Ansvar for risikoscenarier i prosesser", icon: ClipboardCheck },
  { key: "process_owner", label: "Prosessansvarlig", desc: "Ansvar for behandlingsaktiviteter", icon: Workflow },
  { key: "member", label: "Medlem", desc: "Generelt medlem av arbeidsområdet", icon: UsersIcon },
] as const;

const ROLE_LABELS: Record<string, string> = {
  system_owner: "Systemansvarlig",
  action_owner: "Tiltaksansvarlig",
  process_owner: "Prosessansvarlig",
  member: "Medlem",
};

interface WorkAreaMembersCardProps {
  workAreaId: string;
  ownerName: string | null;
  onOwnerChange: (newOwner: string | null) => void;
}

export const WorkAreaMembersCard = ({ workAreaId, ownerName, onOwnerChange }: WorkAreaMembersCardProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [allPeople, setAllPeople] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("work_area_members")
        .select("*")
        .eq("work_area_id", workAreaId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch {
      console.error("Error fetching members");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPeople = async () => {
    try {
      const { data } = await supabase
        .from("work_area_members")
        .select("person_name");
      if (data) {
        const unique = [...new Set(data.map(d => d.person_name))].sort();
        setAllPeople(unique);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchAllPeople();
  }, [workAreaId]);

  const currentMemberNames = new Set(members.map(m => m.person_name));
  const filteredPeople = allPeople
    .filter(name => !currentMemberNames.has(name))
    .filter(name => !newName || name.toLowerCase().includes(newName.toLowerCase()));

  // Owner suggestions: all known people
  const ownerSuggestions = allPeople
    .filter(name => !ownerSearch || name.toLowerCase().includes(ownerSearch.toLowerCase()));

  const handleOwnerSave = async (name: string) => {
    try {
      const { error } = await supabase
        .from("work_areas")
        .update({ responsible_person: name.trim() || null })
        .eq("id", workAreaId);
      if (error) throw error;
      onOwnerChange(name.trim() || null);
      setIsEditingOwner(false);
      setOwnerSearch("");
      toast.success("Eier oppdatert");
    } catch {
      toast.error("Kunne ikke oppdatere eier");
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("work_area_members").insert({
        work_area_id: workAreaId,
        person_name: newName.trim(),
        role: newRole,
      });
      if (error) throw error;
      toast.success("Medlem lagt til");
      setNewName("");
      setNewRole("member");
      setIsAdding(false);
      fetchMembers();
      fetchAllPeople();
    } catch {
      toast.error("Kunne ikke legge til medlem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("work_area_members")
        .update({ person_name: editName.trim(), role: editRole })
        .eq("id", id);
      if (error) throw error;
      toast.success("Medlem oppdatert");
      setEditingId(null);
      fetchMembers();
    } catch {
      toast.error("Kunne ikke oppdatere medlem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("work_area_members").delete().eq("id", id);
      if (error) throw error;
      toast.success("Medlem fjernet");
      fetchMembers();
    } catch {
      toast.error("Kunne ikke fjerne medlem");
    }
  };

  const getRoleIcon = (role: string) => {
    const config = ROLE_CONFIG.find(r => r.key === role);
    if (!config) return UsersIcon;
    return config.icon;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary" />
          Medlemmer
        </h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1.5 text-xs h-7 bg-primary text-primary-foreground hover:bg-primary/90">
            <UserPlus className="h-3.5 w-3.5" />
            Legg til
          </Button>
        )}
      </div>

      {/* Eier (obligatorisk) */}
      <div className="mb-5">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Eier <span className="text-destructive">*</span>
        </div>
        {isEditingOwner ? (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
            <div className="relative">
              <Input
                value={ownerSearch}
                onChange={(e) => { setOwnerSearch(e.target.value); setShowOwnerSuggestions(true); }}
                onFocus={() => setShowOwnerSuggestions(true)}
                onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 200)}
                placeholder="Søk eller skriv inn navn..."
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && ownerSearch.trim()) handleOwnerSave(ownerSearch);
                  if (e.key === "Escape") { setIsEditingOwner(false); setOwnerSearch(""); }
                }}
              />
              {showOwnerSuggestions && ownerSuggestions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {ownerSuggestions.map((name) => (
                    <button
                      key={name}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleOwnerSave(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsEditingOwner(false); setOwnerSearch(""); }} className="h-7 text-xs">
                Avbryt
              </Button>
              <Button size="sm" onClick={() => handleOwnerSave(ownerSearch)} disabled={!ownerSearch.trim()} className="h-7 text-xs gap-1">
                <Check className="h-3 w-3" />
                Lagre
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted/70 transition-colors group"
            onClick={() => { setIsEditingOwner(true); setOwnerSearch(ownerName || ""); }}
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {ownerName || <span className="text-muted-foreground italic">Velg eier...</span>}
              </div>
              <div className="text-xs text-muted-foreground">Arbeidsområde-eier</div>
            </div>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            <Badge variant="default" className="text-xs shrink-0">Eier</Badge>
          </div>
        )}
      </div>

      {/* Legg til ny */}
      {isAdding && (
        <div className="mb-5 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nytt medlem</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Søk eller skriv inn navn..."
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              {showSuggestions && filteredPeople.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredPeople.map((name) => (
                    <button
                      key={name}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setNewName(name); setShowSuggestions(false); }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-full sm:w-44 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_CONFIG.map(r => (
                  <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewName(""); }} className="h-7 text-xs">
              Avbryt
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || isSaving} className="h-7 text-xs gap-1">
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Legg til
            </Button>
          </div>
        </div>
      )}

      {/* Medlemmer-liste */}
      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          {members.length > 0 ? `Medlemmer (${members.length})` : "Delegerte roller"}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="space-y-2">
            {ROLE_CONFIG.filter(r => r.key !== "member").map((role) => (
              <div key={role.key} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors group">
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted">
                  <role.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{role.label}</div>
                  <div className="text-xs text-muted-foreground">{role.desc}</div>
                </div>
                <span className="text-xs text-muted-foreground italic">Ikke tildelt</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const RoleIcon = getRoleIcon(member.role);
              const isEditing = editingId === member.id;

              if (isEditing) {
                return (
                  <div key={member.id} className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate(member.id)}
                      />
                      <Select value={editRole} onValueChange={setEditRole}>
                        <SelectTrigger className="w-36 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_CONFIG.map(r => (
                            <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdate(member.id)} disabled={isSaving}>
                        <Check className="h-3 w-3 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    {member.email && (
                      <div className="text-xs text-muted-foreground pl-1">
                        E-post: {member.email}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted">
                    <RoleIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{member.person_name}</div>
                    <div className="text-xs text-muted-foreground">{ROLE_LABELS[member.role] || member.role}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => { setEditingId(member.id); setEditName(member.person_name); setEditRole(member.role); }}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
