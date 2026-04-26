import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Database, Mail, Shield, User, Bot, UserCheck, Building2 } from "lucide-react";

const roles = [
  {
    color: "bg-status-closed",
    borderColor: "border-status-closed",
    textColor: "text-status-closed dark:text-status-closed",
    bgLight: "bg-status-closed/10 dark:bg-green-950/30",
    name: "Karl / Virksomheten",
    icon: User,
    tag: "Grønn",
    description: "Bruker Mynder Core til å kartlegge alle systemer og leverandører. Oppretter og vedlikeholder egne data i Trust Profiler. Sender forespørsler til underleverandører om dokumentasjon (DPA, sertifikater, etc.).",
    dataExamples: ["Leverandørnavn, kontaktinfo, kategori", "Risikovurdering og kritikalitet", "Manuelle notater og vurderinger"],
  },
  {
    color: "bg-gray-900 dark:bg-gray-300",
    borderColor: "border-gray-900 dark:border-gray-300",
    textColor: "text-gray-900 dark:text-gray-200",
    bgLight: "bg-gray-100 dark:bg-gray-800/40",
    name: "Lara / AI",
    icon: Bot,
    tag: "Sort",
    description: "AI-generert innhold fra Lara. Automatisk klassifisering av leverandører, risikovurdering, forslag til relevante regelverk og compliance-krav. Genererer anbefalinger basert på data i profilen.",
    dataExamples: ["Automatisk vendor-kategori (SaaS, konsulent, etc.)", "Foreslåtte regelverk (GDPR, ISO 27001)", "Risikoklassifisering og compliance-score"],
  },
  {
    color: "bg-primary",
    borderColor: "border-primary",
    textColor: "text-primary dark:text-primary",
    bgLight: "bg-primary/10 dark:bg-blue-950/30",
    name: "Tobby / Kontakt opprettet",
    icon: UserCheck,
    tag: "Blå",
    description: "En Trust Profil er opprettet med kontaktinformasjon, men eieren har ikke tatt eierskap ennå. Ingen forespørsler er sendt eller mottatt. Profilen er i \"ventende\"-tilstand.",
    dataExamples: ["Kontakt-e-post og navn", "Org.nummer (fra Brreg)", "Ingen dokumenter eller svar ennå"],
  },
  {
    color: "bg-destructive",
    borderColor: "border-destructive",
    textColor: "text-destructive dark:text-destructive",
    bgLight: "bg-destructive/10 dark:bg-red-950/30",
    name: "Underleverandør / Eier av TP",
    icon: Building2,
    tag: "Rød",
    description: "Eieren av Trust Profilen som har tatt eierskap. Kan svare på forespørsler, laste opp dokumenter direkte i sin TP, og administrere sin egen compliance-status. Aktiv samhandling med Karl.",
    dataExamples: ["Opplastede sertifikater og DPA-er", "Svar på compliance-forespørsler", "Egne vurderinger og dokumentasjon"],
  },
];

const dataModelTables = [
  { table: "assets", description: "Hovedtabell for alle eiendeler inkl. leverandører (asset_type = 'vendor') og egen profil (asset_type = 'self')", keyFields: "id, name, asset_type, vendor_category, compliance_score, publish_mode" },
  { table: "vendor_documents", description: "Dokumenter tilknyttet en leverandør-TP – DPA, sertifikater, policies etc.", keyFields: "id, asset_id, document_type, title, file_path, status, uploaded_by" },
  { table: "asset_relationships", description: "Relasjoner mellom assets – f.eks. system → leverandør, leverandør → underleverandør", keyFields: "id, source_asset_id, target_asset_id, relationship_type" },
  { table: "customer_compliance_requests", description: "Forespørsler sendt til/fra kunder og leverandører om compliance-dokumentasjon", keyFields: "id, customer_name, customer_email, request_type, status, shared_mode" },
  { table: "lara_inbox", description: "Innkommende dokumenter fra e-post/integrasjoner som Lara klassifiserer automatisk", keyFields: "id, sender_email, subject, matched_asset_id, matched_document_type, status" },
];

const lifecycleSteps = [
  { step: 1, title: "Opprettelse", color: "bg-primary", desc: "Karl oppretter en ny leverandør i Mynder. Lara beriker automatisk med data fra Brreg og foreslår kategori." },
  { step: 2, title: "AI-berikning", color: "bg-gray-900 dark:bg-gray-300", desc: "Lara klassifiserer leverandøren, foreslår relevante regelverk, og beregner en initial risikoscore." },
  { step: 3, title: "Forespørsel sendt", color: "bg-status-closed", desc: "Karl sender en compliance-forespørsel (f.eks. DPA) til leverandørens kontakt-e-post." },
  { step: 4, title: "E-post mottatt", color: "bg-primary", desc: "Tobby mottar e-post med info om at Karl i Grønt Selskap ønsker dokumentasjon." },
  { step: 5, title: "Valg: E-post eller TP", color: "bg-destructive", desc: "Tobby kan svare via e-post (dokumentet havner i Lara Inbox) eller overta sin Trust Profil og registrere direkte." },
  { step: 6, title: "Aktiv samhandling", color: "bg-destructive", desc: "Underleverandøren administrerer sin TP aktivt – laster opp dokumenter, oppdaterer sertifikater, svarer på forespørsler." },
];

