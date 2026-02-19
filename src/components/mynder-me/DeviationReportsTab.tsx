import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, X, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { deviationCategories, getCategoryById, criticalityOptions } from "@/lib/deviationCategories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DeviationReport {
  id: string;
  employee_token: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  location: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Ny", variant: "destructive" },
  in_review: { label: "Under vurdering", variant: "default" },
  approved: { label: "Godkjent", variant: "secondary" },
  rejected: { label: "Avvist", variant: "outline" },
};

export function DeviationReportsTab() {
  const [reports, setReports] = useState<DeviationReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DeviationReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchReports = async () => {
    const { data } = await supabase
      .from("employee_deviation_reports")
      .select("*")
      .order("created_at", { ascending: false });
    setReports((data as DeviationReport[]) || []);
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const update: Record<string, unknown> = {
      status,
      processed_at: new Date().toISOString(),
      processed_by: "admin",
    };
    if (notes) update.admin_notes = notes;

    await supabase.from("employee_deviation_reports").update(update).eq("id", id);
    toast.success(status === "approved" ? "Rapport godkjent – opprett avvik manuelt" : "Rapport oppdatert");
    setSelectedReport(null);
    fetchReports();
  };

  const newCount = reports.filter(r => r.status === "new").length;

  const getSeverityBadge = (severity: string) => {
    const opt = criticalityOptions.find(o => o.value === severity);
    if (!opt) return <Badge variant="secondary">{severity}</Badge>;
    return <Badge className={`${opt.bgColor} ${opt.color} border-0`}>{opt.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Avviksmeldinger fra ansatte
          {newCount > 0 && (
            <Badge variant="destructive" className="ml-2">{newCount} nye</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Ingen avviksmeldinger mottatt fra ansatte ennå.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dato</TableHead>
                <TableHead>Tittel</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Alvorlighet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => {
                const cat = getCategoryById(report.category);
                const CatIcon = cat?.icon;
                const st = statusConfig[report.status] || statusConfig.new;
                return (
                  <TableRow key={report.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(report.created_at), "d. MMM yyyy HH:mm", { locale: nb })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{report.title}</p>
                        {report.location && (
                          <p className="text-xs text-muted-foreground">📍 {report.location}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {CatIcon && <CatIcon className={`h-4 w-4 ${cat?.color}`} />}
                        <span className="text-sm">{cat?.label || report.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ""); }}>
                          <Eye className="h-3 w-3 mr-1" /> Vis
                        </Button>
                        {report.status === "new" && (
                          <>
                            <Button size="sm" className="h-7 text-xs" onClick={() => updateStatus(report.id, "approved")}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Godkjenn
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(report.id, "rejected")}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Detail dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avviksmelding fra ansatt</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Tittel</Label>
                  <p className="font-medium">{selectedReport.title}</p>
                </div>
                {selectedReport.description && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Beskrivelse</Label>
                    <p className="text-sm">{selectedReport.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Kategori</Label>
                    <p className="text-sm">{getCategoryById(selectedReport.category)?.label || selectedReport.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Alvorlighet</Label>
                    <div className="mt-1">{getSeverityBadge(selectedReport.severity)}</div>
                  </div>
                </div>
                {selectedReport.location && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Sted</Label>
                    <p className="text-sm">{selectedReport.location}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground text-xs">Rapportert</Label>
                  <p className="text-sm">{format(new Date(selectedReport.created_at), "d. MMM yyyy HH:mm", { locale: nb })}</p>
                </div>
                <div>
                  <Label>Admin-notater</Label>
                  <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Legg til notater..." />
                </div>
                <div className="flex gap-2">
                  {selectedReport.status === "new" && (
                    <>
                      <Button className="flex-1" onClick={() => updateStatus(selectedReport.id, "approved", adminNotes)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Godkjenn og opprett avvik
                      </Button>
                      <Button variant="outline" onClick={() => updateStatus(selectedReport.id, "rejected", adminNotes)}>
                        <X className="h-4 w-4 mr-1" /> Avvis
                      </Button>
                    </>
                  )}
                  {selectedReport.status !== "new" && (
                    <Button variant="outline" className="w-full" onClick={() => updateStatus(selectedReport.id, selectedReport.status, adminNotes)}>
                      Lagre notater
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
