import { supabase } from "@/integrations/supabase/client";

/**
 * Genererer et komplett utkast til behandlingsaktivitet (RoPA) i bakgrunnen
 * når et system tilordnes et arbeidsområde. Utkastet lagres med status
 * «draft» og AI-foreslåtte felt merket i ai_suggested_fields. En oppgave
 * legges i brukerens oppgavekø (user_tasks) slik at et menneske kan gå
 * gjennom og bekrefte når det passer – ingen forstyrrende veiviser.
 *
 * Juridisk krav (Vilde): controller_name er ALLTID virksomhetens juridiske
 * navn fra company_profile – aldri en ansatt.
 */
export async function generateRopaDraftForSystem(args: {
  systemId: string;
  systemName: string;
  isNb: boolean;
}): Promise<{ processId: string | null }> {
  const { systemId, systemName, isNb } = args;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  // Behandlingsansvarlig = alltid juridisk person
  const { data: profile } = await supabase
    .from("company_profile")
    .select("legal_name, name")
    .maybeSingle();
  const controllerName = profile?.legal_name || profile?.name || null;

  let purpose = "";
  let description = "";
  let legalBasis = "";
  let dataClass = "";

  try {
    const { data, error } = await supabase.functions.invoke("suggest-processing-activity", {
      body: { system_id: systemId, system_name: systemName, language: isNb ? "nb" : "en" },
    });
    if (!error && data?.suggestion) {
      purpose = data.suggestion.purpose || "";
      description = data.suggestion.description || "";
      legalBasis = data.suggestion.legal_basis || "";
      dataClass = data.suggestion.suggested_data_class || "";
    }
  } catch (e) {
    console.error("RoPA auto-draft: AI-forslag feilet, lager tomt utkast", e);
  }

  // Merk alle felt Lara har foreslått – ingen av dem er menneske-bekreftet ennå
  const aiSuggested = Object.fromEntries(
    Object.entries({
      purpose: !!purpose,
      legal_basis: !!legalBasis,
      data_class: !!dataClass,
    }).filter(([, v]) => v),
  );

  const { data: inserted, error: insertError } = await supabase
    .from("system_processes")
    .insert([
      {
        system_id: systemId,
        name: isNb ? `Bruk av ${systemName}` : `Use of ${systemName}`,
        purpose: purpose || null,
        description: description || null,
        data_class: dataClass || null,
        special_categories: null,
        legal_basis: legalBasis || null,
        controller_name: controllerName,
        status: "draft",
        ai_suggested_fields: aiSuggested,
        confirmed_by: null,
        confirmed_at: null,
      },
    ] as never)
    .select("id")
    .single();

  if (insertError) throw insertError;
  const processId = (inserted as { id: string } | null)?.id ?? null;

  // Legg oppgave i brukerens eksisterende oppgavekø (dashbord + Oppgaver)
  if (userId && processId) {
    const { error: taskError } = await supabase.from("user_tasks").insert([
      {
        user_id: userId,
        title: isNb
          ? `Gå gjennom behandlingsaktivitet for «${systemName}»`
          : `Review processing activity for "${systemName}"`,
        description: isNb
          ? "Lara har generert et utkast til behandlingsaktivitet for dette systemet. Kontroller formål, datatype og behandlingsgrunnlag – og bekreft for å aktivere."
          : "Lara generated a draft processing activity for this system. Review purpose, data class and legal basis – then confirm to activate.",
        status: "ny",
        process_id: processId,
      },
    ] as never);
    if (taskError) console.error("RoPA auto-draft: kunne ikke opprette oppgave", taskError);
  }

  return { processId };
}