export default function TrustProfileArchitecture() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto px-6 py-8 space-y-10">
          {/* Header */}
          <div>
            <Badge variant="outline" className="mb-2">Utviklerdokumentasjon</Badge>
            <h1 className="text-3xl font-bold text-foreground">Trust Profile – Arkitektur & Datamodell</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              Denne siden forklarer logikken bak Trust Profiles i Mynder – hvem som genererer hvilke data, 
              livssyklusen til en profil, og hvordan forespørselsflyten fungerer mellom virksomheten og dens underleverandører.
            </p>
          </div>

          {/* Section 1: Roller */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Roller og dataflyt
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <Card key={role.tag} variant="flat" className={`${role.bgLight} border-l-4 ${role.borderColor}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full ${role.color} flex items-center justify-center`}>
                        <role.icon className="h-4 w-4 text-white dark:text-gray-900" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{role.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-0.5">{role.tag}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <div>
                      <p className="text-xs font-medium text-foreground/80 mb-1">Eksempler på data:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {role.dataExamples.map((ex, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${role.color} shrink-0`} />
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Section 2: Livssyklus */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Livssyklus for en Trust Profil
            </h2>
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lifecycleSteps.map((s) => (
                  <Card key={s.step} variant="flat" className="relative">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-8 w-8 rounded-full ${s.color} flex items-center justify-center text-white dark:text-gray-900 text-sm font-bold`}>
                          {s.step}
                        </div>
                        <h3 className="font-medium text-foreground">{s.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Forespørselsflyt */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Forespørselsflyt
            </h2>
            <Card variant="flat">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-status-closed/10 dark:bg-green-950/30 border border-status-closed/20 dark:border-status-closed rounded-lg px-4 py-3">
                    <User className="h-5 w-5 text-status-closed" />
                    <div>
                      <p className="font-medium text-status-closed dark:text-status-closed">Karl</p>
                      <p className="text-xs text-muted-foreground">Sender forespørsel om DPA</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3 border">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">E-post sendes</p>
                      <p className="text-xs text-muted-foreground">«Karl i Grønt Selskap ønsker en DPA»</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  <div className="flex items-center gap-2 bg-primary/10 dark:bg-blue-950/30 border border-primary/20 dark:border-primary rounded-lg px-4 py-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-primary dark:text-primary">Tobby</p>
                      <p className="text-xs text-muted-foreground">Mottar e-post</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card variant="flat" className="bg-muted/50 border-dashed">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Alternativ A: Svar via e-post
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Tobby sender dokumentet som e-postvedlegg. Lara plukker det opp i Inbox, 
                        klassifiserer det automatisk, og kobler det til riktig Trust Profil.
                      </p>
                    </CardContent>
                  </Card>
                  <Card variant="flat" className="bg-destructive/10/50 dark:bg-red-950/20 border-destructive/20 dark:border-destructive">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-1 flex items-center gap-2 text-destructive dark:text-destructive">
                        <Shield className="h-4 w-4" /> Alternativ B: Overta Trust Profilen
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Tobby klikker lenken i e-posten, tar eierskap til sin TP, og laster opp 
                        dokumenter direkte. Blir til «rød» rolle med full tilgang til sin profil.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 4: Datamodell */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Datamodell
            </h2>
            <Card variant="flat">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Tabell</TableHead>
                      <TableHead>Beskrivelse</TableHead>
                      <TableHead className="w-[300px]">Nøkkelfelt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataModelTables.map((t) => (
                      <TableRow key={t.table}>
                        <TableCell className="font-mono text-sm font-medium">{t.table}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.description}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{t.keyFields}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* Section 5: Virksomhetens egen profil */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Virksomhetens egen profil (Self)
            </h2>
            <Card variant="flat" className="bg-status-closed/10/50 dark:bg-green-950/20 border-status-closed/20 dark:border-status-closed">
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">asset_type = 'self'</code> representerer 
                  virksomhetens egen compliance-status. Den opprettes automatisk under onboarding og er alltid synlig i sidemenyen.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-closed shrink-0" />
                    Skjuler leverandør-spesifikke handlinger som «Be om oppdatering»
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-closed shrink-0" />
                    Har en «Forhåndsvisning»-knapp for å se profilen slik kunder ser den
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-closed shrink-0" />
                    Inkluderer publiseringsinnstillinger og kundeforespørsels-håndtering
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-closed shrink-0" />
                    Automatisk «Mynder Partner»-merking for verifiserte forhandlere
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
