
# Konsistent terminologi: Bevis (evidence) vs. Dokumentasjon (documentation)

I dag brukes "bevis" og "dokumentasjon" om hverandre. Vi trenger én klar definisjon som brukes overalt.

## Terminologi (forslag)

- **Bevis** = *tilstanden* som viser at et krav er oppfylt (self_reported → attested → verified). Dette er en kvalitetsdimensjon.
- **Dokumentasjon** = *innholdet* — de faktiske filene/dokumentene som utgjør beviset (PDF, DOCX, sertifikat, attestasjon).

Kort formel: **Dokumentasjon er selve filen. Bevis er hvor mye tillit vi kan ha til den.**

## Endringer i UI-tekst (ManualDocumentationDialog)

| Sted | Før | Etter |
|---|---|---|
| Status-hjelp (implementert) | "innført, krever egenrapportert dokumentasjon" | "innført — bevis er egenrapportert dokumentasjon dere har lastet opp" |
| Status-hjelp (verifisert) | "krever signert dokument fra uavhengig organ" | "bevis er signert/attestert av uavhengig organ" |
| Upload-label | "Last opp dokumentasjon" | Beholdes (dette *er* dokumentasjon) |
| Upload-hjelp tittel | "Hvorfor er dokumentasjon påkrevd?" | "Hvorfor kreves dokumentasjon som bevis?" |
| Upload-hjelp brødtekst | "Uten dokumentasjon regnes kravet som egenrapportert og gir lav bevisverdi" | "Uten dokumentasjon har kravet ingen bevisverdi — det står bare som en påstand" |
| Verifisert-callout / bekreftelse | "Last opp det signerte dokumentet…" / "opplastede dokumentet er signert" | Behold "dokument(et)" — konkret filreferanse |

## Endringer i eksisterende badges (requirementStatusModel)

- "Bevis påkrevd" → "Dokumentasjon mangler" (mer handlingsrettet; brukeren skal laste opp *dokumentasjon*)
- Beholder "Egenrapportert / Attestert / Verifisert" som **bevisnivåer** — disse beskriver graden av tillit, ikke selve filen.

## Regel som formuleres i memory

Legger til en `mem://style/terminology-evidence-vs-documentation` som:
- **Dokumentasjon (documentation)** = filen/artefakten. Brukes i knapper og opplasting.
- **Bevis (evidence)** = tillitsgrad. Brukes i badges/statusspråk (evidence tier).
- Ikke bland: si aldri "krever bevis" om en filopplasting — si "krever dokumentasjon". Si aldri "dokumentasjonsnivå" om tillit — si "bevisnivå".

## Ikke inkludert
- Ingen refaktor av `evidenceStatus.ts`-nøkler eller `EvidenceState`-typer (kun labels/UI-tekst).
- Ingen endringer i andre dialogs/komponenter i denne omgang — vi kan speile til `RequirementCard`, `VendorControlsTab` og `AddVerificationDialog` som oppfølging.
- i18n-nøkler for de nye/endrede tekstene i denne dialogen: kun norsk oppdateres nå; engelsk/nederlandsk fortsatt kun for `verifyConfirm`-blokken (eksisterende).

Vil du at jeg også skal oppdatere `RequirementCard.tsx` og `VendorControlsTab.tsx` med samme språk i samme runde?
