import { Users, Crown } from "lucide-react";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";

interface WorkAreaMembersHelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkAreaMembersHelpDrawer({ open, onOpenChange }: WorkAreaMembersHelpDrawerProps) {
  return (
    <ContextualHelpPanel
      open={open}
      onOpenChange={onOpenChange}
      icon={Users}
      title="Roller i arbeidsområdet"
      description="Hvert arbeidsområde har en tydelig rollestruktur som sikrer at ansvar er fordelt og at riktige personer har oversikt over sitt område."
      itemsHeading="Rollene forklart"
      items={[
        {
          icon: Crown,
          title: "Eier",
          description:
            "Eieren har det overordnede ansvaret for arbeidsområdet. Dette er en obligatorisk rolle — hvert arbeidsområde må ha én eier. Eieren er ansvarlig for at systemer, prosesser og leverandører er dokumentert og i samsvar med gjeldende regelverk.",
        },
        {
          icon: Users,
          title: "Medlem",
          description:
            "Medlemmer er personer som er tilknyttet arbeidsområdet og bidrar i det daglige arbeidet. De kan ha ulike oppgaver, men har ikke det overordnede ansvaret som eieren har.",
        },
      ]}
      whyTitle="Hvorfor er dette viktig?"
      whyDescription="En tydelig rollefordeling gjør det enklere å vite hvem som har ansvar for hva, og sikrer at ingen oppgaver faller mellom stolene. Det er også viktig for revisjon og etterlevelse at ansvar er dokumentert."
      stepsHeading="Tips"
      steps={[
        { text: "Velg en eier som har reell beslutningsmyndighet for området" },
        { text: "Legg til alle relevante personer som medlemmer" },
        { text: "Hold listen oppdatert når ansatte bytter rolle eller avdeling" },
      ]}
      laraSuggestion="Hjelp meg å forstå roller og ansvar i arbeidsområder"
    />
  );
}
