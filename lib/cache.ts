import { supabase } from "@/lib/supabase";

export async function getCachedAnswer(message: string) {
  const { data } = await supabase
    .from("ai_cache")
    .select("*")
    .ilike("question", `%${message}%`)
    .limit(1)
    .single();

  return data?.answer || null;
}

export async function saveCache(question: string, answer: string) {
  await supabase.from("ai_cache").insert({
    question,
    answer,
  });
}
