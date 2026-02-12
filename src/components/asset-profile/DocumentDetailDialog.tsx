import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BookOpen, Calendar, Clock, FileText, Send, ShieldAlert } from "lucide-react";

const EXPIRY_REASONS: Record<string, {
  title: { nb: string; en: string };
  reason: { nb: string; en: string };
  reference: string;
  recommendation: { nb: string; en: string };
  reviewFrequency: { nb: string; en: string };
}> = {
  dpia: {
    title: { nb: "Vurdering av personvernkonsekvenser (DPIA)", en: "Data Protection Impact Assessment (DPIA)" },
    reason: {
      nb: "GDPR Art. 35(11) krever at den behandlingsansvarlige gjennomgår DPIA-en når det skjer endringer i risikoen behandlingen utgjør. Europeiske tilsynsmyndigheter (EDPB) anbefaler revisjon minst hvert 1–3 år, avhengig av risikonivå. En utløpt DPIA betyr at organisasjonen ikke kan dokumentere at personvernrisikoen er vurdert i henhold til gjeldende forhold.",
      en: "GDPR Art. 35(11) requires the controller to review the DPIA when there is a change in the risk represented by processing operations. European supervisory authorities (EDPB) recommend review at least every 1–3 years depending on risk level. An expired DPIA means the organization cannot demonstrate that privacy risks have been assessed under current conditions.",
    },
    reference: "GDPR Art. 35(11), EDPB Guidelines",
    recommendation: {
      nb: "Be leverandøren om en oppdatert DPIA som reflekterer nåværende behandlingsaktiviteter, dataflyter og sikkerhetstiltak.",
      en: "Request an updated DPIA from the vendor reflecting current processing activities, data flows, and security measures.",
    },
    reviewFrequency: { nb: "Hvert 1–3 år eller ved vesentlige endringer", en: "Every 1–3 years or upon significant changes" },
  },
  dpa: {
    title: { nb: "Databehandleravtale (DPA)", en: "Data Processing Agreement (DPA)" },
    reason: {
      nb: "Databehandleravtaler bør revideres årlig for å sikre at underdatabehandlerlisten er oppdatert, sikkerhetstiltakene reflekterer nåværende praksis, og at avtalen dekker eventuelle nye behandlingsformål. En utdatert DPA kan innebære brudd på GDPR Art. 28.",
      en: "Data processing agreements should be reviewed annually to ensure the sub-processor list is current, security measures reflect current practices, and the agreement covers any new processing purposes. An outdated DPA may constitute a breach of GDPR Art. 28.",
    },
    reference: "GDPR Art. 28",
    recommendation: {
      nb: "Be om revidert DPA med oppdatert underdatabehandlerliste og sikkerhetsbeskrivelse (TOMs).",
      en: "Request a revised DPA with updated sub-processor list and security description (TOMs).",
    },
    reviewFrequency: { nb: "Årlig", en: "Annually" },
  },
  soc2: {
    title: { nb: "SOC 2-rapport", en: "SOC 2 Report" },
    reason: {
      nb: "SOC 2-rapporter dekker en definert rapporteringsperiode (vanligvis 12 måneder) og må fornyes årlig for å gi løpende bekreftelse på at leverandørens kontrollmiljø fungerer effektivt. En utløpt rapport gir ingen forsikring om nåværende sikkerhetspraksis.",
      en: "SOC 2 reports cover a defined reporting period (typically 12 months) and must be renewed annually to provide ongoing assurance that the vendor's control environment is operating effectively. An expired report provides no assurance of current security practices.",
    },
    reference: "AICPA SOC 2 Framework",
    recommendation: {
      nb: "Be leverandøren om den nyeste SOC 2 Type II-rapporten for inneværende periode.",
      en: "Request the latest SOC 2 Type II report for the current period from the vendor.",
    },
    reviewFrequency: { nb: "Årlig", en: "Annually" },
  },
  iso27001: {
    title: { nb: "ISO 27001-sertifisering", en: "ISO 27001 Certification" },
    reason: {
      nb: "ISO 27001-sertifikater er gyldige i 3 år med årlige oppfølgingsrevisjoner. Et utløpt sertifikat betyr at leverandørens informasjonssikkerhetsstyringssystem (ISMS) ikke lenger er verifisert av en uavhengig tredjepart, og sikkerhetsstatus er ukjent.",
      en: "ISO 27001 certificates are valid for 3 years with annual surveillance audits. An expired certificate means the vendor's information security management system (ISMS) is no longer verified by an independent third party, and security status is unknown.",
    },
    reference: "ISO/IEC 27001:2022",
    recommendation: {
      nb: "Be om fornyet sertifikat eller bekreftelse på at resertifiseringsprosessen er igangsatt.",
      en: "Request a renewed certificate or confirmation that the recertification process has been initiated.",
    },
    reviewFrequency: { nb: "Hvert 3. år (med årlige tilsyn)", en: "Every 3 years (with annual surveillance)" },
  },
  penetration_test: {
    title: { nb: "Penetrasjonstest", en: "Penetration Test" },
    reason: {
      nb: "Penetrasjonstester bør utføres minst årlig, og alltid etter vesentlige endringer i infrastruktur eller applikasjoner. En utdatert rapport betyr at nye sårbarheter kan ha oppstått uten å bli oppdaget, noe som utgjør en sikkerhetsrisiko.",
      en: "Penetration tests should be performed at least annually, and always after significant changes to infrastructure or applications. An outdated report means new vulnerabilities may have emerged undetected, posing a security risk.",
    },
    reference: "OWASP, NIST SP 800-115",
    recommendation: {
      nb: "Be om rapport fra nyeste penetrasjonstest, inkludert status på eventuelle funn.",
      en: "Request the latest penetration test report, including status of any findings.",
    },
    reviewFrequency: { nb: "Årlig eller ved vesentlige endringer", en: "Annually or upon significant changes" },
  },
  nda: {
    title: { nb: "Taushetserklæring (NDA)", en: "Non-Disclosure Agreement (NDA)" },
    reason: {
      nb: "Utløpte taushetserklæringer gir ingen rettslig beskyttelse av konfidensiell informasjon. Uten gyldig NDA kan delt informasjon potensielt brukes eller deles fritt av motparten.",
      en: "Expired non-disclosure agreements provide no legal protection for confidential information. Without a valid NDA, shared information can potentially be used or shared freely by the counterparty.",
    },
    reference: "Kontraktsrett / Contract Law",
    recommendation: {
      nb: "Be om signering av fornyet NDA før ytterligere konfidensiell informasjon deles.",
      en: "Request signing of a renewed NDA before sharing further confidential information.",
    },
    reviewFrequency: { nb: "Ved utløp eller ved nye samarbeid", en: "Upon expiry or new collaborations" },
  },
  other: {
    title: { nb: "Dokument", en: "Document" },
    reason: {
      nb: "Dokumentet har passert sin gyldighetsperiode og bør gjennomgås for å sikre at innholdet fortsatt er korrekt og relevant.",
      en: "The document has passed its validity period and should be reviewed to ensure its content is still accurate and relevant.",
    },
    reference: "Intern policy / Internal policy",
    recommendation: {
      nb: "Be om oppdatert versjon av dokumentet.",
      en: "Request an updated version of the document.",
    },
    reviewFrequency: { nb: "Avhengig av dokumenttype", en: "Depends on document type" },
  },
};

