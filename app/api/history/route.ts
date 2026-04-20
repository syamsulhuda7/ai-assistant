import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { session_id } = await req.json();

  if (!session_id) {
    return Response.json({ messages: [] });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return Response.json({ messages: [] });
  }

  return Response.json({
    messages: data,
  });
}
