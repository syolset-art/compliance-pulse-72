import { useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, FileCheck, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LEVELS = [
  { level: 0, label: "Ikke startet", pct: "0 %" },
  { level: 1, label: "Planlagt", pct: "25 %" },
  { level: 2, label: "Dokumentert", pct: "50 %" },
  { level: 3, label: "Implementert", pct: "75 %" },
  { level: 4, label: "Verifisert (krever bevis)", pct: "100 %" },
];

const AREAS = [
  { name: "Driftssikkerhet", q: "Fungerer sikkerheten i praksis?", weight: "30 %" },
  { name: "Styring og ansvar", q: "Hvem har ansvaret, og er det nedskrevet?", weight: "25 %" },
  { name: "Personvern", q: "Har vi kontroll på personopplysninger?", weight: "20 %" },
  { name: "Identitet og tilgang", q: "Hvem har tilgang til hva?", weight: "15 %" },
  { name: "Leverandørstyring", q: "Har vi kontroll på tredjeparter?", weight: "10 %" },
];

const FAQ_GENERAL = [
  {
    q: "Kan en leverandør pynte på sin egen score?",
    a: "Nei. Bevis må bekreftes av en ansvarlig hos kunden, ikke av leverandøren. Leverandøren ser aldri hvor mye et bevis teller, ubekreftede utkast teller null, og negative funn trekker ned.",
  },
  {
    q: "Betyr en høy score at leverandøren er «godkjent»?",
    a: "Nei. Scoren viser dokumentert modenhet akkurat nå. Den er beslutningsstøtte — beslutningen ligger hos kunden.",
  },
  {
    q: "Hvor lenge gjelder et bevis?",
    a: "Det varierer: en penetrasjonstest rundt 15 måneder, en revisjon rundt 36 måneder. Hendelser blir stående. Foreldet bevis slutter å telle, så scoren må holdes oppdatert.",
  },
  {
    q: "Hvorfor er tallet til å stole på?",
    a: "Det regnes likt hver gang, kan spores ned til hvert kontrollpunkt og bevis, og bevis bekreftes av en navngitt person med dato.",
  },
  {
    q: "Hvem bestemmer egentlig tallet — er det en AI?",
    a: "AI setter et nøytralt utgangspunkt fra offentlig informasjon. Et menneske hos kunden bekrefter bevisene og kan overstyre. Mennesket er med hele veien.",
  },
  {
    q: "Hva er forskjellen på en Mynder-score og en ISO-sertifisering?",
    a: "En ISO-sertifisering er en formell attest på ett tidspunkt. Mynder-scoren måler dokumentert modenhet løpende. En ISO-sertifisering er samtidig et av de sterkeste bevisene som løfter scoren.",
  },
  {
    q: "Deler Mynder bevisene eller dataene våre med andre?",
    a: "Nei. Det en kunde legger inn er privat for den kunden. Andre kunder ser ikke funnene, og leverandøren ser bare at bevis finnes.",
  },
];

const FAQ_BUYER = [
  {
    q: "Hva er en god score?",
    a: "Det avhenger av hvor kritisk leverandøren er: 80 % for kritisk, 70 % for høy, 60 % for middels, 50 % for lav. Se også på hvor mye som faktisk er vurdert (dekningsgrad).",
  },
  {
    q: "Kan vi sette egne krav til leverandørene våre?",
    a: "Ja. Dere kan kreve et eget sett kontrollpunkter med minimumsnivå. Mynder viser gapet mot kravene deres.",
  },
  {
    q: "Hva skjer med scoren hvis en leverandør får en hendelse eller et avvik?",
    a: "Negative funn trekker scoren ned, like forutsigbart som positive bevis løfter den. Registrerte hendelser blir stående.",
  },
  {
    q: "Hvor ofte oppdateres scoren?",
    a: "Når nytt bevis legges til og bekreftes. Bevis blir også foreldet over tid, så tallet speiler det som gjelder nå.",
  },
];

const FAQ_PROFILE = [
  {
    q: "Hva ser jeg selv av min egen profil?",
    a: "Ditt nøytrale utgangspunkt og at det finnes bevis knyttet til deg — ikke kundens interne vurderinger eller hvor mye hvert bevis teller.",
  },
  {
    q: "Hvordan kan jeg forbedre scoren min?",
    a: "Hev nivået på kontrollpunkter, legg ved bevis, og skaff sterke bevis som tredjepartsrevisjon eller sertifisering. Akkrediterte revisjoner løfter mest.",
  },
  {
    q: "Hvorfor kan scoren endre seg når jeg legger til mer informasjon?",
    a: "Fordi tallet da hviler på et mer komplett bilde. Når flere punkter vurderes, blir scoren mer presis. Det er ikke en feil.",
  },
];

function FaqSection({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</h3>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, idx) => (
          <AccordionItem key={idx} value={`${title}-${idx}`} className="border-border">
            <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

const MaturityMethodology = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-16">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake
        </Button>

        {/* Hero */}
        <header className="space-y-4">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Hvordan Mynder-scoren fungerer
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Bygget på bekreftede bevis, ikke påstander.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            En Mynder-score viser hvor moden en organisasjon er på personvern, sikkerhet og samsvar.
            Tallet kan forklares helt ned til hvert kontrollpunkt, og er laget for å ikke kunne pyntes
            på. Et høyt tall betyr at mye er dokumentert akkurat nå — det er ikke en garanti.
            Beslutningen ligger alltid hos kunden.
          </p>
        </header>

        {/* How it's built */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Slik bygges scoren</h2>
          <p className="text-muted-foreground leading-relaxed">
            Hvert regelverk gir kontrollpunkter som fordeles i fem faste kontrollområder — vektet
            etter bransje og kritikalitet.
          </p>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                {[
                  { icon: FileCheck, label: "Regelverk", sub: "GDPR, NIS2, ISO …" },
                  { icon: Layers, label: "Kontrollpunkter", sub: "Med nivå 0–4" },
                  { icon: ShieldCheck, label: "5 områder", sub: "Vektet etter bransje" },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-muted/40"
                  >
                    <step.icon className="h-5 w-5 text-primary" />
                    <div className="text-sm font-medium text-foreground">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.sub}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Levels */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">De fem nivåene</h2>
          <p className="text-muted-foreground leading-relaxed">
            Hvert kontrollpunkt får et nivå fra 0 til 4. Nivået blir prosent ved å dele på 4.
          </p>
          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nivå</TableHead>
                  <TableHead>Hva det betyr</TableHead>
                  <TableHead className="w-24 text-right">Prosent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LEVELS.map((l) => (
                  <TableRow key={l.level}>
                    <TableCell className="font-medium">{l.level}</TableCell>
                    <TableCell>{l.label}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{l.pct}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Areas */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">De fem områdene og vekten</h2>
          <p className="text-muted-foreground leading-relaxed">
            Kontrollpunktene samles i fem områder. Noen områder teller mer fordi de betyr mest for
            tillit i regulerte bransjer. Hvis et område ikke gjelder, tas det ut og vekten fordeles
            på resten.
          </p>
          <Card className="border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Område</TableHead>
                  <TableHead>Spørsmålet det svarer på</TableHead>
                  <TableHead className="w-20 text-right">Vekt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AREAS.map((a) => (
                  <TableRow key={a.name}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.q}</TableCell>
                    <TableCell className="text-right">{a.weight}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* FAQ */}
        <section className="space-y-8">
          <h2 className="text-xl font-semibold text-foreground">Spørsmål og svar</h2>
          <FaqSection title="Generelt" items={FAQ_GENERAL} />
          <FaqSection title="For deg som vurderer en leverandør" items={FAQ_BUYER} />
          <FaqSection title="For deg som har en Trust Profile" items={FAQ_PROFILE} />
        </section>

        {/* Footnote */}
        <footer className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            De fem kontrollområdene er inspirert av PECB — internasjonalt sertifiseringsorgan for
            ISO-standarder innen styring, sikkerhet og personvern.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default MaturityMethodology;
