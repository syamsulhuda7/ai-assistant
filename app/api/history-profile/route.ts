import { supabase } from "@/lib/supabase";

const allowedOrigins = [
  "http://localhost:5173",
  "https://syam7profile.vercel.app",
];

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Handle preflight request
export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");

  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  const { session_id } = await req.json();

  if (!session_id) {
    return Response.json({ messages: [] }, { headers: getCorsHeaders(origin) });
  }

  const { data, error } = await supabase
    .from("messages_profile")
    .select("*")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return Response.json({ messages: [] }, { headers: getCorsHeaders(origin) });
  }

  return Response.json({ messages: data }, { headers: getCorsHeaders(origin) });
}