interface DocumentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    file_name: string;
    document_type: string;
    valid_from: string | null;
    valid_to: string | null;
    version: string | null;
    notes: string | null;
  } | null;
  onRequestUpdate: (docType: string) => void;
}

export function DocumentDetailDialog({ open, onOpenChange, document, onRequestUpdate }: DocumentDetailDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  if (!document) return null;

  const info = EXPIRY_REASONS[document.document_type] || EXPIRY_REASONS.other;
  const locale = isNb ? "nb-NO" : "en-US";

  const validTo = document.valid_to ? new Date(document.valid_to) : null;
  const now = new Date();
  const daysExpired = validTo ? Math.ceil((now.getTime() - validTo.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpired = validTo && daysExpired > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            {isNb ? info.title.nb : info.title.en}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document meta */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary" className="text-xs">{document.file_name}</Badge>
            {document.version && <Badge variant="outline" className="text-xs">{document.version}</Badge>}
            {isExpired && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {isNb ? `Utløpt ${daysExpired}d siden` : `Expired ${daysExpired}d ago`}
              </Badge>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            {document.valid_from && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {isNb ? "Fra" : "From"}: {new Date(document.valid_from).toLocaleDateString(locale)}
              </span>
            )}
            {validTo && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {isNb ? "Til" : "To"}: {validTo.toLocaleDateString(locale)}
              </span>
            )}
          </div>

          {/* Why expired */}
          {isExpired && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 text-destructive">
                <ShieldAlert className="h-4 w-4" />
                {isNb ? "Hvorfor er dette utdatert?" : "Why is this outdated?"}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isNb ? info.reason.nb : info.reason.en}
              </p>
            </div>
          )}

          {/* Reference & frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {isNb ? "Referanse" : "Reference"}
              </span>
              <p className="text-xs font-medium">{info.reference}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isNb ? "Revisjonshyppighet" : "Review frequency"}
              </span>
              <p className="text-xs font-medium">{isNb ? info.reviewFrequency.nb : info.reviewFrequency.en}</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg border bg-primary/5 border-primary/20 p-3 space-y-1">
            <h4 className="text-xs font-semibold text-primary">
              {isNb ? "Anbefalt handling" : "Recommended action"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isNb ? info.recommendation.nb : info.recommendation.en}
            </p>
          </div>

          {document.notes && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{isNb ? "Notater" : "Notes"}:</span> {document.notes}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {isNb ? "Lukk" : "Close"}
          </Button>
          {isExpired && (
            <Button size="sm" onClick={() => { onOpenChange(false); onRequestUpdate(document.document_type); }}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {isNb ? "Be om oppdatering" : "Request update"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
