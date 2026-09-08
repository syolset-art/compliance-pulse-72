/**
 * Rapport: KI-agentregister mot ISO/IEC 42001 og EU AI Act.
 * Gjenbruker eksisterende kartlegging – ingen ny datainnsamling.
 */

import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Bot, Printer, CheckCircle2, AlertTriangle, Info, Users, ShieldCheck,
} from "lucide-react";
import { useAgentGovernanceReport, type AgentGovernanceRow } from "@/hooks/useAgentGovernanceReport";
import { aiActRiskLabel, aiActRiskClass, ISO_42001_AREAS } from "@/lib/aiActClassification";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("nb-NO", { day: "2-digit", month: "short", year: "numeric" }) : "–";

const SummaryTile = ({ label, value, tone }: { label: string; value: number; tone?: "warn" }) => (
  <Card>
    <CardContent className="p-4">
      <div className={`text-2xl font-semibold ${tone === "warn" ? "text-warning" : "text-foreground"}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

const AgentRowLink = ({ row }: { row: AgentGovernanceRow }) => {
  const navigate = useNavigate();
  const target = row.href ?? (row.processes[0] ? `/processes/${row.processes[0].id}?tab=haio` : null);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={!target}
      onClick={() => target && navigate(target)}
    >
      Se agent
    </Button>
  );
};

export default function AgentGovernanceReport() {
  const navigate = useNavigate();
  const { rows, summary, isLoading } = useAgentGovernanceReport();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate("/reports/all")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Rapporter
              </Button>
              <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
                <Bot className="h-5 w-5 text-primary" /> KI-agenter
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Oversikt over alle KI-agenter som er foreslått eller satt i arbeid, med styringsinformasjon
                etter ISO/IEC 42001 og EU AI Act. Vurderingene er utkast fra kartleggingen og må bekreftes
                av et menneske.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Skriv ut / PDF
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <Bot className="h-8 w-8 text-muted-foreground" />
                <div className="font-medium">Ingen KI-agenter registrert</div>
                <p className="max-w-md text-sm text-muted-foreground">
                  Når dere kartlegger KI-muligheter på et arbeidsområde, dukker agentene opp her med
                  vurdering mot ISO/IEC 42001 og EU AI Act.
                </p>
                <Button onClick={() => navigate("/work-areas")}>Kartlegg KI-muligheter</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryTile label="KI-agenter totalt" value={summary.total} />
                <SummaryTile label="Satt i arbeid" value={summary.established} />
                <SummaryTile label="Behandler personopplysninger" value={summary.personalData} />
                <SummaryTile label="Mangler mandat, kontroll eller logging" value={summary.missingControl} tone="warn" />
              </div>

              <Tabs defaultValue="register">
                <TabsList>
                  <TabsTrigger value="register">Agentregister</TabsTrigger>
                  <TabsTrigger value="aiact">EU AI Act</TabsTrigger>
                  <TabsTrigger value="iso">ISO/IEC 42001</TabsTrigger>
                </TabsList>

                <TabsContent value="register" className="mt-4">
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Agent</TableHead>
                              <TableHead>Arbeidsområde</TableHead>
                              <TableHead>Prosess</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Kontrollnivå</TableHead>
                              <TableHead>Ansvarlig</TableHead>
                              <TableHead>Sist endret</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {r.name}
                                    {r.shared && (
                                      <Badge variant="outline" className="gap-1 text-[0.7rem]">
                                        <Users className="h-3 w-3" /> Delt ({r.workAreas.length})
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {r.workAreas.map((w) => w.name).join(", ") || "–"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {r.processes.map((p) => p.name).join(", ") || "–"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={r.established
                                      ? "bg-success/15 text-success border-success/30"
                                      : "bg-muted text-muted-foreground"}
                                  >
                                    {r.established ? "Satt i arbeid" : "Forslag"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{r.controlLevel}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{r.owner}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{fmtDate(r.updatedAt)}</TableCell>
                                <TableCell className="text-right"><AgentRowLink row={r} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="aiact" className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Risikonivået er utledet av kartleggingen: om prosessen behandler personopplysninger,
                    hvilken risikokategori den har, og om agenten kan handle selv. Begrunnelsen vises alltid.
                  </p>
                  {rows.map((r) => (
                    <Card key={r.id}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle className="text-base">{r.name}</CardTitle>
                          <Badge variant="outline" className={aiActRiskClass(r.aiAct.risk)}>
                            {aiActRiskLabel(r.aiAct.risk)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.aiAct.rationale}</p>
                      </CardHeader>
                      <CardContent className="grid gap-2 sm:grid-cols-3">
                        {r.duties.map((d) => (
                          <div
                            key={d.key}
                            className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5"
                          >
                            {d.ok ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                            ) : (
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                            )}
                            <div>
                              <div className="text-sm font-medium">{d.label}</div>
                              <div className="text-xs text-muted-foreground">{d.detail}</div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="iso" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Dekning mot ISO/IEC 42001
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Grønt betyr at kartleggingen dekker kravområdet for agenten. Gult betyr at noe mangler.
                      </p>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <TooltipProvider>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Agent</TableHead>
                                {ISO_42001_AREAS.map((a) => (
                                  <TableHead key={a.key} className="text-center text-xs">
                                    <Tooltip>
                                      <TooltipTrigger className="inline-flex items-center gap-1">
                                        {a.label}
                                        <Info className="h-3 w-3 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        Punkt {a.clause}. {a.description}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows.map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell className="font-medium">{r.name}</TableCell>
                                  {r.iso.map((c) => (
                                    <TableCell key={c.key} className="text-center">
                                      <Tooltip>
                                        <TooltipTrigger>
                                          {c.covered ? (
                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                          ) : (
                                            <AlertTriangle className="h-4 w-4 text-warning" />
                                          )}
                                          <span className="sr-only">{c.note}</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">{c.note}</TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <p className="text-xs text-muted-foreground">
                Rapporten er et styringsoverblikk, ikke en samsvarserklæring. Mandat og policyer dokumenteres
                i prototypen, men håndheves ikke automatisk.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
