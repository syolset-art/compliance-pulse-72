import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMynderProjects } from "@/hooks/useMynderAdmin";
import { PARTNERS } from "./adminDemoData";

const STATUS_META: Record<string, { label: string; className: string }> = {
  planned: { label: "Planlagt", className: "bg-muted text-muted-foreground" },
  active: { label: "Pågår", className: "bg-primary/10 text-primary border-primary/20" },
  delivered: { label: "Levert", className: "bg-success/10 text-success border-success/20" },
};

const EMPTY = {
  customer_name: "",
  project_name: "",
  partner_key: "",
  agreement_ref: "",
  start_date: "",
  end_date: "",
  price: 0,
  status: "planned",
  owner_name: "",
};

export function MynderProjectsView() {
  const { projects, upsert, remove } = useMynderProjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const total = projects.reduce((s, p) => s + Number(p.price || 0), 0);
  const active = projects.filter((p) => p.status === "active").length;

  const submit = async () => {
    if (!form.customer_name.trim() || !form.project_name.trim()) {
      toast.error("Kunde og prosjektnavn må fylles ut");
      return;
    }
    try {
      await upsert.mutateAsync({ ...form, partner_key: form.partner_key || null });
      toast.success("Prosjektet er lagret");
      setForm({ ...EMPTY });
      setOpen(false);
    } catch (e: any) {
      toast.error("Kunne ikke lagre", { description: e.message });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center gap-x-8 gap-y-2">
        <div>
          <div className="text-lg font-bold tabular-nums">{projects.length}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Prosjekter</div>
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums">{active}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Pågår nå</div>
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums">{total.toLocaleString("nb-NO")} kr</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Prosjektinntekt eks. mva</div>
        </div>
        <div className="ml-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nytt prosjekt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nytt kundeprosjekt</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Kunde</Label>
                  <Input
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Prosjektnavn</Label>
                  <Input
                    value={form.project_name}
                    onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slutt</Label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pris (kr)</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_META).map(([key, m]) => (
                        <SelectItem key={key} value={key}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Partner (valgfritt)</Label>
                  <Select
                    value={form.partner_key || "none"}
                    onValueChange={(v) => setForm({ ...form, partner_key: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Direkte (ingen partner)</SelectItem>
                      {PARTNERS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ansvarlig</Label>
                  <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Avtalereferanse</Label>
                  <Input
                    value={form.agreement_ref}
                    onChange={(e) => setForm({ ...form, agreement_ref: e.target.value })}
                    placeholder="F.eks. avtalenummer eller lenke"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={submit} disabled={upsert.isPending}>
                  Lagre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Kundeprosjekter</h3>
        </div>
        {projects.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Ingen prosjekter registrert ennå.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Kunde</th>
                  <th className="text-left font-medium px-4 py-2.5">Prosjekt</th>
                  <th className="text-left font-medium px-4 py-2.5">Kanal</th>
                  <th className="text-left font-medium px-4 py-2.5">Periode</th>
                  <th className="text-right font-medium px-4 py-2.5">Pris (kr)</th>
                  <th className="text-left font-medium px-4 py-2.5">Status</th>
                  <th className="text-left font-medium px-4 py-2.5">Ansvarlig</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const meta = STATUS_META[p.status] ?? STATUS_META.planned;
                  const partner = PARTNERS.find((x) => x.id === p.partner_key);
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium text-foreground">{p.customer_name}</td>
                      <td className="px-4 py-2.5">
                        <div>{p.project_name}</div>
                        {p.agreement_ref && (
                          <div className="text-xs text-muted-foreground">{p.agreement_ref}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{partner?.name ?? "Direkte"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {p.start_date ? new Date(p.start_date).toLocaleDateString("nb-NO") : "—"} –{" "}
                        {p.end_date ? new Date(p.end_date).toLocaleDateString("nb-NO") : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {Number(p.price).toLocaleString("nb-NO")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={cn("text-[11px]", meta.className)}>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.owner_name || "—"}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          title="Slett"
                          onClick={() => remove.mutate(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
