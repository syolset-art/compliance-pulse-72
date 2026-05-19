# Inline Lara-aktivering av Trust Profile

I dag åpnes `ActivateTrustProfileWizard` som modalt vindu over `/trust-center/profile`. Vi beholder all logikk i wizarden (org-oppslag, Lara-skann, bekreft, modenhet, dokumenter, synlighet, seeding), men endrer presentasjonen til en samtale-aktig Lara-flyt rett på siden, og lar profilen tone inn til slutt.

## Endringer

### 1. Ny inline-presentasjon i `ActivateTrustProfileWizard`
- Legg til ny presentation-modus `presentation: "modal" | "conversation"` (default `modal` for bakoverkompatibilitet). `conversation` brukes fra Trust Profile-siden.
- I `conversation`-modus rendres wizarden uten `Dialog`-wrapper, som en vertikal samtaletråd:
  - Venstre: Lara-avatar + meldingsboble (`bg-muted/40`, deep purple aksent) med tekst som forklarer hva hun gjør i steget.
  - Høyre: brukerens svar/skjema i en lysere boble (`bg-background border`), justert til høyre.
  - Ett aktivt steg av gangen vises nederst. Tidligere steg kollapses til en kort oppsummerings-melding ("Bekreftet org.nr 123 456 789 — Acme AS") slik at samtalen vokser nedover.
- Steg-overskrifter (`STEP_LABELS`) skrives som Lara-meldinger i samtaleform i stedet for wizard-header. Progress vises som diskret prikkrekke (6 prikker) øverst — ingen `Progress`-bar.
- Knappene "Tilbake/Neste" rendres inline under det aktive svaret, i samtalens høyre kolonne.
- Lara-skann-steget (steg 2) beholder eksisterende animasjon, men pakkes inn som en Lara-melding der hun viser hva hun finner mens den skanner.

### 2. Avslutning som faser inn profilen
- Når siste steg fullføres, kall eksisterende `seedFromActivation` + `onCompleted` som i dag.
- Vis en siste Lara-melding: "Klar! Her er Trust Profile-en din." med en grønn `CheckCircle2`.
- Etter ~900 ms fader hele samtale-blokken ut (`opacity` + `translate-y`), og `TrustCenterProfile` rendrer den aktive profilen på samme side med en kort fade-in (`animate-in fade-in duration-500`). Ingen full sidelast eller navigasjon.

### 3. Tilpasninger i `src/pages/TrustCenterProfile.tsx`
- Fjern modal-åpning fra "locked landing"-tilstanden (linje 261–330). Erstatt CTA-kortet med en kompakt intro + `ActivateTrustProfileWizard` rendret inline (`presentation="conversation"`, `inline={true}`).
- Behold "Les mer" / `ContextualHelpPanel`.
- Behold `useEffect`-en som auto-åpner ved første besøk — i conversation-modus betyr det bare at flyten allerede er synlig (ingen modal å åpne); fjern `setShowActivateWizard(true)` der det ikke trengs.
- Behold ekstern trigger `open-activate-trust-wizard` og `?activate=1` — scroll i stedet til samtaletråden.
- Lokal state `justActivated` styrer overgangsanimasjonen: settes av `onCompleted`, brukes til å fade ut samtale-blokken før `isActivated` flippes.

### 4. Holdes uendret
- All datalogikk i `ActivateTrustProfileWizard` (Brreg-oppslag, scan-steg, modenhetsspørsmål, dokumentslots, synlighetsvalg, seeding).
- Modal-bruken andre steder (om noen) — `presentation` defaulter til `modal`.
- Trust Profile-innholdet etter aktivering.

## Tekniske detaljer

- Filer som endres:
  - `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` — ny `presentation`-prop, conversation-renderer (ny intern komponent `ConversationShell` + `LaraMessage` / `UserReply` helpers), kollapset historikk for fullførte steg.
  - `src/pages/TrustCenterProfile.tsx` — locked landing erstattes av inline samtale; fade-overgang ved `onCompleted`.
- Styling bruker eksisterende design-tokens (`bg-muted`, `bg-primary/10`, `text-primary`, `border-border`) — ingen nye farger.
- Animasjon via Tailwind `animate-in` / `transition-opacity`; ingen nye avhengigheter.
- i18n: nye Lara-meldinger legges som inline NB/EN-strenger på samme måte som resten av filen (`isNb ? "…" : "…"`).
