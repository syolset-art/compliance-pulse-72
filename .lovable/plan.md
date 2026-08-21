# Plan: RoPA — bakgrunns-autogenerering + oppgavekø (revidert) og utkast-bugfiks

## 1) BUG: Manuelt opprettet behandlingsaktivitet blir stående som «Utkast»
**Årsak:** `ProcessingActivityWizardDialog` lagrer `status: "draft"` når bruker velger «Lagre utkast» (eller når «Bekreft og opprett» er deaktivert pga. ubesvartha AI-forslag). Det finnes **ingen vei tilbake**: `ProcessCard` viser bare en utkast-banner uten bekreft-knapp, og `onEdit` i `ProcessProfile` er en tom funksjon. Utkast kan aldri bekreftes → henger på «Utkast» for alltid.

**Fiks:**
- `ProcessCard`: «Bekreft utkast»-knapp i utkast-banneret → setter `status=active`, tømmer `ai_suggested_fields`, setter `confirmed_by/confirmed_at`, og markerer koblede `user_tasks` som fullført.
- `ProcessCard` «Rediger» åpner `ProcessingActivityWizardDialog` i **redigeringsmodus** (forhåndsutfylt, UPDATE i stedet for INSERT) slik at felt kan rettes før bekreftelse.

## 2) Endret retning: automatisk utkast i bakgrunnen + oppgavekø
- Når et system tilordnes et arbeidsområde (`assignOwner` i `Systems.tsx`): IKKE åpne veiviser. Kall `suggest-processing-activity` i bakgrunnen, lagre komplett utkast i `system_processes` (status `draft`, AI-foreslåtte felt merket i `ai_suggested_fields`).
- Opprett oppgave i eksisterende `user_tasks`-kø (vises på dashbordets «Neste handlinger» og Oppgaver): «Gå gjennom behandlingsaktivitet for «X»». Ny kolonne `user_tasks.process_id` kobler oppgaven til utkastet; `UserTasksList` får «Gå gjennom»-knapp → `/processes/:id`.
- Behandlingsansvarlig = alltid virksomhetens juridiske navn (`company_profile.legal_name`), aldri en ansatt. Låst felt, som før.
- AI-genererte felt er merket som forslag til menneske bekrefter — ingenting bekreftes automatisk.
- Toast når utkastet er klart: «Lara har laget et utkast — se Oppgaver».

## Berørte filer
- `supabase` migrasjon: `user_tasks.process_id` (FK → system_processes, ON DELETE CASCADE)
- `src/lib/ropaAutoDraft.ts` (ny): bakgrunnsgenerering + oppgaveoppretting
- `src/pages/Systems.tsx`: erstatt veiviser-auto-åpning med bakgrunnskall
- `src/components/process/ProcessCard.tsx`: bekreft-knapp + redigeringsveiviser
- `src/components/dialogs/ProcessingActivityWizardDialog.tsx`: redigeringsmodus
- `src/hooks/useUserTasks.ts` + `src/components/tasks/UserTasksList.tsx`: process_id + «Gå gjennom»-CTA
