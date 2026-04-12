import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Crown,
  Monitor,
  
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
  { key: "member", label: "Medlem", desc: "Generelt medlem av arbeidsområdet", icon: UsersIcon },
] as const;

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
  const [ownerSearch, setOwnerSearch] = useState(ownerName || "");

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

  const handleRoleChange = async (id: string, newRoleValue: string) => {
    try {
      const { error } = await supabase
        .from("work_area_members")
        .update({ role: newRoleValue })
        .eq("id", id);
      if (error) throw error;
      setMembers(members.map(m => m.id === id ? { ...m, role: newRoleValue } : m));
      toast.success("Rolle oppdatert");
    } catch {
      toast.error("Kunne ikke oppdatere rolle");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("work_area_members")
        .update({ person_name: editName.trim() })
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
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 shrink-0">
            <Crown className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 relative">
            <Input
              value={ownerSearch}
              onChange={(e) => { setOwnerSearch(e.target.value); setShowOwnerSuggestions(true); }}
              onFocus={() => { setShowOwnerSuggestions(true); if (!ownerSearch) setOwnerSearch(ownerName || ""); }}
              onBlur={() => {
                setTimeout(() => {
                  setShowOwnerSuggestions(false);
                  // If user cleared input, revert
                  if (!ownerSearch.trim() && ownerName) setOwnerSearch(ownerName);
                }, 200);
              }}
              placeholder="Velg eier..."
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && ownerSearch.trim()) handleOwnerSave(ownerSearch);
              }}
            />
            {showOwnerSuggestions && ownerSuggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                {ownerSuggestions.map((name) => (
                  <button
                    key={name}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { handleOwnerSave(name); setOwnerSearch(name); }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Badge variant="default" className="text-xs shrink-0">Eier</Badge>
        </div>
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

              return (
                <div key={member.id} className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted shrink-0">
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 h-7 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdate(member.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => handleUpdate(member.id)} disabled={isSaving}>
                            <Check className="h-3 w-3 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{member.person_name}</div>
                            {member.email && (
                              <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 shrink-0"
                            onClick={() => { setEditingId(member.id); setEditName(member.person_name); }}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Badge className="text-xs shrink-0 bg-primary/15 text-primary border-primary/20">Medlem</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
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
